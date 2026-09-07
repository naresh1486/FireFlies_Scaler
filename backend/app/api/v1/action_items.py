"""Action item endpoints (PATCH/DELETE by id)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas import ActionItemRead, ActionItemUpdate
from app.services import ActionItemService

router = APIRouter(prefix="/action-items", tags=["action-items"])


@router.patch("/{item_id}", response_model=ActionItemRead)
def update_action_item(
    item_id: int,
    payload: ActionItemUpdate,
    db: Session = Depends(get_db),
) -> ActionItemRead:
    return ActionItemService(db).update(item_id, payload)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_action_item(
    item_id: int,
    db: Session = Depends(get_db),
) -> Response:
    ActionItemService(db).delete(item_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)