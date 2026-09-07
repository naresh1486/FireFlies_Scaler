"""API v1 router aggregator."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import action_items, health, meetings, participants, search, users

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(users.router, prefix="/users")
api_router.include_router(meetings.router)
api_router.include_router(participants.router)
api_router.include_router(search.router)
api_router.include_router(action_items.router)