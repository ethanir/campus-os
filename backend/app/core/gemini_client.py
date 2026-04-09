import json
import base64
import google.generativeai as genai

from app.core.config import settings

genai.configure(api_key=settings.gemini_api_key)


def call_gemini_json(system_prompt: str, user_prompt: str, max_tokens: int = 4096) -> dict:
    """Send a message to Gemini and parse the JSON response."""
    model = genai.GenerativeModel(settings.gemini_model)
    full_prompt = f"{system_prompt}\n\nRespond ONLY with valid JSON. No markdown backticks, no preamble.\n\n{user_prompt}"

    response = model.generate_content(
        full_prompt,
        generation_config=genai.types.GenerationConfig(max_output_tokens=max_tokens),
    )

    raw = response.text.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
    if raw.endswith("```"):
        raw = raw.rsplit("```", 1)[0]
    return json.loads(raw.strip())


def call_gemini_vision_json(system_prompt: str, image_data: bytes, media_type: str, text_prompt: str = "", max_tokens: int = 4096) -> dict:
    """Send an image to Gemini and parse the JSON response."""
    model = genai.GenerativeModel(settings.gemini_model)
    full_prompt = f"{system_prompt}\n\nRespond ONLY with valid JSON. No markdown backticks, no preamble.\n\n{text_prompt}"

    image_part = {
        "mime_type": media_type,
        "data": image_data,
    }

    response = model.generate_content(
        [full_prompt, image_part],
        generation_config=genai.types.GenerationConfig(max_output_tokens=max_tokens),
    )

    raw = response.text.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
    if raw.endswith("```"):
        raw = raw.rsplit("```", 1)[0]
    return json.loads(raw.strip())
