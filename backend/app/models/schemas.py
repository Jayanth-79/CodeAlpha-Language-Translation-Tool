"""
Pydantic schemas for request validation and response serialization.
"""
from typing import Optional
from pydantic import BaseModel, Field


class TranslationRequest(BaseModel):
    """
    Schema representing a request to translate text.
    """
    q: str = Field(..., description="The source text to translate.")
    source: str = Field("auto", description="The source language code (e.g., 'en', 'es', or 'auto' for auto-detection).")
    target: str = Field(..., description="The target language code to translate the text into.")
    format: Optional[str] = Field("text", description="Format of the source text: 'text' or 'html'.")


class TranslationResponse(BaseModel):
    """
    Schema representing the translation response.
    """
    translated_text: str = Field(..., description="The translated text result.")
    source_language: Optional[str] = Field(None, description="The detected source language code.")

    class Config:
        populate_by_name = True


class LanguageResponse(BaseModel):
    """
    Schema representing a supported language definition.
    """
    code: str = Field(..., description="The ISO 639-1 language code.")
    name: str = Field(..., description="The human-readable language name.")


class DetectionResponse(BaseModel):
    """
    Schema representing a language detection result.
    """
    confidence: float = Field(..., description="Confidence score of the detection (0.0 to 1.0).")
    language: str = Field(..., description="The detected ISO 639-1 language code.")
