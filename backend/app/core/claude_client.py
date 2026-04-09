import json
import anthropic

from app.core.config import settings

client = anthropic.Anthropic(api_key=settings.anthropic_api_key, timeout=120.0)


def call_claude(system_prompt: str, user_prompt: str, max_tokens: int = 4096) -> str:
    """Send a message to Claude and return the text response."""
    message = client.messages.create(
        model=settings.claude_model,
        max_tokens=max_tokens,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )
    return message.content[0].text


def call_claude_json(system_prompt: str, user_prompt: str, max_tokens: int = 4096) -> dict:
    """Send a message to Claude and parse the JSON response."""
    system_with_json = (
        system_prompt
        + "\n\nRespond ONLY with valid JSON. No markdown, no backticks, no preamble."
    )
    raw = call_claude(system_with_json, user_prompt, max_tokens)

    # Strip any accidental markdown fences
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1]
    if cleaned.endswith("```"):
        cleaned = cleaned.rsplit("```", 1)[0]
    cleaned = cleaned.strip()

    return json.loads(cleaned, strict=False)


def call_claude_vision_json(system_prompt: str, image_data: bytes, media_type: str, text_prompt: str = "", max_tokens: int = 4096) -> dict:
    """Send an image to Claude and parse the JSON response."""
    import base64
    system_with_json = (
        system_prompt
        + "\n\nRespond ONLY with valid JSON. No markdown, no backticks, no preamble."
    )
    b64 = base64.standard_b64encode(image_data).decode("utf-8")

    message = client.messages.create(
        model=settings.claude_model,
        max_tokens=max_tokens,
        system=system_with_json,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {"type": "base64", "media_type": media_type, "data": b64},
                },
                {"type": "text", "text": text_prompt or "Extract the information from this image."},
            ],
        }],
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
    if raw.endswith("```"):
        raw = raw.rsplit("```", 1)[0]
    return json.loads(raw.strip(), strict=False)
