#!/usr/bin/env bash
# Runs the headless runner several times on the same inputs, then lines up the scripts with compare-runs.js.
#   scripts/variance.sh --story FILE [--record FILE_OR_TASK_FOLDER] [--runs N] [--out FOLDER] [--more] [--model MODEL] [--budget USD] [--hide-risks-from-writer]
# Every run calls a model and costs money, so it refuses more than MAX_RUNS runs without --more.
# Saves run N in FOLDER/run-N; FOLDER defaults to isr-variance-TIMESTAMP, which git ignores.
# Exits 0 after the comparison, and 2 on bad usage, an existing FOLDER, a run that could not finish, or fewer than two scripts.
# ISR_RUNNER replaces the runner, so tests can drive this with a stand-in and never call a model.
set -euo pipefail
repo="$(cd "$(dirname "$0")/.." && pwd)"

MAX_RUNS=5
runs=3
out="isr-variance-$(date -u +%Y%m%dT%H%M%S)"
more=no
story=no
pass=()
usage() {
  echo "Usage: scripts/variance.sh --story FILE [--record FILE_OR_TASK_FOLDER] [--runs N] [--out FOLDER] [--more] [--model MODEL] [--budget USD] [--hide-risks-from-writer]" >&2
  exit 2
}
while [ $# -gt 0 ]; do
  case "$1" in
    --more) more=yes; shift ;;
    --hide-risks-from-writer) pass+=("$1"); shift ;;
    --runs|--out|--story|--record|--model|--budget)
      [ $# -ge 2 ] || usage
      case "$1" in
        --runs) runs="$2" ;;
        --out) out="$2" ;;
        --story) story=yes; pass+=("$1" "$2") ;;
        *) pass+=("$1" "$2") ;;
      esac
      shift 2 ;;
    *) usage ;;
  esac
done
[ "$story" = yes ] || usage
[[ "$runs" =~ ^[0-9]+$ ]] && [ "$runs" -ge 2 ] || { echo "--runs takes a number, 2 or more." >&2; usage; }
if [ "$runs" -gt "$MAX_RUNS" ] && [ "$more" = no ]; then
  echo "Not run: $runs runs is more than $MAX_RUNS, and each run costs money. Add --more to run them anyway." >&2
  exit 2
fi
if [ -e "$out" ]; then
  echo "Not run: $out already exists, and its runs would mix with these." >&2
  exit 2
fi

if [ -n "${ISR_RUNNER:-}" ]; then runner=("$ISR_RUNNER"); else runner=(node "$repo/runner/run.js"); fi
scripts=()
for i in $(seq 1 "$runs"); do
  code=0
  "${runner[@]}" "${pass[@]}" --out "$out/run-$i" > /dev/null || code=$?
  if [ "$code" -ne 0 ] && [ "$code" -ne 1 ]; then
    echo "Stopped: run $i could not finish (exit $code)." >&2
    exit 2
  fi
  if [ -f "$out/run-$i/script.md" ]; then scripts+=("$out/run-$i/script.md"); fi
done
if [ "${#scripts[@]}" -lt 2 ]; then
  echo "Not compared: ${#scripts[@]} of $runs runs saved a script." >&2
  exit 2
fi
node "$repo/scripts/compare-runs.js" "${scripts[@]}"
