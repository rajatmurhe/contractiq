#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -x .venv/bin/python ]]; then
  echo 'Create .venv and install requirements-review.txt first.' >&2
  exit 1
fi
if [[ ! -f src/frontend/dist/index.html ]]; then
  echo 'Build the frontend with npm --prefix src/frontend run build first.' >&2
  exit 1
fi
export PYTHONPATH="src/agent${PYTHONPATH:+:$PYTHONPATH}"
exec .venv/bin/python -m uvicorn app.review.api:app --host "${REVIEW_HOST:-127.0.0.1}" --port "${PORT:-8017}"
