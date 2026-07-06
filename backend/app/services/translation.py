"""
Translation service interfacing with the Google Cloud Translation REST API.
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
    """Raised when Google Cloud Translation API is unreachable."""
    pass


class ServiceTimeoutException(ServiceException):
    """Raised when connection to Google Cloud Translation times out."""
    pass


class ServiceInvalidResponseException(ServiceException):
    """Raised when Google Cloud Translation returns an invalid or error response."""
    pass


class TranslationService:
    """
    Service responsible for interacting with Google Cloud Translation API v2 endpoints.
    """
    def __init__(self, settings: Settings):
        self.settings = settings
        self.api_key = settings.GOOGLE_TRANSLATE_API_KEY
        self.base_url = "https://translation.googleapis.com/language/translate/v2"

    async def translate(self, request: TranslationRequest) -> TranslationResponse:
        """
        Translates input text from source language to target language.
        
        Args:
            request (TranslationRequest): The translation parameter schema.

        Returns:
            TranslationResponse: The resulting translation and source language metadata.
        """
        url = self.base_url
        logger.info("Sending translation request to Google Cloud Translation API")
        
        payload = {
            "q": [request.text],
            "target": request.target,
            "format": "text"
        }
        if request.source != "auto":
            payload["source"] = request.source

        params = {"key": self.api_key}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=payload, params=params)
                response.raise_for_status()
                data = response.json()
        except httpx.ConnectError as e:
            logger.error(f"Google Translation API connection failure on translate: {e}", exc_info=True)
            raise ServiceUnavailableException("Unable to connect to the Google Translation service.") from e
        except httpx.TimeoutException as e:
            logger.error(f"Google Translation API timeout on translate: {e}", exc_info=True)
            raise ServiceTimeoutException("Google Translation service connection timed out.") from e
        except httpx.HTTPStatusError as e:
            error_msg = str(e)
            try:
                error_data = e.response.json()
                error_msg = error_data.get("error", {}).get("message", error_msg)
            except Exception:
                pass
            logger.error(f"Google Translation API response status error {e.response.status_code} on translate: {error_msg}", exc_info=True)
            raise ServiceInvalidResponseException(
                f"Google Translation service returned an error status: {e.response.status_code}. Detail: {error_msg}"
            ) from e
        except (ValueError, TypeError) as e:
            logger.error(f"Failed to parse JSON response on translate: {e}", exc_info=True)
            raise ServiceInvalidResponseException("Invalid response format received from Google Translation service.") from e
        except Exception as e:
            logger.error(f"Unexpected error during translation: {e}", exc_info=True)
            raise ServiceException("An unexpected error occurred in the Google Translation service.") from e

        try:
            translations = data["data"]["translations"]
            translated_text = translations[0]["translatedText"]
            return TranslationResponse(translated_text=translated_text)
        except (KeyError, TypeError, IndexError) as e:
            logger.error(f"Validation failed for Google Translation response data: {e}", exc_info=True)
            raise ServiceInvalidResponseException("Google Translation response schema mismatch.") from e

    async def get_supported_languages(self) -> List[LanguageResponse]:
        """
        Retrieves the list of supported languages from Google Cloud Translation API.

        Returns:
            List[LanguageResponse]: List of language definitions.
        """
        url = f"{self.base_url}/languages"
        logger.info("Fetching supported languages from Google Cloud Translation API")
        
        params = {
            "key": self.api_key,
            "target": "en"  # Request names in English to match frontend schema
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
        except httpx.ConnectError as e:
            logger.error(f"Google Translation API connection failure on languages: {e}", exc_info=True)
            raise ServiceUnavailableException("Unable to connect to the Google Translation service.") from e
        except httpx.TimeoutException as e:
            logger.error(f"Google Translation API timeout on languages: {e}", exc_info=True)
            raise ServiceTimeoutException("Google Translation service connection timed out.") from e
        except httpx.HTTPStatusError as e:
            error_msg = str(e)
            try:
                error_data = e.response.json()
                error_msg = error_data.get("error", {}).get("message", error_msg)
            except Exception:
                pass
            logger.error(f"Google Translation API response status error {e.response.status_code} on languages: {error_msg}", exc_info=True)
            raise ServiceInvalidResponseException(
                f"Google Translation service returned an error status: {e.response.status_code}. Detail: {error_msg}"
            ) from e
        except (ValueError, TypeError) as e:
            logger.error(f"Failed to parse JSON response on languages: {e}", exc_info=True)
            raise ServiceInvalidResponseException("Invalid response format received from Google Translation service.") from e
        except Exception as e:
            logger.error(f"Unexpected error when fetching languages: {e}", exc_info=True)
            raise ServiceException("An unexpected error occurred in the Google Translation service.") from e

        try:
            languages_data = data["data"]["languages"]
            return [
                LanguageResponse(code=lang["language"], name=lang["name"])
                for lang in languages_data
            ]
        except (KeyError, TypeError, IndexError) as e:
            logger.error(f"Validation failed for languages data from Google Translation API: {e}", exc_info=True)
            raise ServiceInvalidResponseException("Google Translation languages schema mismatch.") from e

    async def detect_language(self, text: str) -> List[DetectionResponse]:
        """
        Identifies the source language of a given text.

        Args:
            text (str): Input text to analyze.

        Returns:
            List[DetectionResponse]: List of detected languages with confidence scores.
        """
        url = f"{self.base_url}/detect"
        logger.info("Sending language detection request to Google Cloud Translation API")
        
        payload = {
            "q": [text]
        }
        params = {"key": self.api_key}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=payload, params=params)
                response.raise_for_status()
                data = response.json()
        except httpx.ConnectError as e:
            logger.error(f"Google Translation API connection failure on detect: {e}", exc_info=True)
            raise ServiceUnavailableException("Unable to connect to the Google Translation service.") from e
        except httpx.TimeoutException as e:
            logger.error(f"Google Translation API timeout on detect: {e}", exc_info=True)
            raise ServiceTimeoutException("Google Translation service connection timed out.") from e
        except httpx.HTTPStatusError as e:
            error_msg = str(e)
            try:
                error_data = e.response.json()
                error_msg = error_data.get("error", {}).get("message", error_msg)
            except Exception:
                pass
            logger.error(f"Google Translation API response status error {e.response.status_code} on detect: {error_msg}", exc_info=True)
            raise ServiceInvalidResponseException(
                f"Google Translation service returned an error status: {e.response.status_code}. Detail: {error_msg}"
            ) from e
        except (ValueError, TypeError) as e:
            logger.error(f"Failed to parse JSON response on detect: {e}", exc_info=True)
            raise ServiceInvalidResponseException("Invalid response format received from Google Translation service.") from e
        except Exception as e:
            logger.error(f"Unexpected error during detection: {e}", exc_info=True)
            raise ServiceException("An unexpected error occurred in the Google Translation service.") from e

        try:
            detections_list = data["data"]["detections"]
            return [
                DetectionResponse(
                    confidence=float(item.get("confidence", 1.0)),
                    language=item["language"]
                )
                for item in detections_list[0]
            ]
        except (KeyError, TypeError, IndexError) as e:
            logger.error(f"Validation failed for detection response data: {e}", exc_info=True)
            raise ServiceInvalidResponseException("Google Translation detection response schema mismatch.") from e
