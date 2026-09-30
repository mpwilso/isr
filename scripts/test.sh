#!/usr/bin/env bash
# The single test entry, for local runs and CI alike. No test calls a model or the network.
set -euo pipefail
cd "$(dirname "$0")/.."

# CI runs each of these Node versions; .github/workflows/ci.yml lists the same ones (tests/repo.test.js checks).
NODE_VERSIONS="22.18.0 24.21.0"
# Limits, so a runaway test fails this run instead of the machine.
MEMORY_MB=512          # heap cap for every Node process, passed down through NODE_OPTIONS
STEP_SECONDS=300       # each step below
TEST_MS=30000          # each test

oldest="${NODE_VERSIONS%% *}"
if ! node -e '
  const [have, need] = [process.versions.node, process.argv[1]].map((v) => v.split(".").map(Number));
  const i = need.findIndex((n, k) => have[k] !== n);
  process.exit(i === -1 || have[i] > need[i] ? 0 : 1);
' "$oldest"; then
  echo "Node $(node --version) is older than $oldest, the oldest version this repo supports."
  exit 1
fi
echo "Node $(node --version). CI runs: $NODE_VERSIONS."
export NODE_OPTIONS="--max-old-space-size=$MEMORY_MB" ISR_MEMORY_MB="$MEMORY_MB"

step() {
  local name="$1"; shift
  echo
  echo "== $name"
  local code=0
  timeout --kill-after=10 "$STEP_SECONDS" "$@" || code=$?
  if [ "$code" -eq 124 ] || [ "$code" -eq 137 ]; then echo "$name: stopped after the ${STEP_SECONDS}s limit"; fi
  if [ "$code" -ne 0 ]; then echo; echo "FAILED: $name"; exit "$code"; fi
}

step "Docs lint" node scripts/lint-docs.js
step "Tests" node --test --test-timeout="$TEST_MS" --test-reporter=spec 'tests/**/*.test.js'

echo
echo "ALL PASSED"
