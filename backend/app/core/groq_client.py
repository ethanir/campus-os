import json
import base64
from pathlib import Path
import httpx
from app.core.config import settings


class GroqError(Exception):
    """Friendly error for Groq API failures."""
    pass


def _handle_groq_error(e):
    """Convert Groq HTTP errors into user-friendly messages."""
    status = e.response.status_code if hasattr(e, 'response') else 0
    if status == 413:
        raise GroqError("Your course materials are too large for the free AI tier. Try removing some materials or upgrade to Premium for 6x more context.")
    elif status == 429:
        raise GroqError("Free AI is rate-limited right now. Wait a moment and try again, or upgrade to Premium for unlimited speed.")
    elif status == 503 or status == 502:
        raise GroqError("Free AI is temporarily unavailable. Try again in a minute, or upgrade to Premium for reliable access.")
    else:
        raise GroqError(f"Free AI returned an error (HTTP {status}). Try again or upgrade to Premium for more reliable results.")


def call_groq_json(system_prompt: str, user_prompt: str, max_tokens: int = 4096) -> dict:
    """Send a message to Groq (Llama 3.3 70B) and parse JSON response."""
    system_with_json = system_prompt + "\n\nRespond ONLY with valid JSON. No markdown, no backticks, no preamble."
    
    try:
        response = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.groq_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.groq_model,
                "messages": [
                    {"role": "system", "content": system_with_json},
                    {"role": "user", "content": user_prompt},
                ],
                "max_tokens": min(max_tokens, 8000),
                "temperature": 0.3,
            },
            timeout=120.0,
        )
        response.raise_for_status()
    except httpx.HTTPStatusError as e:
        _handle_groq_error(e)
    except httpx.TimeoutException:
        raise GroqError("Free AI timed out. Your materials may be too large, or the server is busy. Try again or upgrade to Premium.")
    except httpx.RequestError:
        raise GroqError("Could not reach free AI server. Try again in a moment.")
    
    raw = response.json()["choices"][0]["message"]["content"].strip()
    return _parse_json(raw)


def call_groq_vision_json(system_prompt: str, user_prompt: str, image_paths: list, max_tokens: int = 4096) -> dict:
    """Send text + images to Groq (Llama 4 Scout) and parse JSON response."""
    system_with_json = system_prompt + "\n\nRespond ONLY with valid JSON. No markdown, no backticks, no preamble."
    
    content_parts = []
    
    added = 0
    for img_path in (image_paths or []):
        if added >= 2:
            break
        if not Path(img_path).exists():
            continue
        try:
            with open(img_path, "rb") as f:
                img_data = f.read()
            b64 = base64.standard_b64encode(img_data).decode("utf-8")
            content_parts.append({"type": "text", "text": f"[Page image: {Path(img_path).stem}]"})
            content_parts.append({
                "type": "image_url",
                "image_url": {"url": f"data:image/png;base64,{b64}"}
            })
            added += 1
        except Exception:
            continue
    
    content_parts.append({"type": "text", "text": user_prompt})
    
    try:
        response = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.groq_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "meta-llama/llama-4-scout-17b-16e-instruct",
                "messages": [
                    {"role": "system", "content": system_with_json},
                    {"role": "user", "content": content_parts},
                ],
                "max_tokens": min(max_tokens, 8000),
                "temperature": 0.3,
            },
            timeout=120.0,
        )
        response.raise_for_status()
    except httpx.HTTPStatusError as e:
        _handle_groq_error(e)
    except httpx.TimeoutException:
        raise GroqError("Free AI timed out processing your images. Try with fewer reference images or upgrade to Premium.")
    except httpx.RequestError:
        raise GroqError("Could not reach free AI server. Try again in a moment.")
    
    raw = response.json()["choices"][0]["message"]["content"].strip()
    return _parse_json(raw)


def _parse_json(raw: str) -> dict:
    """Parse JSON from Groq response, handling common issues."""
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
    if raw.endswith("```"):
        raw = raw.rsplit("```", 1)[0]
    raw = raw.strip()
    if not raw.startswith("{") and not raw.startswith("["):
        start = raw.find("{")
        if start >= 0:
            raw = raw[start:]
    # Find the last closing brace in case of trailing garbage
    last_brace = raw.rfind("}")
    if last_brace >= 0:
        raw = raw[:last_brace + 1]
    try:
        return json.loads(raw, strict=False)
    except json.JSONDecodeError:
        # Try fixing common issues: unescaped newlines in strings
        import re
        cleaned = re.sub(r'(?<!\\)\\n', '\\\\n', raw)
        try:
            return json.loads(cleaned, strict=False)
        except json.JSONDecodeError:
            # Last resort: extract submission/study_version field manually
            for key in ["submission", "study_version", "draft", "content"]:
                match = re.search(r'"%s"\\s*:\\s*"(.*?)(?:(?<!\\\\)")' % key, raw, re.DOTALL)
                if match:
                    return {key: match.group(1).replace(\'\\\\n\', \'\\n\').replace(\'\\\\"\'  , \'\"\'), "notes": "JSON was malformed, content may be incomplete"}
            raise GroqError("Free AI returned a malformed response. Try again — results vary between attempts.")
