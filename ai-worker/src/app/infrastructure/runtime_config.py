import asyncio
import json
import logging
import time
from urllib.parse import urlparse

from src.app.core.config import Settings

logger = logging.getLogger(__name__)


class RuntimeConfigProvider:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._cached_gemini_api_key: str | None = None
        self._cache_expires_at = 0.0

    async def get_gemini_api_key(self) -> str:
        now = time.monotonic()
        if self._cached_gemini_api_key and now < self._cache_expires_at:
            return self._cached_gemini_api_key

        redis_key = await self._read_gemini_api_key_from_redis()
        api_key = redis_key or self._settings.gemini_api_key
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not configured in Redis runtime config or environment.")

        self._cached_gemini_api_key = api_key
        self._cache_expires_at = now + max(self._settings.ai_runtime_config_cache_seconds, 0)
        return api_key

    async def _read_gemini_api_key_from_redis(self) -> str | None:
        try:
            raw_config = await _redis_get_cache_value(
                self._settings.redis_url,
                self._settings.ai_runtime_config_key,
            )
            if not raw_config:
                return None

            payload = json.loads(raw_config)
            api_key = payload.get("geminiApiKey")
            if isinstance(api_key, str) and api_key.strip():
                return api_key.strip()
        except Exception as exc:
            logger.warning("Failed to read AI runtime config from Redis; falling back to environment key: %s", exc)

        return None


async def _redis_get_cache_value(redis_url: str, key: str) -> str | None:
    parsed = urlparse(redis_url)
    host = parsed.hostname or "localhost"
    port = parsed.port or 6379
    password = parsed.password
    db = int(parsed.path.lstrip("/") or "0")

    reader, writer = await asyncio.open_connection(host, port)
    try:
        if password:
            await _send_command(reader, writer, "AUTH", password)
        if db:
            await _send_command(reader, writer, "SELECT", str(db))
        response = await _send_command(reader, writer, "HGET", key, "data")
        if response is None:
            response = await _send_command(reader, writer, "GET", key)
        return response if isinstance(response, str) else None
    finally:
        writer.close()
        await writer.wait_closed()


async def _send_command(
    reader: asyncio.StreamReader,
    writer: asyncio.StreamWriter,
    *parts: str,
) -> str | None:
    encoded_parts = [part.encode("utf-8") for part in parts]
    command = f"*{len(encoded_parts)}\r\n".encode("utf-8")
    for part in encoded_parts:
        command += f"${len(part)}\r\n".encode("utf-8") + part + b"\r\n"

    writer.write(command)
    await writer.drain()
    return await _read_response(reader)


async def _read_response(reader: asyncio.StreamReader) -> str | None:
    line = await reader.readline()
    if not line:
        raise ConnectionError("Redis closed the connection.")

    prefix = line[:1]
    payload = line[1:].rstrip(b"\r\n")

    if prefix == b"+":
        return payload.decode("utf-8")
    if prefix == b"$":
        length = int(payload)
        if length == -1:
            return None
        data = await reader.readexactly(length)
        await reader.readexactly(2)
        return data.decode("utf-8")
    if prefix == b"-":
        raise RuntimeError(payload.decode("utf-8"))
    if prefix == b":":
        return payload.decode("utf-8")

    raise RuntimeError(f"Unsupported Redis response type: {prefix!r}")
