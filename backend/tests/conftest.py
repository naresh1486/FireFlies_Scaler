from __future__ import annotations

import os
import tempfile
from pathlib import Path

# Configure isolated test database before any application modules are imported
_test_dir = tempfile.TemporaryDirectory()
_test_db_path = Path(_test_dir.name) / "test.db"
os.environ["DATABASE_URL"] = f"sqlite:///{_test_db_path}"
os.environ["APP_ENV"] = "test"

import pytest
from app.core.config import settings
from app.core.db import Base, SessionLocal, engine
from app.models import User


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).first() is None:
            db.add(User(name=settings.default_user_name))
            db.commit()
    finally:
        db.close()
    yield
    _test_dir.cleanup()
