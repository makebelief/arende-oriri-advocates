#!/usr/bin/env bash
set -euo pipefail
REPO="${1:-$HOME/arende-oriri-advocates}"
python3 "$REPO/configure_arende_cms.py" "$REPO"
