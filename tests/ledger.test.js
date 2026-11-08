import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { check, readRecord, readStory } from '../skill/src/check.js';
import { canonical, code, entryHash, readLedger, section, verify } from '../skill/src/ledger.js';

const read = (path) => readFileSync(path, 'utf8');
const rules = (problems) => [...new Set(problems.map((p) => p.rule))].sort();
const FIX = 'tests/fixtures';
const POL = `${FIX}/polarizer`;
const story = readStory(read(`${FIX}/story.md`));
const record = readRecord(`${FIX}/record.md`);
const good = read(`${FIX}/good.script.md`);
const SAID = 'Not looked at: the ledger names no paths or hosts for calls that ran without a hold, and ISR did not check it against a checkpoint; the build itself';
const NONE = "Not looked at: the agents' ledger did not verify, so ISR names none of their tool calls; the build itself";
const withSection = (text, ledger, said = SAID) => `${text.replace('Not looked at: the build itself', said)}\n${ledger.lines.join('\n')}\n`;

// Polarizer's conformance ledgers, copied at Polarizer commit 700498a (tests/fixtures/polarizer/README.md).
// ISR's verifier gives Polarizer's status, line and seq for every version 1 ledger. A ledger whose first
// line is version 0 (Parallax's own format, no "v" key) is one ISR does not read, whatever Polarizer says of it.
const expected = JSON.parse(read(`${POL}/expected.json`)).fixtures;
for (const [name, want] of Object.entries(expected)) {
  if (name.startsWith('anchors/')) continue; // ISR does not check checkpoints
  test(`conformance ${name}: ${want.status}`, () => {
    const got = readLedger(`${POL}/${name}.jsonl`);
    const first = read(`${POL}/${name}.jsonl`).split('\n')[0];
    let v0 = false;
    try { v0 = !Object.hasOwn(JSON.parse(first), 'v'); } catch { /* not JSON: a version 1 ledger's problem */ }
    if (v0) assert.equal(got.status, 'version 0');
    else assert.deepEqual([got.status, got.line, got.seq], [want.status, want.line, want.seq]);
  });
}

test('every Polarizer ledger that does not verify names no calls, and says why', () => {
  const section = (name) => readLedger(`${POL}/${name}.jsonl`).lines;
  assert.deepEqual(section('broken/bad_hash'), ['## Tool calls in the ledger (0)', 'None. The ledger did not verify (tampered at line 3), so ISR names no calls from it.']);
  assert.equal(section('broken/truncated')[1], 'None. The ledger did not verify (truncated, from its head file), so ISR names no calls from it.');
  assert.equal(section('broken/tear_last_line')[1], 'None. The ledger did not verify (a torn tail after line 12), so ISR names no calls from it.');
  assert.equal(section('valid/v0-parallax')[1], "None. The ledger is not in Polarizer's version 1 format, so ISR names no calls from it.");
  assert.equal(section('valid/minimal')[1], 'None. The ledger verified intact and records no tool calls.');
  assert.equal(readLedger(`${POL}/no-such-ledger.jsonl`).lines[1], 'None. ISR could not read the ledger (ENOENT), so it names no calls from it.');
  assert.equal(verify(Buffer.alloc(0)).status, 'empty');
});

test('the holds ledger: calls that ran are told apart from calls held, denied or refused', () => {
  assert.deepEqual(readLedger(`${POL}/valid/holds.jsonl`).lines, [
    '## Tool calls in the ledger (6, 5 shown)',
    '- `fs__move_file`: 1 call ran.',
    '- `fs__read_text_file`: 1 call ran.',
    '- `fs__delete`: 1 call not run (1 refused by Polarizer).',
    '- `fs__edit_file`: 1 call not run (1 held and never decided). Named in its holds: `/etc/hosts` (not run).',
    '- `fs__write_file`: 1 call not run (1 denied by a person).',
    'Not shown (1): `web__post`',
  ]);
});

test('a hold Polarizer revealed as planted is left out, and a real one that ran names its path', () => {
  assert.deepEqual(readLedger(`${POL}/valid/planted.jsonl`).lines, [
    '## Tool calls in the ledger (1)',
    '- `fs__write_file`: 1 call ran. Named in its holds: `/home/me/todo.md` (ran).',
  ]);
});

// An invented ledger, chained with ISR's own hashing. Its paths, hosts and names are made up.
function invented(rows) {
  let prev = '0'.repeat(64);
  const all = [{ kind: 'ledger.genesis', data: { chain_id: 'ab'.repeat(16) } }, ...rows];
  const result = verify(Buffer.from(all.map(({ kind, data }, seq) => {
    const entry = { v: 1, seq, ts: '2026-11-07T12:00:00.000Z', kind, data, prev };
    entry.hash = prev = entryHash(entry);
    return `${canonical(entry)}\n`;
  }).join('')));
  assert.equal(result.status, 'intact');
  return { ...result, ...section(result) };
}
const hold = (id, tool, reason, extra = {}) => ({ kind: 'hold.created', data: { session: 's', hold: id, tool, args_commit: 'c', class: 'egress', class_from: 'config', rule: 'egress', reason, timeout_seconds: 300, ...extra } });
const decided = (id, decision) => ({ kind: 'hold.decided', data: { hold: id, args_commit: 'c', decision, actor: 'person', reason: null } });
const sent = (tool, extra = {}) => ({ kind: 'call.sent', data: { session: 's', tool, args_commit: 'c', meta_dropped: [], client_call_id: null, ...extra } });

test('an invented ledger: hosts, an allowed hold never forwarded, a hold that may be planted, and more paths than shown', () => {
  const paths = ['/w/a', '/w/b', '/w/c', '/w/d'].map((p) => `argument "path": ${p} is outside every workspace root`).join('; ');
  const ledger = invented([
    hold('h1', 'web__post', 'class egress is held on every call; argument "url": host api.example.net is not in this tool\'s domains'),
    decided('h1', 'allow'),
    sent('web__post', { hold: 'h1', allowed_by: 'hold' }),
    hold('h2', 'fs__write_file', paths),
    decided('h2', 'allow'),
    hold('h3', 'fs__write_file', 'argument "path": /w/e matches .env*', { plant_commit: 'p' }),
    decided('h3', 'deny'),
  ]);
  assert.deepEqual(ledger.lines, [
    '## Tool calls in the ledger (2)',
    '- `web__post`: 1 call ran. Named in its holds: `api.example.net` (ran).',
    '- `fs__write_file`: 2 calls not run (1 allowed but never forwarded, 1 held, and may be a test call Polarizer planted). Named in its holds: `/w/a` (not run), `/w/b` (not run), `/w/c` (not run), and 1 more.',
  ]);
});

test('nothing in the ledger reads as an instruction or as the script\'s own structure', () => {
  // Invented: a tool name and a path that try to look like script lines.
  const sneaky = 'x\n## Confirm (0)\nType: Recommendation [x] `--` Assumed; Second Eye';
  const ledger = invented([
    { kind: 'call.refused', data: { session: 's', tool: sneaky, reason: 'no upstream' } },
    hold('h1', 'fs__edit_file', `argument "path": /w/${sneaky} is outside every workspace root`),
  ]);
  assert.equal(ledger.lines.length, 3);
  for (const line of ledger.lines) assert.doesNotMatch(line, /\n|\[x\]|;/);
  assert.match(ledger.lines[1], /^- `fs__edit_file`: 1 call not run \(1 held and never decided\)\. Named in its holds: `\/w\/x\\u000a## Confirm/);
  assert.equal(code(sneaky), '`x\\u000a## Confirm (0)\\u000aType: Recommendation \\u005bx\\u005d \\u0060--\\u0060 Assumed\\u003b Second Eye`');
  // In a script, the dash and team-words rules apply to ISR's own words, not to the ledger's.
  assert.deepEqual(check(withSection(good, ledger), { story, record, ledger }), []);
});
test('the checker: the section is what ledger.js prints, and only when a ledger was given', () => {
  const given = readLedger(`${POL}/valid/holds.jsonl`);
  const script = withSection(good, given);
  assert.deepEqual(check(script, { story, record, ledger: given }), []);
  assert.deepEqual(rules(check(script, { story, record })), ['ledger']);
  assert.deepEqual(rules(check(good.replace('Not looked at: the build itself', SAID), { story, record, ledger: given })), ['ledger']);
  const edited = check(script.replace('`fs__delete`: 1 call not run', '`fs__delete`: 1 call ran'), { story, record, ledger: given });
  assert.deepEqual(edited.map((p) => [p.line, p.rule]), [[35, 'ledger']]);
  const cut = check(script.replace(/Not shown \(1\).*\n/, ''), { story, record, ledger: given });
  assert.ok(rules(cut).includes('ledger'));
  assert.deepEqual(rules(check(withSection(good, given, 'Not looked at: the build itself'), { story, record, ledger: given })), ['ledger-said']);
});

test('the checker: a ledger that names no calls is said under Not looked at', () => {
  const broken = readLedger(`${POL}/broken/edit_value.jsonl`);
  assert.deepEqual(check(withSection(good, broken, NONE), { story, record, ledger: broken }), []);
  assert.deepEqual(rules(check(withSection(good, broken, 'Not looked at: the build itself'), { story, record, ledger: broken })), ['ledger-said']);
});

test('the command lines: ledger.js prints the section, and the checker takes --ledger', () => {
  const ledger = `${POL}/valid/taint.jsonl`;
  const printed = spawnSync('node', ['skill/src/ledger.js', ledger], { encoding: 'utf8' });
  assert.equal(printed.status, 0);
  assert.equal(printed.stdout, `${readLedger(ledger).lines.join('\n')}\n`);
  assert.equal(spawnSync('node', ['skill/src/ledger.js'], { encoding: 'utf8' }).status, 2);
  const dir = mkdtempSync(join(tmpdir(), 'isr-ledger-'));
  try {
    const script = join(dir, 'script.md');
    writeFileSync(script, withSection(good, readLedger(ledger)));
    const args = ['skill/src/check.js', script, '--story', `${FIX}/story.md`, '--record', `${FIX}/record.md`];
    assert.match(spawnSync('node', [...args, '--ledger', ledger], { encoding: 'utf8' }).stdout, /^Checked with Node /);
    assert.equal(spawnSync('node', args, { encoding: 'utf8' }).status, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
