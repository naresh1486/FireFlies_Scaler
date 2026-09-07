# Backend — Fireflies Clone

FastAPI + SQLAlchemy + Pydantic.

## Setup

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

- Health: http://localhost:8000/api/v1/health
- Default user: http://localhost:8000/api/v1/users/me
- OpenAPI docs: http://localhost:8000/docs

## Configuration

See `.env.example`.

## Tests

```bash
python -m pytest
```