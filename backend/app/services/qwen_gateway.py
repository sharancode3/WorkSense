"""WorkSense Qwen AI Gateway — Bounded Local LLM Conduit.

Enforces:
- Local Ollama runtime execution (qwen3:4b-instruct-2507-q4_K_M)
- asyncio.Semaphore(1) single-request GPU concurrency lock
- Prompt isolation with XML untrusted data boundaries
- Strict Pydantic JSON schema validation and bounded one-shot repair retry
- Calibrated degraded fallback when Ollama is unavailable
- Zero score calculation or autonomous employment decision-making
"""

import asyncio
import json
import logging
import time
from typing import Any, Dict, Optional, Type, TypeVar
import httpx
from pydantic import BaseModel, ValidationError

from app.core.config import get_settings

logger = logging.getLogger("worksense.ai_gateway")

T = TypeVar("T", bound=BaseModel)


class QwenError(Exception):
    """Base exception for Qwen gateway operations."""
    pass


class QwenUnavailableError(QwenError):
    """Raised when Ollama daemon or model is unreachable or times out."""
    pass


class QwenSchemaValidationError(QwenError):
    """Raised when model response cannot be validated against target Pydantic schema."""
    pass


class QwenGateway:
    """Bounded conduit to the local Qwen Ollama instance."""

    def __init__(self):
        self._settings = get_settings()
        self._semaphore = asyncio.Semaphore(1)
        self._ollama_url = self._settings.ollama_url.rstrip("/")
        self._model = self._settings.qwen_model
        self._timeout = self._settings.ollama_timeout_seconds

    async def is_available(self) -> bool:
        """Check if local Ollama daemon is running and model is loaded."""
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{self._ollama_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = [m.get("name") or m.get("model") for m in data.get("models", [])]
                    return any(self._model in m for m in models if m)
                return False
        except Exception:
            return False

    async def generate_structured(
        self,
        system_instruction: str,
        untrusted_input: str,
        target_schema: Type[T],
        prompt_version: str = "v1.0",
        task_context: Optional[Dict[str, Any]] = None,
        max_retries: int = 1,
    ) -> T:
        """Generate structured, schema-validated JSON from local Qwen.

        Guarantees:
        - Concurrency limited to 1 execution slot via Semaphore(1).
        - Untrusted input delimited inside <untrusted_content> XML tags.
        - Strict JSON mode enabled.
        - Automatic one-shot repair prompt upon schema validation failure.
        - Raises QwenUnavailableError or QwenSchemaValidationError on failure.
        """
        prompt = (
            f"{system_instruction}\n\n"
            f"### BOUNDED UNTRUSTED DATA INPUT:\n"
            f"<untrusted_content>\n"
            f"{untrusted_input}\n"
            f"</untrusted_content>\n\n"
            f"### SCHEMA ENFORCEMENT:\n"
            f"You MUST return ONLY valid JSON matching this schema:\n"
            f"{json.dumps(target_schema.model_json_schema())}\n\n"
            f"Do not wrap in markdown codeblocks. Return pure JSON."
        )

        start_time = time.monotonic()

        async with self._semaphore:
            raw_text = await self._call_ollama(prompt)
            duration_ms = int((time.monotonic() - start_time) * 1000)
            logger.info(f"Qwen raw inference completed in {duration_ms}ms (model: {self._model})")

            # Parse and validate
            try:
                parsed_json = self._extract_json(raw_text)
                return target_schema.model_validate(parsed_json)
            except (json.JSONDecodeError, ValidationError) as err:
                logger.warning(f"Initial schema validation failed for {target_schema.__name__}: {err}. Attempting repair prompt.")

                if max_retries > 0:
                    # Bounded one-shot repair prompt
                    repair_prompt = (
                        f"The previous JSON output failed validation:\n"
                        f"Validation error: {str(err)}\n"
                        f"Previous output: {raw_text}\n\n"
                        f"Please output strictly corrected JSON conforming to this schema:\n"
                        f"{json.dumps(target_schema.model_json_schema())}"
                    )
                    repair_raw = await self._call_ollama(repair_prompt)
                    try:
                        repaired_json = self._extract_json(repair_raw)
                        return target_schema.model_validate(repaired_json)
                    except Exception as repair_err:
                        logger.error(f"Repair validation failed: {repair_err}")
                        raise QwenSchemaValidationError(f"Model failed schema conformance for {target_schema.__name__}: {repair_err}")

                raise QwenSchemaValidationError(f"Model failed schema conformance for {target_schema.__name__}: {err}")

    async def _call_ollama(self, prompt: str) -> str:
        """Low-level HTTP call to Ollama generate endpoint."""
        url = f"{self._ollama_url}/api/generate"
        payload = {
            "model": self._model,
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.1,  # Low variance for deterministic extraction & reasoning
                "top_p": 0.9,
            },
        }

        try:
            timeout_cfg = httpx.Timeout(self._timeout, connect=2.0)
            async with httpx.AsyncClient(timeout=timeout_cfg) as client:
                res = await client.post(url, json=payload)
                if res.status_code != 200:
                    raise QwenUnavailableError(f"Ollama returned HTTP {res.status_code}: {res.text}")
                data = res.json()
                response_text = data.get("response", "")
                if not response_text:
                    raise QwenUnavailableError("Ollama returned empty response string")
                return response_text
        except httpx.TimeoutException:
            logger.error(f"Ollama inference timed out after {self._timeout}s")
            raise QwenUnavailableError(f"Local Qwen timed out after {self._timeout}s")
        except httpx.ConnectError:
            logger.error("Could not connect to local Ollama daemon on port 11434")
            raise QwenUnavailableError("Local Ollama daemon is offline or unreachable")
        except Exception as e:
            logger.error(f"Ollama call failed with exception: {e}")
            raise QwenUnavailableError(f"Ollama generation failure: {str(e)}")

    def _extract_json(self, text: str) -> Dict[str, Any]:
        """Strip markdown fences if present and decode JSON."""
        cleaned = text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        # Find first '{' and last '}'
        start_idx = cleaned.find("{")
        end_idx = cleaned.rfind("}")
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            cleaned = cleaned[start_idx:end_idx + 1]

        return json.loads(cleaned)


# Global singleton instance
qwen_gateway = QwenGateway()
