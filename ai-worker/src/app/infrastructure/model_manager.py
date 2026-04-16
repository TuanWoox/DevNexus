import os
os.environ["HF_HOME"] = "D:/AI_Cache"

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
_TEXT_MODEL_ID = "unitary/multilingual-toxic-xlm-roberta"
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


# Candidate prompts used for zero-shot CLIP classification
_SAFE_PROMPTS = ["a safe image", "a normal software engineering screenshot", "code on a screen"]
_UNSAFE_PROMPTS = ["explicit nudity", "graphic violence", "hate speech imagery", "disturbing content"]
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

        logger.info("Loading XLM-RoBERTa toxicity model on device: %s …", self._device)
        self._text_tokenizer = AutoTokenizer.from_pretrained(_TEXT_MODEL_ID)
        self._text_model = AutoModelForSequenceClassification.from_pretrained(
            _TEXT_MODEL_ID,
            torch_dtype=torch.float16 if self._device == "cuda" else torch.float32,
        ).to(self._device)
        self._text_model.eval()
        logger.info("XLM-RoBERTa loaded ✓")

        logger.info("Loading CLIP model …")
        self._clip_processor = CLIPProcessor.from_pretrained(_CLIP_MODEL_ID)
        self._clip_model = CLIPModel.from_pretrained(
            _CLIP_MODEL_ID,
            torch_dtype=torch.float16 if self._device == "cuda" else torch.float32,
        ).to(self._device)
        self._clip_model.eval()
        logger.info("CLIP loaded ✓")

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
        Run XLM-RoBERTa toxicity classification on a text snippet.
        Returns a score from 0.0 (safe) to 1.0 (toxic).
        """
        if not self._loaded:
            raise RuntimeError("Models are not loaded. Call load_models() first.")

        inputs = self._text_tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding=True,
        ).to(self._device)

        with torch.no_grad():
            logits = self._text_model(**inputs).logits

        probs = torch.softmax(logits, dim=-1)[0]

        # Map label id → label name using model's config
        id2label: dict[int, str] = self._text_model.config.id2label
        scores = {id2label[i]: probs[i].item() for i in range(len(id2label))}

        # The positive-class label may be "toxic" or index 1 depending on the checkpoint
        toxic_score = scores.get(_TOXIC_LABEL, probs[-1].item())
        predicted_label = max(scores, key=lambda k: scores[k])

        return TextAnalysisResult(score=toxic_score, label=predicted_label)

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
