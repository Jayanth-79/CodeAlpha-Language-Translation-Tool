"""
Configuration module for the FastAPI application.
Handles reading environment variables using Pydantic Settings.
"""
from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Locate backend root directory to check for environment file
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE_PATH = BACKEND_DIR / ".env"

# Enforce .env file existence and prompt the developer if missing
if not ENV_FILE_PATH.exists():
    raise RuntimeError(
        f"\n========================================================================\n"
        f"CONFIGURATION ERROR: '.env' file not found at {ENV_FILE_PATH}.\n"
        f"Please copy the '.env.example' template to '.env' to start the application:\n\n"
        f"  cp backend/.env.example backend/.env\n"
        f"========================================================================\n"
    )


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables and .env file.
    """
    # Server settings
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    DEBUG: bool = True

    # CORS settings
    ALLOWED_ORIGINS: str = "http://localhost:8080,http://127.0.0.1:8080"

    # LibreTranslate settings (strictly read from configuration; no default URL is hardcoded)
    LIBRETRANSLATE_API_URL: str
    LIBRETRANSLATE_API_KEY: str = ""

    # Pydantic Settings Configuration
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE_PATH),
        env_file_encoding="utf-8",
        extra="ignore"
    )


@lru_cache
def get_settings() -> Settings:
    """
    Retrieve and cache application settings.
    """
    return Settings()
