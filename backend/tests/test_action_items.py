from datetime import date, datetime, timezone

from fastapi.testclient import TestClient

from app.main import app


def _client() -> TestClient:
    return TestClient(app)


def _create_meeting(client: TestClient, **overrides) -> dict:
    payload = {
        "title": "Phase 6 Meeting",
        "starts_at": "2026-09-07T13:25:00Z",
        "duration_seconds": 1800,
        "host": "Naresh Yadav",
        "channel": "my",
        "capture_source": "upload",
        "language": "English (Global)",
        "media_url": "/audio/sample.wav",
        "bookmarked": False,
        "participant_names": ["Naresh Yadav"],
    }
    payload.update(overrides)
    response = client.post("/api/v1/meetings", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def test_get_summary_404_when_missing() -> None:
    with _client() as client:
        m = _create_meeting(client)
        response = client.get(f"/api/v1/meetings/{m['id']}/summary")
        assert response.status_code == 404
        body = response.json()
        assert body["error"]["code"] == "not_found"


def test_get_notes_returns_empty_list() -> None:
    with _client() as client:
        m = _create_meeting(client)
        response = client.get(f"/api/v1/meetings/{m['id']}/notes")
        assert response.status_code == 200
        body = response.json()
        assert body["meeting_id"] == m["id"]
        assert body["sections"] == []


def test_create_action_item_and_list() -> None:
    with _client() as client:
        m = _create_meeting(client)
        response = client.post(
            f"/api/v1/meetings/{m['id']}/action-items",
            json={
                "title": "Prepare technical proposal",
                "assignee": "John",
                "due_date": "2026-09-15",
            },
        )
        assert response.status_code == 201
        item = response.json()
        assert item["title"] == "Prepare technical proposal"
        assert item["completed"] is False
        assert item["completed_at"] is None
        assert item["assignee"] == "John"

        response = client.get(f"/api/v1/meetings/{m['id']}/action-items")
        assert response.status_code == 200
        body = response.json()
        assert body["total"] == 1
        assert body["items"][0]["id"] == item["id"]


def test_complete_and_uncomplete_action_item() -> None:
    with _client() as client:
        m = _create_meeting(client)
        response = client.post(
            f"/api/v1/meetings/{m['id']}/action-items",
            json={"title": "Send revised timeline"},
        )
        item_id = response.json()["id"]

        response = client.patch(f"/api/v1/action-items/{item_id}", json={"completed": True})
        assert response.status_code == 200
        body = response.json()
        assert body["completed"] is True
        assert body["completed_at"] is not None

        response = client.patch(f"/api/v1/action-items/{item_id}", json={"completed": False})
        body = response.json()
        assert body["completed"] is False
        assert body["completed_at"] is None


def test_delete_action_item() -> None:
    with _client() as client:
        m = _create_meeting(client)
        response = client.post(
            f"/api/v1/meetings/{m['id']}/action-items",
            json={"title": "Discarded task"},
        )
        item_id = response.json()["id"]
        response = client.delete(f"/api/v1/action-items/{item_id}")
        assert response.status_code == 204
        response = client.patch(f"/api/v1/action-items/{item_id}", json={"completed": True})
        assert response.status_code == 404


def test_delete_meeting_cascades_action_items() -> None:
    with _client() as client:
        m = _create_meeting(client)
        client.post(f"/api/v1/meetings/{m['id']}/action-items", json={"title": "Task A"})
        client.post(f"/api/v1/meetings/{m['id']}/action-items", json={"title": "Task B"})
        response = client.get(f"/api/v1/meetings/{m['id']}/action-items")
        assert response.json()["total"] == 2

        response = client.delete(f"/api/v1/meetings/{m['id']}")
        assert response.status_code == 204
        # Meeting is gone, so listing action items now 404s.
        response = client.get(f"/api/v1/meetings/{m['id']}/action-items")
        assert response.status_code == 404


def test_topics_and_chapters_derived_from_sections() -> None:
    with _client() as client:
        m = _create_meeting(client)
        from datetime import datetime
        from app.core.db import SessionLocal
        from app.models import SummarySection

        db = SessionLocal()
        try:
            now = datetime.utcnow()
            db.add_all(
                [
                    SummarySection(meeting_id=m["id"], heading="Notes", subheading=None, body="- Wrap-up (10:00)", sequence=1, created_at=now),
                    SummarySection(meeting_id=m["id"], heading="App Overview", subheading=None, body="- First bullet (00:07)\n  - Sub bullet", sequence=2, created_at=now),
                    SummarySection(meeting_id=m["id"], heading="User Interface", subheading=None, body="- Recent meetings left, calendar right (00:59)", sequence=3, created_at=now),
                ]
            )
            db.commit()
        finally:
            db.close()

        topics = client.get(f"/api/v1/meetings/{m['id']}/topics").json()
        names = [t["name"] for t in topics["topics"]]
        assert "App Overview" in names
        assert "User Interface" in names
        assert "Notes" not in names  # wrapper is filtered out

        chapters = client.get(f"/api/v1/meetings/{m['id']}/chapters").json()
        assert len(chapters["chapters"]) == 3
        # Chapters come from sections in their creation/sequence order.
        starts = [c["start_time"] for c in chapters["chapters"]]
        assert starts == [600.0, 7.0, 59.0]
        # The heading of the first chapter is the first section's heading.
        assert chapters["chapters"][0]["heading"] == "Notes"
        assert chapters["chapters"][1]["heading"] == "App Overview"
        assert chapters["chapters"][2]["heading"] == "User Interface"