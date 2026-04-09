from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    database_url: str = "sqlite:///./campus_os.db"
    upload_dir: str = "./uploads"
    claude_model: str = "claude-sonnet-4-20250514"
    max_upload_size_mb: int = 50
    jwt_secret: str = "change-this-to-a-random-secret-in-production"

    class Config:
        env_file = ".env"

    @property
    def upload_path(self) -> Path:
        p = Path(self.upload_dir)
        p.mkdir(parents=True, exist_ok=True)
        return p


settings = Settings()
