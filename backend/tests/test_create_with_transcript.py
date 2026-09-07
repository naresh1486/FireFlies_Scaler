from fastapi.testclient import TestClient

from app.main import app


def _client() -> TestClient:
    return TestClient(app)


def _create_meeting_with_transcript(client: TestClient, transcript: dict) -> dict:
    payload = {
        "title": "Phase 10 Transcript Test",
        "starts_at": "2026-09-07T13:25:00Z",
        "duration_seconds": 180,
        "host": "Naresh Yadav",
        "channel": "my",
        "capture_source": "upload",
        "language": "English (Global)",
        "media_url": "/audio/sample.wav",
        "bookmarked": False,
        "participant_names": ["Naresh Yadav"],
        "transcript": transcript,
    }
    response = client.post("/api/v1/meetings", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def test_create_with_txt_transcript() -> None:
    with _client() as client:
        txt = (
            "00:00 Naresh Yadav: Welcome everyone.\n"
            "00:07 Naresh Yadav: Let's talk about the Q4 roadmap.\n"
            "00:18 Sarah Chen: I think we should focus on the dashboard launch.\n"
        )
        meeting = _create_meeting_with_transcript(
            client,
            {"format": "txt", "text": txt},
        )
        response = client.get(f"/api/v1/meetings/{meeting['id']}/transcript")
        assert response.status_code == 200
        body = response.json()
        assert len(body["segments"]) == 3
        first = body["segments"][0]
        assert first["speaker_name"] == "Naresh Yadav"
        assert first["start_time"] == 0.0
        assert first["sequence"] == 1
        # End times are coalesced from next segment's start.
        assert first["end_time"] == 7.0
        assert body["segments"][2]["speaker_name"] == "Sarah Chen"


def test_create_with_vtt_transcript() -> None:
    with _client() as client:
        vtt = (
            "WEBVTT\n\n"
            "00:00:00.000 --> 00:00:07.000\n"
            "Naresh Yadav: Welcome everyone.\n\n"
            "00:00:07.000 --> 00:00:18.000\n"
            "Sarah Chen: Sounds good.\n"
        )
        meeting = _create_meeting_with_transcript(
            client,
            {"format": "vtt", "text": vtt},
        )
        response = client.get(f"/api/v1/meetings/{meeting['id']}/transcript")
        assert response.status_code == 200
        body = response.json()
        assert len(body["segments"]) == 2
        assert body["segments"][1]["speaker_name"] == "Sarah Chen"


def test_create_with_json_transcript() -> None:
    with _client() as client:
        data = [
            {"speaker_name": "Naresh Yadav", "start_time": 0.0, "end_time": 5.0,
             "text": "First segment"},
            {"speaker_name": "Sarah Chen", "start_time": 5.0, "end_time": 12.0,
             "text": "Second segment"},
        ]
        meeting = _create_meeting_with_transcript(
            client,
            {"format": "json", "text": str(data).replace("'", '"')},
        )
        response = client.get(f"/api/v1/meetings/{meeting['id']}/transcript")
        assert response.status_code == 200
        body = response.json()
        assert len(body["segments"]) == 2
        assert body["segments"][0]["text"] == "First segment"


def test_create_with_invalid_transcript_returns_400() -> None:
    with _client() as client:
        # Monotonic violation: second segment starts before first.
        data = [
            {"speaker_name": "A", "start_time": 10.0, "end_time": 5.0, "text": "backwards"},
            {"speaker_name": "B", "start_time": 0.0, "end_time": 1.0, "text": "earlier"},
        ]
        payload = {            "title": "Bad",
            "starts_at": "2026-09-07T13:25:00Z",
            "duration_seconds": 60,
            "host": "Naresh",
            "transcript": {"format": "json", "text": str(data).replace("'", '"')},
        }
        response = client.post("/api/v1/meetings", json=payload)
        assert response.status_code == 400
        body = response.json()
        assert body["error"]["code"] == "validation_error"


def test_create_with_summary_sections_action_items() -> None:
    with _client() as client:
        payload = {
            "title": "Phase 10 Bundled Create",
            "starts_at": "2026-09-07T13:25:00Z",
            "duration_seconds": 180,
            "host": "Naresh Yadav",
            "channel": "my",
            "capture_source": "upload",
            "language": "English (Global)",
            "media_url": "/audio/sample.wav",
            "bookmarked": False,
            "participant_names": ["Naresh Yadav"],
            "transcript": {"format": "txt", "text": "00:00 Naresh Yadav: Hi\n"},
            "summary": {
                "overview": "Bundled summary.",
                "key_points": ["KP A", "KP B"],
                "decisions": ["Decision A"],
            },
            "notes_sections": [
                {"heading": "Notes", "body": "- Wrap-up (10:00)", "sequence": 1},
                {"heading": "App Overview", "body": "- First (00:07)", "sequence": 2},
            ],
            "action_items": [
                {"title": "Send revised timeline", "assignee": "Mike"},
                {"title": "Prepare proposal", "due_date": "2026-09-20"},
            ],
        }
        response = client.post("/api/v1/meetings", json=payload)
        assert response.status_code == 201, response.text
        mid = response.json()["id"]

        summary = client.get(f"/api/v1/meetings/{mid}/summary").json()
        assert summary["overview"] == "Bundled summary."
        notes = client.get(f"/api/v1/meetings/{mid}/notes").json()
        assert len(notes["sections"]) == 2
        action_items = client.get(f"/api/v1/meetings/{mid}/action-items").json()
        assert action_items["total"] == 2
        transcript = client.get(f"/api/v1/meetings/{mid}/transcript").json()
        assert len(transcript["segments"]) == 1
