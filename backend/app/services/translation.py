"""
Translation service interfacing with the LibreTranslate API.
"""
import logging
from typing import List
import httpx
from app.core.config import Settings
from app.models.schemas import TranslationRequest, TranslationResponse, LanguageResponse, DetectionResponse

logger = logging.getLogger("app.services.translation")


class ServiceException(Exception):
    """Base exception for translation service errors."""
    pass


class ServiceUnavailableException(ServiceException):
    """Raised when LibreTranslate API is unreachable."""
    pass


class ServiceTimeoutException(ServiceException):
    """Raised when connection to LibreTranslate times out."""
    pass


class ServiceInvalidResponseException(ServiceException):
    """Raised when LibreTranslate returns an invalid or error response."""
    pass


class TranslationService:
    """
    Service responsible for interacting with LibreTranslate API endpoints.
    """
    def __init__(self, settings: Settings):
        self.settings = settings
        self.api_url = settings.LIBRETRANSLATE_API_URL
        self.api_key = settings.LIBRETRANSLATE_API_KEY

    async def translate(self, request: TranslationRequest) -> TranslationResponse:
        """
        Translates input text from source language to target language.
        
        Args:
            request (TranslationRequest): The translation parameter schema.

        Returns:
            TranslationResponse: The resulting translation and source language metadata.
        """
        raise NotImplementedError("Translation endpoint connection logic is not yet implemented.")

    async def get_supported_languages(self) -> List[LanguageResponse]:
        """
        Retrieves the list of supported languages from LibreTranslate API.

        Returns:
            List[LanguageResponse]: List of language definitions.
        """
        url = f"{self.api_url.rstrip('/')}/languages"
        logger.info(f"Fetching supported languages from LibreTranslate API: {url}")
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                params = {}
                if self.api_key:
                    params["api_key"] = self.api_key
                    
                response = await client.get(url, params=params)
                response.raise_for_status()
                languages_data = response.json()
        except httpx.ConnectError as e:
            logger.error(f"LibreTranslate connection failure: {e}", exc_info=True)
            raise ServiceUnavailableException("Unable to connect to the translation service.") from e
        except httpx.TimeoutException as e:
            logger.error(f"LibreTranslate timeout: {e}", exc_info=True)
            raise ServiceTimeoutException("Translation service connection timed out.") from e
        except httpx.HTTPStatusError as e:
            logger.error(f"LibreTranslate response status error {e.response.status_code}: {e.response.text}", exc_info=True)
            raise ServiceInvalidResponseException(
                f"Translation service returned an error status: {e.response.status_code}"
            ) from e
        except (ValueError, TypeError) as e:
            logger.error(f"Failed to parse JSON response from LibreTranslate: {e}", exc_info=True)
            raise ServiceInvalidResponseException("Invalid response format received from translation service.") from e
        except Exception as e:
            logger.error(f"Unexpected error when fetching languages: {e}", exc_info=True)
            raise ServiceException("An unexpected error occurred in the translation service.") from e

        # Validate structure and serialize using Pydantic schema
        try:
            return [LanguageResponse(code=lang["code"], name=lang["name"]) for lang in languages_data]
        except (KeyError, TypeError) as e:
            logger.error(f"Validation failed for languages data from LibreTranslate: {e}", exc_info=True)
            raise ServiceInvalidResponseException("Returned languages schema mismatch.") from e

    async def detect_language(self, text: str) -> List[DetectionResponse]:
        """
        Identifies the source language of a given text.

        Args:
            text (str): Input text to analyze.

        Returns:
            List[DetectionResponse]: List of detected languages with confidence scores.
        """
        raise NotImplementedError("Language detection client logic is not yet implemented.")
