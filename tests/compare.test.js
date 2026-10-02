import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { compare, readRun } from '../scripts/compare-runs.js';

// Invented scripts: the checker's good fixture, and the invented Pellwick example.
const good = readFileSync('tests/fixtures/good.script.md', 'utf8');
const pellwick = readFileSync('examples/pellwick/skip-a-box.script.md', 'utf8');
const run = (name, text) => ({ name, ...readRun(text) });
const lines = (out) => out.split('\n');

test('a script reads as its Type, the counts its headings give, and the section of each criterion', () => {
  const r = readRun(good);
  assert.equal(r.type, 'Decision needed');
  assert.deepEqual(r.counts, { verified: 1, byHand: 1, confirm: 2, notCovered: 1 });
  assert.deepEqual([...r.criteria], [[1, 'Already verified'], [2, 'Check by hand'], [3, 'Not covered']]);
  assert.equal(readRun(pellwick).counts.confirm, 12, 'the heading count, which includes items not shown');
});

test('two runs that agree say so', () => {
  const out = compare([run('a.md', good), run('b.md', good)]);
  assert.ok(!out.includes('differs'));
  assert.equal(lines(out).at(-1), '3 of 3 criteria are in the same section in every run.');
});

test('a criterion that moved between sections is flagged', () => {
  const moved = good.replace('Covers: criterion 2 (shipping', 'Covers: criterion 3 (shipping').replace('- Criterion 3:', '- Criterion 2:');
  const out = compare([run('a.md', good), run('b.md', moved)]);
  assert.match(out, /^Criterion 2 +Check by hand +Not covered +differs$/m);
  assert.match(out, /^Criterion 3 +Not covered +Check by hand +differs$/m);
  assert.match(out, /^Criterion 1 +Already verified +Already verified$/m);
  assert.equal(lines(out).at(-1), '1 of 3 criteria are in the same section in every run.');
});

test('a criterion one run left out shows as missing', () => {
  const out = compare([run('a.md', good), run('b.md', good.replace('Criterion 1.', 'Criterion 4.'))]);
  assert.match(out, /^Criterion 1 +Already verified +missing +differs$/m);
  assert.match(out, /^Criterion 4 +missing +Already verified +differs$/m);
});

test('a not ready report is shown as not a script', () => {
  const notReady = 'Type: Decision needed\n\nBottom line: x.\n\nNot looked at: x.\n\nNext: Ask the story tool.\n\n# Not ready for acceptance: x\n';
  const out = compare([run('a.md', good), run('b.md', notReady)]);
  assert.match(out, /^Criterion 1 +Already verified +not a script +differs$/m);
  assert.match(out, /^Confirm +2 +not a script$/m);
});

test('it needs at least two scripts', () => {
  const r = spawnSync('node', ['scripts/compare-runs.js', 'tests/fixtures/good.script.md'], { encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /^Usage:/);
});
