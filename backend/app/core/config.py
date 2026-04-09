from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    gemini_api_key: str = ""
    database_url: str = "sqlite:///./campus_os.db"
    upload_dir: str = "./uploads"
    claude_model: str = "claude-sonnet-4-20250514"
    gemini_model: str = "gemini-2.5-flash"
    max_upload_size_mb: int = 50
    jwt_secret: str = "change-this-to-a-random-secret-in-production"
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    frontend_url: str = "https://yourcourseai.com"
    frontend_url: str = "https://yourcourseai.com"

    class Config:
        env_file = ".env"

    @property
    def upload_path(self) -> Path:
        p = Path(self.upload_dir)
        p.mkdir(parents=True, exist_ok=True)
        return p


settings = Settings()
