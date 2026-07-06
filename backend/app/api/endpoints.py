"""
API endpoints for translation, language listing, and language detection.
"""
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import TranslationRequest, TranslationResponse, LanguageResponse, DetectionResponse
from app.services.translation import (
    TranslationService,
    ServiceException,
    ServiceUnavailableException,
    ServiceTimeoutException,
    ServiceInvalidResponseException,
)
from app.core.config import get_settings, Settings

logger = logging.getLogger("app.api.endpoints")
router = APIRouter()


def get_translation_service(settings: Settings = Depends(get_settings)) -> TranslationService:
    """
    Dependency injector for TranslationService.
    """
    return TranslationService(settings)


@router.post(
    "/translate",
    response_model=TranslationResponse,
    status_code=status.HTTP_200_OK,
    summary="Translate text content"
)
async def translate_text(
    request: TranslationRequest,
    service: TranslationService = Depends(get_translation_service)
):
    """
    Translate text using the LibreTranslate engine settings.
    """
    try:
        return await service.translate(request)
    except NotImplementedError as e:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Translation failure: {str(e)}"
        )


@router.get(
    "/languages",
    response_model=List[LanguageResponse],
    status_code=status.HTTP_200_OK,
    summary="List all supported languages"
)
async def list_languages(
    service: TranslationService = Depends(get_translation_service)
):
    """
    Retrieve list of available translation languages.
    """
    logger.info("Received API request to list supported languages")
    try:
        return await service.get_supported_languages()
    except ServiceUnavailableException as e:
        logger.error(f"Translation service is unreachable: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )
    except ServiceTimeoutException as e:
        logger.error(f"Translation service request timed out: {e}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=str(e)
        )
    except ServiceInvalidResponseException as e:
        logger.error(f"Translation service returned an invalid response: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e)
        )
    except ServiceException as e:
        logger.error(f"Translation service error occurred: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except NotImplementedError as e:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error in list_languages endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while loading supported languages."
        )


@router.post(
    "/detect",
    response_model=List[DetectionResponse],
    status_code=status.HTTP_200_OK,
    summary="Detect language from text input"
)
async def detect_language(
    text: str,
    service: TranslationService = Depends(get_translation_service)
):
    """
    Identify language input source based on character-sequence patterns.
    """
    try:
        return await service.detect_language(text)
    except NotImplementedError as e:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Language detection failure: {str(e)}"
        )
