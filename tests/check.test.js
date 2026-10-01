import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { check, readRecord, readStory } from '../skill/src/check.js';

const CHECKER = 'skill/src/check.js';
const read = (path) => readFileSync(path, 'utf8');
const rules = (problems) => [...new Set(problems.map((p) => p.rule))].sort();
const FIX = 'tests/fixtures';
const story = readStory(read(`${FIX}/story.md`));
const record = readRecord(`${FIX}/record.md`);
const good = read(`${FIX}/good.script.md`);

// examples/pellwick/NAME.script.md is checked against STORY.story.md (STORY is NAME up to the first dot),
// and against NAME.record when that folder exists. No folder means no record was given.
const EX = 'examples/pellwick';
for (const file of readdirSync(EX).filter((f) => f.endsWith('.script.md'))) {
  const name = file.replace(/\.script\.md$/, '');
  const args = [CHECKER, `${EX}/${file}`, '--story', `${EX}/${name.split('.')[0]}.story.md`];
  if (existsSync(`${EX}/${name}.record`)) args.push('--record', `${EX}/${name}.record`);
  test(`example ${file} passes the checker against its inputs`, () => {
    assert.match(execFileSync('node', args, { encoding: 'utf8' }), /^Checked with Node \d+\.\d+\.\d+\.\n$/);
  });
}

test('the good fixture passes', () => {
  assert.deepEqual(check(good, { story, record }), []);
});

for (const file of readdirSync(`${FIX}/bad`)) {
  const rule = file.split('.')[0];
  test(`bad/${file} fails for exactly one rule: ${rule}`, () => {
    assert.deepEqual(rules(check(read(`${FIX}/bad/${file}`), { story, record })), [rule]);
  });
}

// Dash characters are built from code points, so the repo itself stays free of them.
for (const [what, dash] of [['an em dash', String.fromCodePoint(0x2014)], ['an en dash', String.fromCodePoint(0x2013)], ['a double hyphen', ' -- ']]) {
  test(`${what} fails for exactly one rule: dash`, () => {
    const text = good.replace('Should a pause end on its own', `Should a pause${dash}end on its own`);
    assert.deepEqual(rules(check(text, { story, record })), ['dash']);
  });
}

test('a script with Type: FYI is rejected on line 1', () => {
  const fyi = good.replace('Type: Decision needed', 'Type: FYI');
  assert.deepEqual(check(fyi, { story, record }).filter((p) => p.rule === 'top-lines').map((p) => p.line), [1]);
});

test('with a story and no record, the no record rules apply', () => {
  const problems = check(good, { story });
  assert.deepEqual(rules(problems), ['no-record']);
  assert.deepEqual(problems.map((p) => p.line), [3, 8]);
});

test('a story section that is missing must be named under Not looked at', () => {
  const thin = readStory(read(`${FIX}/story.md`).replace(/## Assumed\n.*\n\n/, ''));
  assert.deepEqual(thin.missing, ['Assumed']);
  assert.deepEqual(rules(check(good, { story: thin, record })), ['missing-sections']);
  const said = good.replace('Not looked at: the build itself', 'Not looked at: the story has no Assumed section; the build itself');
  assert.deepEqual(check(said, { story: thin, record }), []);
});

test('a build that did not reach ready: Type and Bottom line must say so', () => {
  for (const path of [`${FIX}/record-not-ready.md`, `${EX}/skip-a-box.build-not-ready.record`]) {
    const notReady = readRecord(path);
    assert.ok(notReady.notReady, path);
    const recommended = good.replace('Type: Decision needed', 'Type: Recommendation').replace(/\n## Not covered[\s\S]*$/, '\n');
    assert.deepEqual(rules(check(recommended, { record: notReady })), ['build-not-ready', 'counts']);
  }
});

test('a record with skipped tests: Verified by gives both counts, never "N of N"', () => {
  // Found in real run 1: the record said 43 passed and 1 skipped, and the script said "43 of 43".
  const skipped = readRecord(`${FIX}/record-skipped.md`);
  assert.equal(skipped.skipped, 1);
  assert.equal(record.skipped, 0);
  assert.equal(readRecord(`${EX}/holiday-cutoff.record`).skipped, 2);
  assert.deepEqual(rules(check(good, { story, record: skipped })), ['skipped-tests']);
  const passing = good.replace('6 of 6 passing', '6 passing');
  assert.deepEqual(rules(check(passing, { story, record: skipped })), ['skipped-tests']);
  const both = good.replace('6 of 6 passing', '6 passed and 1 skipped');
  assert.deepEqual(check(both, { story, record: skipped }), []);
});

test('a story with Requirements in place of Acceptance criteria is read the same way', () => {
  // Loupe's story format v2 writes "## Requirements", numbered; v1 stories keep "## Acceptance criteria".
  const v2 = readStory(read(`${FIX}/story-requirements.md`));
  assert.equal(v2.notReady, false);
  assert.equal(v2.criteria.length, 3);
  assert.deepEqual(v2.missing, []);
  assert.deepEqual(check(good, { story: v2, record }), []);
  // Every requirement still appears exactly once.
  const twice = good.replace('- Covers: criterion 2.', '- Covers: criteria 1 and 2.');
  assert.deepEqual(rules(check(twice, { story: v2, record })), ['coverage-duplicate']);
  const gone = good.replace(/\n## Not covered[\s\S]*$/, '\n').replace(', 1 not covered', '');
  assert.deepEqual(rules(check(gone, { story: v2, record })), ['coverage-missing']);
});

test('a story too thin to build from gets the not ready report, not a script', () => {
  const thin = readStory(read(`${EX}/export-notes.story.md`));
  assert.ok(thin.notReady);
  assert.deepEqual(rules(check(good, { story: thin, record })), ['not-ready']);
});

test('criteria hidden under Not shown still count toward coverage', () => {
  const criteria = Array.from({ length: 6 }, (_, i) => `- Given case ${i + 1}, when it happens, then it works.`).join('\n');
  const six = readStory(`# Six\n\n## Acceptance criteria\n${criteria}\n\n## Not included\nNone.\n\n## Known\n- A fact. (test)\n\n## Unknown\nNone.\n\n## Assumed\n- A guess.\n\n## Questions before building\nNone.\n`);
  const checkBlock = (n) => `\n### ${n}. Case ${n}\n- Risk: Low. Why: invented.\n- Needs: an account.\n- Steps:\n  1. Do the thing.\n- Expect: it works.\n- Covers: criterion ${n}.\n`;
  const script = [
    'Type: Recommendation',
    'Bottom line: 0 verified, 6 to check by hand, 0 to confirm; invented.',
    'Not looked at: no build record was given.',
    'Next: Give the checks to a tester.',
    '',
    '# Acceptance script: Six',
    '',
    '## Already verified (0)',
    'None.',
    '',
    '## Check by hand (6)',
    [1, 2, 3, 4, 5].map(checkBlock).join(''),
    'Not shown (1): case six (criterion 6)',
    '',
    '## Confirm (0)',
    'None.',
  ].join('\n');
  assert.deepEqual(check(script, { story: six }), []);
  assert.deepEqual(rules(check(script.replace('(criterion 6)', ''), { story: six })), ['coverage-missing', 'item-shape']);
});

test('the command line: exit 1 with file and line on a problem, 2 on bad usage', () => {
  const bad = spawnSync('node', [CHECKER, `${FIX}/bad/title.md`], { encoding: 'utf8' });
  assert.equal(bad.status, 1);
  assert.match(bad.stdout, /^tests\/fixtures\/bad\/title\.md:6: .+ \[title\]$/m);
  assert.equal(spawnSync('node', [CHECKER], { encoding: 'utf8' }).status, 2);
  const missing = spawnSync('node', [CHECKER, 'no-such-file.md'], { encoding: 'utf8' });
  assert.equal(missing.status, 2);
  assert.match(missing.stderr, /^Not checked: /);
});
