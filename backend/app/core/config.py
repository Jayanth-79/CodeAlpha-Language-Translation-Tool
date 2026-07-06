"""
Configuration module for the FastAPI application.
Handles reading environment variables using Pydantic Settings.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


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

    # LibreTranslate settings
    LIBRETRANSLATE_API_URL: str = "http://localhost:5000"
    LIBRETRANSLATE_API_KEY: str = ""

    # Pydantic Settings Configuration
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


@lru_cache
def get_settings() -> Settings:
    """
    Retrieve and cache application settings.
    """
    return Settings()
