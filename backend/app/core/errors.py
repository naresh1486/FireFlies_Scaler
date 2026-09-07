from __future__ import annotations

from typing import Any

from fastapi import HTTPException, status


class AppError(HTTPException):
    code: str = "internal_error"
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR

    def __init__(
        self,
        message: str,
        *,
        code: str | None = None,
        status_code: int | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            status_code=status_code or self.status_code,
            detail={
                "code": code or self.code,
                "message": message,
                "details": details or {},
            },
        )


class NotFoundError(AppError):
    code = "not_found"
    status_code = status.HTTP_404_NOT_FOUND


class ValidationError(AppError):
    code = "validation_error"
    status_code = status.HTTP_400_BAD_REQUEST


class ConflictError(AppError):
    code = "conflict"
    status_code = status.HTTP_409_CONFLICT