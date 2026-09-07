"""FastAPI application factory."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import __version__
from app.api import api_router
from app.core.config import settings
from app.core.db import Base, SessionLocal, engine
from app.core.errors import AppError
from app.core.logging import get_logger, setup_logging

setup_logging()
log = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    # Seed the default user so the meetings library is usable on a fresh DB.
    db = SessionLocal()
    try:
        from app.models import User
        if db.query(User).first() is None:
            db.add(User(name=settings.default_user_name))
            db.commit()
            log.info("Seeded default user '%s'", settings.default_user_name)
    finally:
        db.close()
    seed_result: dict | None = None
    if settings.seed_on_start:
        from app.seed.seed import seed_database
        seed_result = seed_database()
    log.info(
        "Boot: app=%s env=%s version=%s db=%s seed=%s",
        __version__,
        settings.app_env,
        __version__,
        settings.database_url,
        seed_result or "skipped",
    )
    if settings.app_env == "production":
        if not _cors_origins():
            log.warning(
                "CORS_ORIGINS is empty in production. All cross-origin "
                "requests will be rejected by the browser."
            )
    yield


def _cors_origins() -> list[str]:
    raw = settings.cors_origins.strip()
    if not raw:
        return []
    return [o.strip().rstrip("/") for o in raw.split(",") if o.strip()]


_origins = _cors_origins()
_has_wildcard = "*" in _origins

app = FastAPI(
    title="Fireflies Clone API",
    version=__version__,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins if not _has_wildcard else ["*"],
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=not _has_wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
    payload = exc.detail if isinstance(exc.detail, dict) else {"code": exc.code, "message": str(exc.detail)}
    return JSONResponse(status_code=exc.status_code, content={"error": payload})


app.include_router(api_router, prefix="/api/v1")