import json
import anthropic

from app.core.config import settings

client = anthropic.Anthropic(api_key=settings.anthropic_api_key)


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

    return json.loads(cleaned)
