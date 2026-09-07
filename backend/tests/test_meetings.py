from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.main import app


def _client() -> TestClient:
    return TestClient(app)


def _create_meeting(client: TestClient, **overrides) -> dict:
    payload = {
        "title": "Q4 Product Strategy",
        "starts_at": "2026-09-07T13:25:00Z",
        "duration_seconds": 1800,
        "host": "Naresh Yadav",
        "channel": "my",
        "capture_source": "upload",
        "language": "English (Global)",
        "media_url": "/audio/sample.wav",
        "bookmarked": False,
        "participant_names": ["Naresh Yadav", "Sarah Chen"],
    }
    payload.update(overrides)
    response = client.post("/api/v1/meetings", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def test_create_meeting() -> None:
    with _client() as client:
        meeting = _create_meeting(client)
        assert meeting["title"] == "Q4 Product Strategy"
        assert meeting["host"] == "Naresh Yadav"
        assert meeting["duration_seconds"] == 1800
        assert meeting["bookmarked"] is False
        names = sorted(p["name"] for p in meeting["participants"])
        assert names == ["Naresh Yadav", "Sarah Chen"]


def test_list_meetings_default_recent() -> None:
    with _client() as client:
        _create_meeting(client, title="First Meeting", starts_at="2026-09-01T10:00:00Z")
        _create_meeting(client, title="Second Meeting", starts_at="2026-09-15T10:00:00Z")
        response = client.get("/api/v1/meetings")
        assert response.status_code == 200
        body = response.json()
        assert body["total"] >= 2
        titles = [m["title"] for m in body["items"]]
        assert titles[0] == "Second Meeting"  # more recent first


def test_get_meeting_by_id() -> None:
    with _client() as client:
        m = _create_meeting(client, title="Get By Id Test")
        response = client.get(f"/api/v1/meetings/{m['id']}")
        assert response.status_code == 200
        assert response.json()["title"] == "Get By Id Test"


def test_get_meeting_not_found() -> None:
    with _client() as client:
        response = client.get("/api/v1/meetings/99999")
        assert response.status_code == 404
        body = response.json()
        assert body["error"]["code"] == "not_found"


def test_update_meeting_metadata() -> None:
    with _client() as client:
        m = _create_meeting(client, title="Original Title")
        response = client.patch(
            f"/api/v1/meetings/{m['id']}",
            json={"title": "Updated Title", "bookmarked": True},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["title"] == "Updated Title"
        assert body["bookmarked"] is True


def test_delete_meeting() -> None:
    with _client() as client:
        m = _create_meeting(client, title="Delete Me")
        response = client.delete(f"/api/v1/meetings/{m['id']}")
        assert response.status_code == 204
        response = client.get(f"/api/v1/meetings/{m['id']}")
        assert response.status_code == 404


def test_search_by_title() -> None:
    with _client() as client:
        _create_meeting(client, title="Roadmap Discussion")
        _create_meeting(client, title="Hiring Debrief")
        response = client.get("/api/v1/search?q=roadmap")
        assert response.status_code == 200
        body = response.json()
        assert any("Roadmap" in m["title"] for m in body["meetings"])


def test_search_by_participant_name() -> None:
    with _client() as client:
        _create_meeting(client, title="Standup", participant_names=["Alex Rivera"])
        response = client.get("/api/v1/search?q=alex")
        assert response.status_code == 200
        body = response.json()
        assert any(m for m in body["meetings"])


def test_filter_by_bookmarked() -> None:
    with _client() as client:
        _create_meeting(client, title="Bookmarked One", bookmarked=True)
        _create_meeting(client, title="Not Bookmarked", bookmarked=False)
        response = client.get("/api/v1/meetings", params={"bookmarked": "true"})
        assert response.status_code == 200
        body = response.json()
        assert all(m["bookmarked"] for m in body["items"])
        assert any(m["title"] == "Bookmarked One" for m in body["items"])


def test_filter_by_channel() -> None:
    with _client() as client:
        _create_meeting(client, title="My Channel Meeting", channel="my")
        _create_meeting(client, title="Uploads Channel Meeting", channel="uploads")
        response = client.get("/api/v1/meetings", params={"channel": "uploads"})
        assert response.status_code == 200
        body = response.json()
        assert all(m["channel"] == "uploads" for m in body["items"])


def test_sort_title_asc() -> None:
    with _client() as client:
        # Use unique titles to avoid clashing with any persisted data from
        # previous test runs sharing the same SQLite file.
        a = _create_meeting(client, title="ZZAA Phase6 Test Meeting", starts_at="2026-08-01T10:00:00Z")
        b = _create_meeting(client, title="ZZBB Phase6 Test Meeting", starts_at="2026-08-02T10:00:00Z")
        response = client.get(
            "/api/v1/meetings",
            params={"sort": "title_asc", "page_size": 100},
        )
        body = response.json()
        titles = [m["title"] for m in body["items"]]
        assert titles.index(a["title"]) < titles.index(b["title"])


def test_pagination() -> None:
    with _client() as client:
        for i in range(5):
            _create_meeting(client, title=f"Meeting {i}")
        response = client.get("/api/v1/meetings", params={"page": 1, "page_size": 2})
        body = response.json()
        assert len(body["items"]) == 2
        assert body["has_more"] is True
        assert body["total"] >= 5


def test_validation_error_on_create() -> None:
    with _client() as client:
        response = client.post(
            "/api/v1/meetings",
            json={"title": "", "starts_at": "2026-09-07T13:25:00Z",
                  "duration_seconds": 60, "host": "Naresh"},
        )
        assert response.status_code == 422  # pydantic-level
        response = client.post(
            "/api/v1/meetings",
            json={
                "title": "Bad Channel",
                "starts_at": "2026-09-07T13:25:00Z",
                "duration_seconds": 60,
                "host": "Naresh",
                "channel": "nonsense",
            },
        )
        assert response.status_code == 422