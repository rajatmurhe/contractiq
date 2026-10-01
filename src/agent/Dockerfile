FROM python:3.12-slim AS base
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

FROM base AS build
COPY pyproject.toml .
RUN pip install uv && uv pip install -e ".[dev]" --system

FROM base AS runtime
RUN groupadd -r contractiq && useradd -r -g contractiq contractiq

COPY --from=build /usr/local/lib/python3.12 /usr/local/lib/python3.12
COPY --from=build /usr/local/bin /usr/local/bin
COPY . .

RUN chown -R contractiq:contractiq /app
USER contractiq

EXPOSE 8000
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
    CMD curl -f http://localhost:8000/health/live || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
