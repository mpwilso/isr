import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintText } from '../scripts/lint-docs.js';

const EM = String.fromCodePoint(0x2014);
const EN = String.fromCodePoint(0x2013);
const lines = (path, text) => lintText(path, text).map((p) => p.line);

test('flags em and en dashes in any file', () => {
  assert.deepEqual(lines('a.md', `one${EM}two`), [1]);
  assert.deepEqual(lines('a.js', `const range = '1${EN}2';`), [1]);
  assert.deepEqual(lines('a.json', `{"a": "b${EM}c"}`), [1]);
});

test('flags a double hyphen used as a dash in prose, not a flag', () => {
  assert.deepEqual(lines('a.md', 'fine -- not fine\nwords--joined\nrun it with --story file.md'), [1, 2]);
});

test('flags a double hyphen dash in code comments only', () => {
  assert.deepEqual(lines('a.sh', 'exec cmd -- args\n# a note -- with a dash'), [2]);
  assert.deepEqual(lines('a.js', 'i--;\n// a note -- with a dash'), [2]);
});

test('flags angle-bracket placeholders outside code', () => {
  assert.deepEqual(lines('a.md', 'Run it on <your file>.'), [1]);
  assert.deepEqual(lines('a.md', 'Run it on `<your file>`.'), []);
  assert.deepEqual(lines('a.md', '```\nrun <your file>\n```'), []);
  assert.deepEqual(lines('a.md', 'See <https://example.com>. <!-- a comment -->'), []);
});

test('the repo files themselves pass', async () => {
  const { execFileSync } = await import('node:child_process');
  const out = execFileSync('node', ['scripts/lint-docs.js'], { encoding: 'utf8' });
  assert.match(out, /, 0 problems/);
});
