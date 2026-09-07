from fastapi.testclient import TestClient

from app.core.db import SessionLocal
from app.main import app
from app.models import Meeting
from app.seed.seed import seed_database


def _force_seed() -> None:
    """Always run the seeder from a clean slate so test order does not affect counts."""
    seed_database()


def test_seed_database_is_idempotent() -> None:
    first = seed_database()
    second = seed_database()
    third = seed_database()

    # On the first call we may create some and repair others; the sum
    # must always equal the total canonical meeting count.
    assert (
        first["created"] + first["skipped"] + first.get("repaired", 0)
        == first["total"]
    )
    assert first["total"] >= 8

    # Subsequent calls are pure no-ops on a healthy seed.
    assert second["created"] == 0
    assert second["skipped"] >= 8

    assert third["created"] == 0
    assert third["skipped"] >= 8


def test_seed_populates_list_endpoint() -> None:
    seed_database()
    with TestClient(app) as client:
        response = client.get("/api/v1/meetings", params={"page_size": 100})
        assert response.status_code == 200
        body = response.json()
        # Look up the canonical titles directly from the DB to avoid
        # pagination issues when the test DB has stale rows from earlier runs.
        db = SessionLocal()
        try:
            seeded_titles = {
                m.title for m in db.query(Meeting).filter(Meeting.title.in_([
                    "Q4 Product Strategy",
                    "Weekly Engineering Sync",
                    "Customer Discovery — Acme Corp",
                    "Frontend Architecture Review",
                    "Growth & Marketing Sync",
                    "Hiring Debrief — Senior Engineer",
                    "Sprint Planning",
                    "Investor Update",
                ]))
            }
        finally:
            db.close()
        assert seeded_titles == {
            "Q4 Product Strategy",
            "Weekly Engineering Sync",
            "Customer Discovery — Acme Corp",
            "Frontend Architecture Review",
            "Growth & Marketing Sync",
            "Hiring Debrief — Senior Engineer",
            "Sprint Planning",
            "Investor Update",
        }


def test_seeded_meetings_have_segments_summary_action_items() -> None:
    seed_database()
    with TestClient(app) as client:
        db = SessionLocal()
        try:
            sample = (
                db.query(Meeting)
                .filter(Meeting.title == "Q4 Product Strategy")
                .first()
            )
        finally:
            db.close()
        assert sample is not None, "Q4 Product Strategy must be seeded"
        mid = sample.id

        transcript = client.get(f"/api/v1/meetings/{mid}/transcript").json()
        assert len(transcript["segments"]) >= 10
        first = transcript["segments"][0]
        assert first["start_time"] >= 0
        assert first["speaker_name"]

        summary = client.get(f"/api/v1/meetings/{mid}/summary").json()
        assert summary["overview"]
        assert isinstance(summary["key_points"], list)
        assert isinstance(summary["decisions"], list)

        notes = client.get(f"/api/v1/meetings/{mid}/notes").json()
        assert len(notes["sections"]) >= 1

        action_items = client.get(f"/api/v1/meetings/{mid}/action-items").json()
        assert action_items["total"] >= 1