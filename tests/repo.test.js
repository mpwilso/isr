import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getHeapStatistics } from 'node:v8';

const read = (path) => readFileSync(path, 'utf8');

test('CI runs the same Node versions that scripts/test.sh names', () => {
  const pinned = read('scripts/test.sh').match(/^NODE_VERSIONS="([^"]+)"/m)[1].split(' ');
  const matrix = read('.github/workflows/ci.yml').match(/^\s+node: \[([^\]]+)\]/m)[1];
  assert.deepEqual(matrix.split(',').map((v) => v.trim().replace(/'/g, '')), pinned);
});

test('every action in CI is pinned to a full commit SHA', () => {
  const uses = [...read('.github/workflows/ci.yml').matchAll(/uses: (\S+)/g)].map((m) => m[1]);
  assert.ok(uses.length > 0);
  for (const u of uses) assert.match(u, /@[0-9a-f]{40}$/, u);
});

test('the README stays short', () => {
  assert.ok(read('README.md').split('\n').length < 40);
});

test('run from scripts/test.sh, every test process has the memory cap', { skip: !process.env.ISR_MEMORY_MB && 'not run from scripts/test.sh' }, () => {
  const limitMb = getHeapStatistics().heap_size_limit / 1024 / 1024;
  const capMb = Number(process.env.ISR_MEMORY_MB);
  assert.ok(limitMb <= capMb * 1.1, `heap limit ${Math.round(limitMb)} MB, cap ${capMb} MB`);
});
