"""
Aggregated API router configuration.
"""
from fastapi import APIRouter
from app.api.endpoints import router as translation_router

api_router = APIRouter()

# Register routes with clean namespace tags
api_router.include_router(translation_router, tags=["Translation Engine Service"])
