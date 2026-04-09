import json
import base64
from pathlib import Path
import httpx
from app.core.config import settings


def call_groq_json(system_prompt: str, user_prompt: str, max_tokens: int = 4096) -> dict:
    """Send a message to Groq (Llama 3.3 70B) and parse JSON response."""
    system_with_json = system_prompt + "\n\nRespond ONLY with valid JSON. No markdown, no backticks, no preamble."
    
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
    
    raw = response.json()["choices"][0]["message"]["content"].strip()
    return _parse_json(raw)


def call_groq_vision_json(system_prompt: str, user_prompt: str, image_paths: list, max_tokens: int = 4096) -> dict:
    """Send text + images to Groq (Llama 4 Scout) and parse JSON response."""
    system_with_json = system_prompt + "\n\nRespond ONLY with valid JSON. No markdown, no backticks, no preamble."
    
    content_parts = []
    
    # Add images (max 5 to stay within free tier limits)
    added = 0
    for img_path in (image_paths or []):
        if added >= 5:
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
    
    # Add text prompt
    content_parts.append({"type": "text", "text": user_prompt})
    
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
    return json.loads(raw, strict=False)
