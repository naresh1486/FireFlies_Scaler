"""User endpoints (Phase 4 minimal: ensure default user exists)."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_user_repo
from app.core.config import settings
from app.repositories import UserRepository
from app.schemas import UserRead
from app.services import get_or_create_default_user

router = APIRouter(tags=["users"])


@router.get("/me", response_model=UserRead)
def me(repo: UserRepository = Depends(get_user_repo)) -> UserRead:
    return get_or_create_default_user(repo, settings.default_user_name)