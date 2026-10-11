#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if ! command -v ollama >/dev/null; then
  echo 'Install and start Ollama, then load an instruction model before using this command.' >&2
  exit 1
fi
review_local_model="${REVIEW_LOCAL_MODEL:-contractiq-review-16k}"
if [[ -z "${REVIEW_LOCAL_MODEL:-}" ]]; then
  ollama show llama3.2:3b >/dev/null
  ollama create "$review_local_model" -f config/ollama/Modelfile
fi
if ! ollama show "$review_local_model" >/dev/null 2>&1; then
  echo "Start Ollama and make sure $review_local_model is installed." >&2
  exit 1
fi
# Ollama's compatible endpoint accepts this placeholder; it is not a secret.
export REVIEW_LLM_API_KEY=ollama
export REVIEW_LLM_BASE_URL=http://127.0.0.1:11434/v1
export REVIEW_LLM_MODEL="$review_local_model"
export REVIEW_LLM_TIMEOUT_SECONDS=180
export REVIEW_JSON_SCHEMA=1
export REVIEW_INPUT_BYTE_LIMIT=8000
exec ./scripts/start-review.sh
