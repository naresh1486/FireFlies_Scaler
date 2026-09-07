"""Health endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app import __version__
from app.core.config import settings
from app.schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", app_env=settings.app_env, version=__version__)