#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$ROOT_DIR/.badam-satti.pid"

if [[ ! -f "$PID_FILE" ]]; then
  echo "No PID file found. The app does not appear to be running from run-ec2.sh."
  exit 0
fi

APP_PID="$(cat "$PID_FILE")"

if [[ -z "$APP_PID" ]]; then
  echo "PID file is empty. Cleaning it up."
  rm -f "$PID_FILE"
  exit 0
fi

if kill -0 "$APP_PID" 2>/dev/null; then
  echo "Stopping Badam Satti process ($APP_PID)..."
  kill "$APP_PID"
  sleep 1

  if kill -0 "$APP_PID" 2>/dev/null; then
    echo "Process is still running. Sending SIGKILL..."
    kill -9 "$APP_PID"
  fi

  echo "Stopped."
else
  echo "Process $APP_PID is not running. Cleaning up stale PID file."
fi

rm -f "$PID_FILE"
