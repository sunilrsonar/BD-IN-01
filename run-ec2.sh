#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$ROOT_DIR/server"
CLIENT_DIR="$ROOT_DIR/client"
LOG_DIR="$ROOT_DIR/logs"
PID_FILE="$ROOT_DIR/.badam-satti.pid"
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-5000}"
PUBLIC_IP="${PUBLIC_IP:-$(hostname -I 2>/dev/null | awk '{print $1}')}"

mkdir -p "$LOG_DIR"

echo "Preparing Badam Satti for EC2..."

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Node.js and npm are required but not installed on this machine."
  echo
  echo "For Ubuntu on EC2, run:"
  echo "  sudo apt update"
  echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
  echo "  sudo apt-get install -y nodejs"
  echo
  echo "Then verify:"
  echo "  node -v"
  echo "  npm -v"
  echo
  echo "After that, run ./run-ec2.sh again."
  exit 1
fi

if [[ -f "$PID_FILE" ]]; then
  OLD_PID="$(cat "$PID_FILE")"
  if [[ -n "$OLD_PID" ]] && kill -0 "$OLD_PID" 2>/dev/null; then
    echo "Stopping previous app process ($OLD_PID)..."
    kill "$OLD_PID"
    sleep 1
  fi
  rm -f "$PID_FILE"
fi

echo "Installing server dependencies..."
if [[ -f "$SERVER_DIR/package-lock.json" ]]; then
  npm --prefix "$SERVER_DIR" ci --ignore-scripts
else
  npm --prefix "$SERVER_DIR" install --ignore-scripts
fi

echo "Installing client dependencies..."
if [[ -f "$CLIENT_DIR/package-lock.json" ]]; then
  npm --prefix "$CLIENT_DIR" ci
else
  npm --prefix "$CLIENT_DIR" install
fi

echo "Building client..."
npm --prefix "$CLIENT_DIR" run build

echo "Starting server on $HOST:$PORT ..."
nohup env HOST="$HOST" PORT="$PORT" npm --prefix "$SERVER_DIR" start > "$LOG_DIR/app.log" 2>&1 &
APP_PID=$!
echo "$APP_PID" > "$PID_FILE"

sleep 2

if ! kill -0 "$APP_PID" 2>/dev/null; then
  echo "App failed to start. Check $LOG_DIR/app.log"
  exit 1
fi

echo "Badam Satti is running."
echo "PID: $APP_PID"
echo "URL: http://${PUBLIC_IP:-localhost}:$PORT"
echo "Health: http://${PUBLIC_IP:-localhost}:$PORT/health"
echo "Logs: $LOG_DIR/app.log"
