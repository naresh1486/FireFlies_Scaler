from fastapi.testclient import TestClient

from app.main import app


def test_health() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "ok"
        assert "version" in body


def test_me_seeds_default_user() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/users/me")
        assert response.status_code == 200
        body = response.json()
        assert body["name"] == "Naresh"
        assert body["id"] >= 1


def test_me_idempotent() -> None:
    with TestClient(app) as client:
        first = client.get("/api/v1/users/me").json()
        second = client.get("/api/v1/users/me").json()
        assert first["id"] == second["id"]