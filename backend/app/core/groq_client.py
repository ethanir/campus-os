import json
import httpx
from app.core.config import settings


def call_groq_json(system_prompt: str, user_prompt: str, max_tokens: int = 4096) -> dict:
    """Send a message to Groq (Llama) and parse JSON response."""
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
            "max_tokens": max_tokens,
            "temperature": 0.3,
        },
        timeout=120.0,
    )
    response.raise_for_status()
    
    raw = response.json()["choices"][0]["message"]["content"].strip()
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
