"""FastAPI dependency injection."""

from __future__ import annotations

from collections.abc import Generator

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.errors import NotFoundError
from app.repositories import UserRepository
from app.schemas import UserRead


def get_user_repo(db: Session = Depends(get_db)) -> UserRepository:
    return UserRepository(db)


def get_current_user(repo: UserRepository = Depends(get_user_repo)) -> UserRead:
    user = repo.get_first()
    if user is None:
        raise NotFoundError("Default user not seeded")
    return UserRead.model_validate(user)


def db_session() -> Generator[Session, None, None]:
    yield from get_db()