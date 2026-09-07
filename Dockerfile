# Backend Dockerfile (production-ready)
# Targets Render / Railway / Fly.io / any container host with a persistent
# disk at /app/data. Uses gunicorn + uvicorn workers.
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Persisted SQLite volume mount point.
ENV APP_DATA_DIR=/app/data
RUN mkdir -p /app/data

WORKDIR /app

# Install OS-level deps (none currently required beyond Python stdlib).
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend ./backend

# Run from the backend directory so `app.*` imports resolve.
WORKDIR /app/backend

# Render / Railway expose PORT=8000 by convention.
ENV PORT=8000
EXPOSE 8000

# Sensible defaults — overridable via env at runtime.
ENV APP_ENV=production \
    DATABASE_URL=sqlite:////app/data/app.db \
    SEED_ON_START=true

# 1 worker is plenty for SQLite; bump to 2-4 if you front it with nginx.
CMD ["sh", "-c", "gunicorn app.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT} --workers 1 --timeout 60 --access-logfile -"]