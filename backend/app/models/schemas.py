"""
Pydantic schemas for request validation and response serialization.
"""
import re
from typing import Optional
from pydantic import BaseModel, Field, field_validator, model_validator


class TranslationRequest(BaseModel):
    """
    Schema representing a request to translate text.
    """
    text: str = Field(..., description="The source text to translate.")
    source: str = Field("auto", description="The source language code (e.g., 'en', 'es', or 'auto' for auto-detection).")
    target: str = Field(..., description="The target language code to translate the text into.")

    @field_validator("text")
    @classmethod
    def validate_text(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Text cannot be empty or whitespace-only.")
        if len(v) > 5000:
            raise ValueError("Text cannot exceed 5000 characters.")
        return v

    @field_validator("source", "target")
    @classmethod
    def validate_lang_code(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Language code cannot be empty.")
        # Ensure it follows basic ISO-like format (2-3 letter base, optional subtag, e.g. en, pt-BR, zh-Hans)
        if not re.match(r"^[a-zA-Z]{2,3}(-[a-zA-Z]{2,4})?$", v) and v != "auto":
            raise ValueError(f"Invalid language code format: '{v}'")
        return v.strip()

    @model_validator(mode="after")
    def validate_languages(self) -> 'TranslationRequest':
        if self.target.lower() == "auto":
            raise ValueError("Target language cannot be 'auto'.")
        return self


class TranslationResponse(BaseModel):
    """
    Schema representing the translation response.
    """
    translated_text: str = Field(..., description="The translated text result.")


class LanguageResponse(BaseModel):
    """
    Schema representing a supported language definition.
    """
    code: str = Field(..., description="The ISO 639-1 language code.")
    name: str = Field(..., description="The human-readable language name.")


class DetectionRequest(BaseModel):
    """
    Schema representing a request to detect language.
    """
    text: str = Field(..., description="The text to analyze for language detection.")

    @field_validator("text")
    @classmethod
    def validate_text(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Text cannot be empty or whitespace-only.")
        if len(v) > 5000:
            raise ValueError("Text cannot exceed 5000 characters.")
        return v


class DetectionResponse(BaseModel):
    """
    Schema representing a language detection result.
    """
    confidence: float = Field(..., description="Confidence score of the detection (0.0 to 1.0).")
    language: str = Field(..., description="The detected ISO 639-1 language code.")
