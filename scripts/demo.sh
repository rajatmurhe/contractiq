#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
exec .venv/bin/python scripts/verify_review_deployment.py "${1:-http://127.0.0.1:8017}" "${@:2}"
