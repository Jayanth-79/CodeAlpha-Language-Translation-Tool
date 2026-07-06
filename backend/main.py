"""
Main entrypoint for the Language Translation API.
Initializes FastAPI, mounts static folders, configures CORS, and loads routes.
"""
import sys
from pathlib import Path
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Add current directory to path to ensure modules load correctly under various start environments
CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from app.core.config import get_settings
from app.api.router import api_router

settings = get_settings()

app = FastAPI(
    title="Language Translation API",
    description="Backend API service for the Language Translation Tool, interfacing with LibreTranslate.",
    version="1.0.0",
    debug=settings.DEBUG,
)

# CORS middleware configuration
if settings.ALLOWED_ORIGINS:
    origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Resolve path for static folder and mount if it exists
STATIC_DIR = CURRENT_DIR / "app" / "static"
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Mount API endpoints
app.include_router(api_router, prefix="/api")


@app.get("/health", tags=["System Status"])
async def health_check():
    """
    Health check endpoint to ensure API service availability.
    """
    return {
        "status": "healthy",
        "service": "Language Translation API",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
