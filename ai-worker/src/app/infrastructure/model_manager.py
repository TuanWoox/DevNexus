import os

# Configure Hugging Face cache directory
# In Docker: uses /app/.hf_cache (mounted from D:\Ai-Worker-Model\cache\huggingface)
# Local development: falls back to D:/AI_Cache
_hf_home = "/app/.hf_cache" if os.path.exists("/app") else "D:/ai-worker-store/cache"
os.environ["HF_HOME"] = _hf_home

import logging
from dataclasses import dataclass

import torch
from PIL import Image
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    CLIPModel,
    CLIPProcessor,
)

logger = logging.getLogger(__name__)

# Model identifiers
# In Docker: /app/models/text-model (mounted from D:\Ai-Worker-Model\model\my-final-toxic-model)
# Local development: D:\Learning\Fouth_Year\fine-tunning\my-final-toxic-model
_expected_local_path = "/app/models/my-final-toxic-model" if os.path.exists("/app") else r"D:\ai-worker-store\model\my-final-toxic-model"

# Kiểm tra xem đường dẫn đó có thực sự tồn tại model không

if os.path.exists(_expected_local_path):
    _TEXT_MODEL_ID = _expected_local_path
    logger.info(f"Đã tìm thấy model local. Đang load model từ: {_TEXT_MODEL_ID}")
else:
    # Nếu không tìm thấy, fallback về model mặc định trên Hugging Face
    _TEXT_MODEL_ID = "unitary/multilingual-toxic-xlm-roberta"
    logger.warning(f"Không tìm thấy model fine-tuned tại '{_expected_local_path}'. Sẽ tải model default: {_TEXT_MODEL_ID}")
    
_CLIP_MODEL_ID = "openai/clip-vit-base-patch32"

# Toxicity label returned by the text model for the positive class
_TOXIC_LABEL = "toxic"


@dataclass(frozen=True)
class TextAnalysisResult:
    score: float          # 0.0 (safe) → 1.0 (toxic)
    label: str            # "toxic" | "non-toxic"


@dataclass(frozen=True)
class ImageAnalysisResult:
    score: float          # 0.0 (safe) → 1.0 (inappropriate)
    flagged_concepts: list[str]


_SAFE_PROMPTS = [
    "a normal everyday photograph", 
    "a software engineering or coding screenshot", 
    "a professional office environment",
    "a clean educational diagram"
]

_UNSAFE_PROMPTS = [
    "explicit nudity, pornography, or sexual content", 
    "graphic violence, blood, or gore", 
    "a person holding a gun, knife, or weapon",
    "hate speech imagery, offensive symbols, or racism", 
    "self-harm or disturbing scary content"
]
_ALL_PROMPTS = _SAFE_PROMPTS + _UNSAFE_PROMPTS


class AIModelManager:
    """
    Singleton that owns all local ML models.
    Call `load_models()` once during FastAPI lifespan startup.
    """

    _instance: "AIModelManager | None" = None

    def __init__(self) -> None:
        self._device = "cuda" if torch.cuda.is_available() else "cpu"
        self._text_tokenizer: AutoTokenizer | None = None
        self._text_model: AutoModelForSequenceClassification | None = None
        self._clip_processor: CLIPProcessor | None = None
        self._clip_model: CLIPModel | None = None
        self._loaded = False

    # ------------------------------------------------------------------
    # Singleton accessor
    # ------------------------------------------------------------------

    @classmethod
    def get_instance(cls) -> "AIModelManager":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def load_models(self) -> None:
        """Load both models into RAM. Called once from FastAPI lifespan."""
        if self._loaded:
            logger.warning("AIModelManager.load_models() called more than once — skipping.")
            return

        # Verify model path exists
        # if not os.path.exists(_TEXT_MODEL_ID):
        #     raise RuntimeError(
        #         f"Text model path not found: {_TEXT_MODEL_ID}\n"
        #         f"Expected directory with config.json, pytorch_model.bin, tokenizer.json, etc.\n"
        #         f"Available at {_TEXT_MODEL_ID}: {os.listdir(os.path.dirname(_TEXT_MODEL_ID)) if os.path.exists(os.path.dirname(_TEXT_MODEL_ID)) else 'parent dir not found'}"
        #     )

        logger.info("Loading XLM-RoBERTa toxicity model from: %s on device: %s …", _TEXT_MODEL_ID, self._device)
        try:
            self._text_tokenizer = AutoTokenizer.from_pretrained(_TEXT_MODEL_ID)
            self._text_model = AutoModelForSequenceClassification.from_pretrained(
                _TEXT_MODEL_ID,
                torch_dtype=torch.float16 if self._device == "cuda" else torch.float32,
            ).to(self._device)
            self._text_model.eval()
            logger.info("XLM-RoBERTa loaded ✓")
        except Exception as e:
            logger.error("Failed to load text model from %s: %s", _TEXT_MODEL_ID, str(e))
            raise

        try:
            logger.info("Loading CLIP model …")
            self._clip_processor = CLIPProcessor.from_pretrained(_CLIP_MODEL_ID)
            self._clip_model = CLIPModel.from_pretrained(
                _CLIP_MODEL_ID,
                torch_dtype=torch.float16 if self._device == "cuda" else torch.float32,
            ).to(self._device)
            self._clip_model.eval()
            logger.info("CLIP loaded ✓")
        except Exception as e:
            logger.error("Failed to load CLIP model from %s: %s. Worker will start without it.", _CLIP_MODEL_ID, str(e))

        self._loaded = True
        logger.info("AIModelManager: all models loaded successfully ✓")

    async def unload_models(self) -> None:
        """Release VRAM/RAM. Called from FastAPI lifespan shutdown."""
        self._text_model = None
        self._text_tokenizer = None
        self._clip_model = None
        self._clip_processor = None
        self._loaded = False
        logger.info("AIModelManager: models unloaded.")

    # ------------------------------------------------------------------
    # Inference helpers
    # ------------------------------------------------------------------

    def analyze_text(self, text: str) -> TextAnalysisResult:
        """
        Run XLM-RoBERTa toxicity classification on the full text.
        Long texts are split into 512-token chunks; the worst-chunk score wins.
        """
        if not self._loaded:
            raise RuntimeError("Models are not loaded. Call load_models() first.")

        # Tokenize without truncation to get all token IDs
        # verbose=False suppresses the "sequence length > 512" HuggingFace warning
        all_ids = self._text_tokenizer.encode(text, add_special_tokens=False, verbose=False)

        # Split into 510-token chunks (leaving room for [CLS] and [SEP])
        chunk_size = 510
        chunks = [all_ids[i : i + chunk_size] for i in range(0, max(len(all_ids), 1), chunk_size)]

        id2label: dict[int, str] = self._text_model.config.id2label
        worst_score = 0.0

        for idx, chunk_ids in enumerate(chunks):
            chunk_text = self._text_tokenizer.decode(chunk_ids, skip_special_tokens=True)
            inputs = self._text_tokenizer(
                chunk_text,
                return_tensors="pt",
                truncation=True,
                max_length=512,
                padding=True,
            ).to(self._device)

            with torch.no_grad():
                logits = self._text_model(**inputs).logits

            probs = torch.sigmoid(logits)[0]
            scores = {id2label[i]: probs[i].item() for i in range(len(id2label))}
            chunk_score = scores.get(_TOXIC_LABEL) or scores.get("LABEL_1", probs[-1].item())

            logger.info(
                "DEBUG_TEXT chunk=%d/%d tokens=%d score=%.4f text=%r",
                idx + 1, len(chunks), len(chunk_ids), chunk_score, text[idx * chunk_size * 4 : idx * chunk_size * 4 + 80],
            )

            if chunk_score > worst_score:
                worst_score = chunk_score

        predicted_label = _TOXIC_LABEL if worst_score >= 0.5 else "safe"
        logger.info(
            "DEBUG_TEXT [total_len=%d chunks=%d] worst_score=%.4f",
            len(text), len(chunks), worst_score,
        )
        return TextAnalysisResult(score=worst_score, label=predicted_label)

    def analyze_image(self, image_bytes: bytes) -> ImageAnalysisResult:
        """
        Run CLIP zero-shot classification on raw image bytes.
        Returns a score from 0.0 (safe) to 1.0 (inappropriate).
        """
        if not self._loaded:
            raise RuntimeError("Models are not loaded. Call load_models() first.")

        import io
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        inputs = self._clip_processor(
            text=_ALL_PROMPTS,
            images=image,
            return_tensors="pt",
            padding=True,
        ).to(self._device)

        with torch.no_grad():
            outputs = self._clip_model(**inputs)

        logits = outputs.logits_per_image[0]
        probs = torch.softmax(logits, dim=0)

        # Unsafe prompts start after the safe prompts block
        unsafe_start = len(_SAFE_PROMPTS)
        unsafe_probs = probs[unsafe_start:]
        unsafe_score = float(unsafe_probs.max().item())

        flagged = [
            _UNSAFE_PROMPTS[i]
            for i, p in enumerate(unsafe_probs.tolist())
            if p > 0.25
        ]

        return ImageAnalysisResult(score=unsafe_score, flagged_concepts=flagged)
