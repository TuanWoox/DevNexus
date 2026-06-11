import logging
import shutil
import subprocess
import tempfile
from pathlib import Path

from src.app.schemas.moderation import ModerationMediaManifestItem

logger = logging.getLogger(__name__)

_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
_VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".flv", ".wmv"}


def resolve_media_path(item: ModerationMediaManifestItem) -> Path | None:
    path = Path(item.store_destination)
    if not path.exists() or not path.is_file():
        logger.warning("[Moderation][Media] File not found for media=%s path=%s", item.id, path)
        return None

    extension = path.suffix.lower()
    allowed_extensions = _IMAGE_EXTENSIONS if item.media_type == "Image" else _VIDEO_EXTENSIONS
    if extension not in allowed_extensions:
        logger.warning(
            "[Moderation][Media] Rejected media with unexpected extension: media=%s type=%s ext=%s",
            item.id,
            item.media_type,
            extension,
        )
        return None

    return path


def read_image_bytes(item: ModerationMediaManifestItem) -> bytes | None:
    path = resolve_media_path(item)
    if path is None:
        return None
    return path.read_bytes()


def extract_video_frame_bytes(
    item: ModerationMediaManifestItem,
    *,
    fps: float,
    max_frames: int,
) -> list[tuple[float | None, bytes]]:
    path = resolve_media_path(item)
    if path is None:
        return []

    if shutil.which("ffmpeg") is None:
        logger.warning("[Moderation][Media] ffmpeg not available; skipping video media=%s", item.id)
        return []

    with tempfile.TemporaryDirectory(prefix="devnexus-video-frames-") as temp_dir:
        output_pattern = str(Path(temp_dir) / "frame_%04d.jpg")
        command = [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(path),
            "-vf",
            f"fps={fps}",
            "-frames:v",
            str(max_frames),
            output_pattern,
        ]

        try:
            subprocess.run(command, check=True, capture_output=True)
        except subprocess.CalledProcessError as exc:
            logger.warning(
                "[Moderation][Media] ffmpeg failed for media=%s: %s",
                item.id,
                exc.stderr.decode(errors="ignore")[:300],
            )
            return []

        frames: list[tuple[float | None, bytes]] = []
        for index, frame_path in enumerate(sorted(Path(temp_dir).glob("frame_*.jpg"))):
            timestamp = index / fps if fps > 0 else None
            frames.append((timestamp, frame_path.read_bytes()))
        return frames
