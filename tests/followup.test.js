import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { shape } from '../skill/src/check.js';
import { checkFollowup, followupKind, shapes } from '../skill/src/followup.js';

const CHECKER = 'skill/src/check.js';
const EX = 'examples/pellwick';
const read = (path) => readFileSync(path, 'utf8');
const rules = (problems) => [...new Set(problems.map((p) => p.rule))].sort();
// Checks a changed copy of an example as if it sat in the examples folder, so its links still resolve.
const checked = (text) => checkFollowup(text, { dir: EX });
const review = read(`${EX}/skip-a-box.review.md`);
const results = read(`${EX}/skip-a-box.results.md`);
const lesson = read(`${EX}/skip-a-box.lesson-2.md`);
const caseLesson = read(`${EX}/holiday-cutoff.lesson-1.md`);
const swap = (text, from, to) => {
  assert.ok(text.includes(from), from);
  return text.replace(from, to);
};

const followups = readdirSync(EX).filter((f) => /\.(?:review|results|lesson-\d+)\.md$/.test(f));
test('the examples hold a review, results and a lesson for each of two stories', () => {
  assert.equal(followups.length, 6);
});
for (const file of followups) {
  test(`example ${file} passes the checker`, () => {
    assert.match(execFileSync('node', [CHECKER, `${EX}/${file}`], { encoding: 'utf8' }), /^Checked with Node \d+\.\d+\.\d+\.\n$/);
  });
}

test('the checker tells the three files apart by their titles, and leaves scripts to the script checker', () => {
  assert.equal(followupKind(review), 'review');
  assert.equal(followupKind(results), 'results');
  assert.equal(followupKind(lesson), 'lesson');
  for (const file of ['skip-a-box.script.md', 'export-notes.script.md']) assert.equal(followupKind(read(`${EX}/${file}`)), null, file);
});

test('a review, results or lesson file takes no options, and the checker exits 2 if given one', () => {
  const r = spawnSync('node', [CHECKER, `${EX}/skip-a-box.results.md`, '--story', `${EX}/skip-a-box.story.md`], { encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /^Usage: /);
});

test('a copy of just the skill folder checks a lesson on its own', () => {
  const dir = mkdtempSync(join(tmpdir(), 'isr-skill-'));
  try {
    cpSync('skill', join(dir, 'isr'), { recursive: true });
    const out = execFileSync('node', ['isr/src/check.js', resolve(`${EX}/skip-a-box.lesson-2.md`)], { cwd: dir, encoding: 'utf8' });
    assert.match(out, /^Checked with Node /);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// Step 5: a person reviews the script before anyone uses it.
test('a review names a real acceptance script by its title, and the script gains no field', () => {
  assert.deepEqual(rules(checked(swap(review, 'skip-a-box.script.md', 'no-such.script.md'))), ['link']);
  assert.deepEqual(rules(checked(swap(review, 'skip-a-box.script.md', 'export-notes.script.md'))), ['link']);
  assert.deepEqual(rules(checked(swap(review, 'from their account', 'from the app'))), ['link']);
  // The script it reviews still passes its own checker, unchanged.
  const script = `${EX}/skip-a-box.script.md`;
  assert.match(execFileSync('node', [CHECKER, script, '--story', `${EX}/skip-a-box.story.md`, '--record', `${EX}/skip-a-box.record`], { encoding: 'utf8' }), /^Checked with Node /);
});

test('a review has its four fields, in order, its statement and its changes', () => {
  assert.deepEqual(rules(checked(swap(review, '- Reviewed by: Priya Raman\n', ''))), ['fields']);
  assert.deepEqual(rules(checked(swap(review, '2026-10-08', '2026-02-30'))), ['fields']);
  assert.deepEqual(rules(checked(swap(review, 'approved for use: yes', 'approved for use: mostly'))), ['fields']);
  assert.deepEqual(rules(checked(swap(review, '- Reviewed by: Priya Raman\n- Reviewed on: 2026-10-08\n', '- Reviewed on: 2026-10-08\n- Reviewed by: Priya Raman\n'))), ['fields']);
  assert.deepEqual(rules(checked(swap(review, `${shapes.review.statement}\n`, ''))), ['statement']);
  assert.deepEqual(rules(checked(swap(review, '## Changes (1)', '## Changes (2)'))), ['counts']);
  assert.deepEqual(rules(checked(swap(review, '## Changes (1)', '## Changes'))), ['counts']);
  assert.deepEqual(rules(checked(`${review}A stray line.\n`.replace('## Changes', 'Extra words.\n\n## Changes'))), ['stray']);
});

test('no file after the script carries a verdict, a checkbox or a dash', () => {
  for (const [name, text, at] of [['review', review, '## Changes (1)\n'], ['results', results, '## Not checked by hand (2)\n'], ['lesson', lesson, '## Carry over by hand\n']]) {
    for (const verdict of ['- Status: accepted', '- [x] checked', 'Sign-off: Priya']) {
      assert.deepEqual(rules(checked(text.replace(at, `${verdict}\n\n${at}`))), ['verdict'], `${name}: ${verdict}`);
    }
    assert.deepEqual(rules(checked(text.replace('## ', `Words${String.fromCodePoint(0x2014)}more.\n\n## `))), ['dash', 'stray'], name);
  }
});

// Step 6: each result, with evidence, traced to the criterion and the story.
test('results rest on a review that approved the script, dated on or before each check', () => {
  assert.deepEqual(rules(checked(swap(results, 'skip-a-box.review.md', 'holiday-cutoff.review.md'))), ['review']);
  assert.deepEqual(rules(checked(swap(results, 'Sam Okafor, 2026-10-09', 'Sam Okafor, 2026-10-07'))), ['review']);
  assert.deepEqual(rules(checked(swap(results, 'skip-a-box.review.md', 'skip-a-box.script.md'))), ['link']);
});

test('a review that did not approve the script blocks its results', () => {
  const dir = mkdtempSync(join(tmpdir(), 'isr-review-'));
  try {
    for (const f of ['skip-a-box.story.md', 'skip-a-box.script.md', 'skip-a-box.results.md']) cpSync(`${EX}/${f}`, join(dir, f));
    writeFileSync(join(dir, 'skip-a-box.review.md'), swap(review, 'approved for use: yes', 'approved for use: no'));
    const problems = checkFollowup(results, { dir });
    assert.deepEqual(problems.map((p) => [p.line, p.rule]), [[5, 'review']]);
    assert.match(problems[0].message, /not approved for use/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('results hold the script\'s checks by number, title and Covers line, each with every field in order', () => {
  assert.deepEqual(rules(checked(swap(results, '### 2. The skip note in Stockroom', '### 2. The note'))), ['script-checks']);
  assert.deepEqual(rules(checked(swap(results, '(a skip note in Stockroom).', '(the note).'))), ['script-checks']);
  const one = results.replace(/\n### 2\.[\s\S]*?(?=\n## )/, '').replace('## Checks by hand (2)', '## Checks by hand (1)');
  assert.deepEqual(rules(checked(one.replace('- Criterion 2:', '- Criterion 4: not run.\n- Criterion 2:').replace('Not checked by hand (2)', 'Not checked by hand (3)'))), ['script-checks']);
  assert.deepEqual(rules(checked(swap(results, '### 2. The skip note', '### 3. The skip note'))), ['check-number', 'script-checks']);
  assert.deepEqual(rules(checked(swap(results, '- Checked by: Dana Ruiz, 2026-10-09\n', ''))), ['check-fields']);
  assert.deepEqual(rules(checked(swap(results, '- Checked by: Dana Ruiz, 2026-10-09', '- Checked by: Dana Ruiz'))), ['check-fields']);
});

test('what the tester says is one of four phrases, and ISR never picks it', () => {
  for (const o of shapes.results.outcomes) {
    const text = swap(results, 'Tester says: did not match what the script expects.', `Tester says: ${o.phrase}.`);
    assert.deepEqual(checked(text), [], o.phrase);
  }
  assert.deepEqual(rules(checked(swap(results, 'Tester says: did not match what the script expects.', 'Tester says: passed.'))), ['outcome']);
  assert.deepEqual(rules(checked(swap(results, 'Tester says: did not match what the script expects.', 'Tester says: looks fine.'))), ['outcome']);
});

test('evidence is links or file paths, and "None." only for a check not finished or not run', () => {
  const evidence = (text, says) => checked(swap(swap(results, 'evidence/stockroom-history.png; evidence/web-app-notes.png', text), 'Tester says: did not match what the script expects.', `Tester says: ${says}.`));
  assert.deepEqual(evidence('https://example.com/ticket/1; notes.txt (the agent notes)', 'did not match what the script expects'), []);
  assert.deepEqual(rules(evidence('a screenshot', 'did not match what the script expects')), ['evidence']);
  assert.deepEqual(rules(evidence('None.', 'matched what the script expects')), ['evidence']);
  assert.deepEqual(rules(evidence('None.', 'did not match what the script expects')), ['evidence']);
  assert.deepEqual(evidence('None.', 'could not finish'), []);
  assert.deepEqual(evidence('None.', 'did not run it'), []);
});

test('every criterion in the story is accounted for exactly once, traced to the story the results name', () => {
  assert.deepEqual(rules(checked(swap(results, '- Criterion 2: the script lists it as already verified.\n', '').replace('(2)\n- Criterion 1', '(1)\n- Criterion 1'))), ['coverage-missing']);
  assert.deepEqual(rules(checked(swap(results, '- Criterion 2: the', '- Criterion 3: the'))), ['coverage-duplicate', 'coverage-missing']);
  assert.deepEqual(rules(checked(swap(results, '- Criterion 2: the', '- Criterion 9: the'))), ['coverage-missing', 'coverage-unknown']);
  assert.deepEqual(rules(checked(swap(results, 'skip-a-box.story.md', 'export-notes.story.md'))), ['link']);
  assert.deepEqual(rules(checked(swap(results, 'skip-a-box.story.md', 'missing.story.md'))), ['link']);
});

// Step 7: a proposed class, with reasons, and one entry to carry over by hand.
test('a lesson is for a check the tester said did not match, and copies its title, Covers and what the tester saw', () => {
  assert.deepEqual(rules(checked(swap(lesson, 'skip-a-box.results.md, check 2.', 'skip-a-box.results.md, check 1.'))), ['results']);
  assert.deepEqual(rules(checked(swap(lesson, 'skip-a-box.results.md, check 2.', 'skip-a-box.results.md, check 3.'))), ['results']);
  assert.deepEqual(rules(checked(swap(lesson, '- Tester saw: the history showed no note', '- Tester saw: Stockroom showed no note'))), ['results']);
  assert.deepEqual(rules(checked(swap(lesson, '# Lesson: The skip note in Stockroom', '# Lesson: The note'))), ['results']);
  assert.deepEqual(rules(checked(swap(lesson, '- Covers: criterion 4 (a skip note in Stockroom).', '- Covers: criterion 4 (the note).'))), ['results']);
});

test('ISR proposes the class and labels it a proposal; until a person picks, Type is Decision needed', () => {
  assert.deepEqual(rules(checked(swap(lesson, 'wrong assumption. This is a proposal, not a finding.', 'wrong assumption.'))), ['fields']);
  assert.deepEqual(rules(checked(swap(lesson, 'wrong assumption. This is a proposal', 'bad luck. This is a proposal'))), ['fields']);
  assert.deepEqual(rules(checked(swap(lesson, 'Type: Decision needed', 'Type: Recommendation'))), ['type']);
  assert.deepEqual(rules(checked(swap(lesson, 'ISR proposes a wrong assumption', 'it is a wrong assumption'))), ['proposal']);
});

test('once a person picks, Type is Recommendation and the picked class says where the lesson goes', () => {
  const picked = swap(swap(lesson, 'not picked yet.', 'requirements gap, by Priya Raman on 2026-10-10.'), 'Type: Decision needed', 'Type: Recommendation');
  assert.deepEqual(checked(picked), []);
  assert.deepEqual(rules(checked(swap(picked, 'Type: Recommendation', 'Type: Decision needed'))), ['type']);
  assert.deepEqual(rules(checked(swap(picked, '2026-10-10', '2026-10-32'))), ['fields']);
  // The person picked a build mistake: the lesson goes to the build tool's eval cases, as a case.
  const build = swap(picked, 'requirements gap, by', 'build mistake, by');
  assert.deepEqual(rules(checked(build)), ['case', 'goes-to']);
  assert.deepEqual(rules(checked(swap(build, "the story tool's team context (Loupe's learned.md).", "the build tool's eval cases (Parallax's evals/cases.toml)."))), ['case']);
});

test('each reason ends with a source from the shape file, and there are at most five', () => {
  for (const s of shapes.lesson.sources) assert.deepEqual(checked(swap(lesson, '(the tester reported this)', `(${s.phrase})`)), [], s.phrase);
  assert.deepEqual(rules(checked(swap(lesson, '(the tester reported this)', '(a hunch)'))), ['reason-source']);
  assert.deepEqual(rules(checked(swap(lesson, ' (the tester reported this)', ''))), ['item-shape']);
  const more = [1, 2, 3].map((n) => `- Reason ${n}. (the script says this)`).join('\n');
  assert.deepEqual(rules(checked(swap(lesson, '## Why ISR proposes this (3)', '## Why ISR proposes this (6)').replace('## Carry over', `${more}\n\n## Carry over`))), ['max-items']);
});

test('an entry for the story tool\'s team context is one sentence with a kind and a dated source', () => {
  const entry = (from, to) => rules(checked(swap(lesson, from, to)));
  assert.deepEqual(entry('Stockroom change.', 'Stockroom change. Agents said so.'), ['entry']);
  assert.deepEqual(entry('  kind: fact', '  kind: hunch'), ['entry']);
  assert.deepEqual(entry('  kind: fact\n', ''), ['entry']);
  assert.deepEqual(entry('2026-10-09\n```', '2026-13-09\n```'), ['entry']);
  assert.deepEqual(entry('  kind: fact', '  kind: fact\n  status: new'), ['entry']);
  assert.deepEqual(entry('  kind: fact', '  kind: fact\n  applies: 1 December to 5 January'), []);
  assert.deepEqual(entry('```\n- A note', 'A note'), ['block', 'stray']);
});

test('an eval case for the build tool names every field, or marks it as not known yet', () => {
  const evalCase = (from, to) => rules(checked(swap(caseLesson, from, to)));
  assert.deepEqual(evalCase('# tests: not known yet, since no test covers it yet.\n', ''), ['case']);
  assert.deepEqual(evalCase('# tests: not known yet, since no test covers it yet.', 'tests = ["tests/boxes/test_holiday_cutoff.py"]'), []);
  assert.deepEqual(evalCase('[[case]]\n', ''), ['case']);
  assert.deepEqual(evalCase('id = ', 'severity = "high"\nid = '), ['case']);
  assert.deepEqual(evalCase('id = ', 'goal = "x"\nid = '), ['case']);
});

// The templates, the writing rules and the shape files say the same thing.
const topLabels = shape.top.map((t) => t.pattern.match(/^\^(\w[\w ]*): /)[1]);
const fieldLabels = (text) => [...text.matchAll(/^- ([\w ]+): /gm)].map((m) => m[1]);

test('the review and results templates follow their shape files', () => {
  for (const [file, spec] of [['script-review.md', shapes.review], ['hand-check-results.md', shapes.results]]) {
    const text = read(`skill/templates/${file}`);
    assert.ok(new RegExp(spec.title).test(text.split('\n')[0]), file);
    assert.ok(text.includes(`\n${spec.statement}\n`), file);
    assert.deepEqual(text.split('\n').filter((l) => l.startsWith('## ')).map((l) => l.replace(/^## (.+?)(?: \(\[N\]\))?$/, '$1')), spec.sections.map((s) => s.heading));
    const labels = fieldLabels(text).filter((l) => l !== 'Criterion');
    assert.deepEqual(labels, [...spec.fields, ...(spec.check?.fields ?? [])].map((f) => f.label), file);
  }
  const results = read('skill/templates/hand-check-results.md');
  for (const o of shapes.results.outcomes) assert.ok(results.includes(o.phrase), o.phrase);
});

test('the lesson template follows its shape file', () => {
  const text = read('skill/templates/lesson.md');
  const lines = text.split('\n');
  topLabels.forEach((label, i) => {
    assert.ok(lines[2 * i].startsWith(`${label}: `), lines[2 * i]);
    assert.equal(lines[2 * i + 1], '');
  });
  assert.ok(new RegExp(shapes.lesson.title).test(lines[2 * topLabels.length]));
  assert.deepEqual(fieldLabels(text), shapes.lesson.fields.map((f) => f.label));
  assert.deepEqual(lines.filter((l) => l.startsWith('## ')).map((l) => l.replace(/^## (.+?)(?: \(\[N\]\))?$/, '$1')), shapes.lesson.sections.map((s) => s.heading));
  for (const c of shapes.lesson.classes) assert.ok(text.includes(c.name), c.name);
});

test('the writing rules list the classes, where each goes, and the reason sources, as the shape file has them', () => {
  const rules = read('skill/writing-rules.md');
  const classes = [...rules.matchAll(/^- \*\*([^*]+)\*\*: (.+) Goes to: (.+)\.$/gm)].map((m) => [m[1], m[2], m[3]]);
  assert.deepEqual(classes, shapes.lesson.classes.map((c) => [c.name, `${c.means}.`, shapes.lesson.destinations[c.goesTo].words]));
  const after = rules.split('## Classes')[1];
  const sources = [...after.matchAll(/^- "([^"]+)"$/gm)].map((m) => m[1]);
  assert.deepEqual(sources, shapes.lesson.sources.map((s) => s.phrase));
  for (const s of shapes.results.outcomes) assert.ok(read('skill/templates/hand-check-results.md').includes(s.phrase));
});
