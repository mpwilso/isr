import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// A stand-in for runner/run.js, so no test calls a model: it logs its arguments, saves a copy of the good fixture
// in its --out folder, and exits with STUB_EXIT.
const STUB = `#!/usr/bin/env bash
echo "$*" >> "$STUB_LOG"
while [ $# -gt 0 ]; do [ "$1" = --out ] && out="$2"; shift; done
mkdir -p "$out" && cp "$STUB_SCRIPT" "$out/script.md"
exit "\${STUB_EXIT:-0}"
`;

function variance(args, { exit = 0 } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'isr-variance-test-'));
  const stub = join(dir, 'stub.sh');
  writeFileSync(stub, STUB, { mode: 0o755 });
  const log = join(dir, 'log');
  writeFileSync(log, '');
  const env = { ...process.env, ISR_RUNNER: stub, STUB_LOG: log, STUB_SCRIPT: resolve('tests/fixtures/good.script.md'), STUB_EXIT: String(exit) };
  const r = spawnSync('bash', [resolve('scripts/variance.sh'), ...args], { cwd: dir, env, encoding: 'utf8' });
  const calls = readFileSync(log, 'utf8').split('\n').filter(Boolean);
  rmSync(dir, { recursive: true, force: true });
  return { ...r, calls };
}

test('variance.sh runs the runner N times, each into its own folder, then compares the scripts', () => {
  const r = variance(['--story', 's.md', '--record', 'rec', '--runs', '2', '--out', 'v', '--model', 'm', '--hide-risks-from-writer']);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(r.calls, [
    '--story s.md --record rec --model m --hide-risks-from-writer --out v/run-1',
    '--story s.md --record rec --model m --hide-risks-from-writer --out v/run-2',
  ]);
  assert.match(r.stdout, /^Run 1: v\/run-1\/script\.md$/m);
  assert.match(r.stdout, /3 of 3 criteria are in the same section in every run\.\n$/);
});

test('variance.sh refuses more runs than its cap without --more, and runs nothing', () => {
  const r = variance(['--story', 's.md', '--runs', '6']);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /6 runs is more than 5/);
  assert.deepEqual(r.calls, []);
  assert.equal(variance(['--story', 's.md', '--runs', '6', '--more', '--out', 'v']).calls.length, 6);
});

test('variance.sh refuses bad usage and runs nothing', () => {
  for (const args of [['--story'], ['--story', 's.md', '--runs', '1'], ['--story', 's.md', '--runs', 'x'], ['--story', 's.md', '--bogus', 'x'], ['--runs', '2']]) {
    const r = variance(args);
    assert.equal(r.status, 2, args.join(' '));
    assert.deepEqual(r.calls, [], args.join(' '));
  }
});

test('variance.sh stops at a run that could not finish, and goes on past one that failed the checker', () => {
  const stopped = variance(['--story', 's.md', '--out', 'v'], { exit: 2 });
  assert.equal(stopped.status, 2);
  assert.equal(stopped.calls.length, 1);
  assert.match(stopped.stderr, /run 1 could not finish/);
  const failed = variance(['--story', 's.md', '--out', 'v'], { exit: 1 });
  assert.equal(failed.status, 0);
  assert.equal(failed.calls.length, 3);
});

test('variance.sh refuses an output folder that already exists', () => {
  const dir = mkdtempSync(join(tmpdir(), 'isr-variance-out-'));
  try {
    const r = variance(['--story', 's.md', '--out', dir]);
    assert.equal(r.status, 2);
    assert.match(r.stderr, /already exists/);
    assert.deepEqual(r.calls, []);
    assert.ok(existsSync(dir));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
