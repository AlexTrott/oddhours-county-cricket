#!/bin/sh
# Production helper: Node adapter + optional ingest sidecar. Never scrapes inside request handlers.
set -eu
node build &
web_pid=$!
if [ "${INGEST_WATCH:-0}" = "1" ]; then
	pnpm ingest --watch &
fi
trap 'kill -TERM $web_pid 2>/dev/null || true' INT TERM
wait "$web_pid"
