#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -x .venv/bin/python ]]; then
  echo 'Create .venv and install requirements-review.txt first.' >&2
  exit 1
fi
if [[ ! -f src/frontend/out/index.html ]]; then
  echo 'Build the frontend with npm --prefix src/frontend run build first.' >&2
  exit 1
fi
export PYTHONPATH="src/agent${PYTHONPATH:+:$PYTHONPATH}"
review_env_args=()
review_env_file="${REVIEW_ENV_FILE:-.env.review}"
if [[ -f "$review_env_file" ]]; then
  review_env_args=(--env-file "$review_env_file")
fi
exec .venv/bin/python -m uvicorn "${review_env_args[@]}" app.review.api:app --host "${REVIEW_HOST:-127.0.0.1}" --port "${PORT:-8017}"
