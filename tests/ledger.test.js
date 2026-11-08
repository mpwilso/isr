import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
const SAID = 'Not looked at: the ledger names no paths or hosts for calls forwarded without a hold, and ISR did not check it against a checkpoint; the build itself';
const NONE = "Not looked at: the agents' ledger did not verify, so ISR names none of their tool calls; the build itself";
const withSection = (text, ledger, said = SAID) => `${text.replace('Not looked at: the build itself', said)}\n${ledger.lines.join('\n')}\n`;
const also = (more) => SAID.replace(', and ISR did not', `, ${more}, and ISR did not`);

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

test('the holds ledger: calls forwarded are told apart from calls held, denied or refused', () => {
  assert.deepEqual(readLedger(`${POL}/valid/holds.jsonl`).lines, [
    '## Tool calls in the ledger (6, 5 shown)',
    '- `fs__move_file`: 1 call forwarded (1 ok).',
    '- `fs__read_text_file`: 1 call forwarded (1 outcome unknown).',
    '- `fs__delete`: 1 call not run (1 refused by Polarizer).',
    '- `fs__edit_file`: 1 call not run (1 held and never decided). Named in its holds: `/etc/hosts` (not run).',
    '- `fs__write_file`: 1 call not run (1 denied by a person).',
    'Not shown (1): `web__post`',
  ]);
});

// Polarizer's planted fixture carries made-up commitments (all 9s and all as), so neither reveal checks:
// the denied hold is counted, not left out, and its path is not named. The forwarded one was real.
test('the planted ledger: a reveal that does not check hides no hold', () => {
  assert.deepEqual(readLedger(`${POL}/valid/planted.jsonl`).lines, [
    '## Tool calls in the ledger (1)',
    '- `fs__write_file`: 1 call forwarded (1 ok), 1 not run (1 held, and may be a test call Polarizer planted, since its reveal did not check). Named in its holds: `/home/me/todo.md` (forwarded).',
  ]);
});

// An invented ledger, chained with ISR's own hashing, with a head file at its last entry unless told
// otherwise. Its paths, hosts, names, salts and commitments are made up.
const CHAIN = 'ab'.repeat(16);
function chain(rows) {
  let prev = '0'.repeat(64);
  const all = [{ kind: 'ledger.genesis', data: { chain_id: CHAIN } }, ...rows];
  const bytes = Buffer.from(all.map(({ kind, data }, seq) => {
    const entry = { v: 1, seq, ts: '2026-11-07T12:00:00.000Z', kind, data, prev };
    entry.hash = prev = entryHash(entry);
    return `${canonical(entry)}\n`;
  }).join(''));
  return { bytes, prev, head: Buffer.from(`${canonical({ chain_id: CHAIN, hash: prev, seq: all.length - 1 })}\n`) };
}
function invented(rows) {
  const { bytes, head } = chain(rows);
  const result = verify(bytes, head);
  assert.equal(result.status, 'intact');
  return { ...result, ...section(result) };
}
const hold = (id, tool, reason, extra = {}) => ({ kind: 'hold.created', data: { session: 's', hold: id, tool, args_commit: 'c', class: 'egress', class_from: 'config', rule: 'egress', reason, timeout_seconds: 300, ...extra } });
const decided = (id, decision) => ({ kind: 'hold.decided', data: { hold: id, args_commit: 'c', decision, actor: 'person', reason: null } });
const sent = (tool, extra = {}) => ({ kind: 'call.sent', data: { session: 's', tool, args_commit: 'c', meta_dropped: [], client_call_id: null, ...extra } });
const returned = (seq, outcome) => ({ kind: 'call.returned', data: { call_seq: seq, outcome, latency_ms: 1, result_bytes: 0, ...(outcome === 'ok' ? {} : { error: 'x' }) } });
const refused = (tool, extra = {}) => ({ kind: 'call.refused', data: { session: 's', tool, reason: 'not a prefixed name', ...extra } });

test('an invented ledger: a host, an allowed hold never forwarded, a hold that may be planted, and more paths than shown', () => {
  const ledger = invented([
    hold('h1', 'web__post', 'argument "url": host api.example.net is not in this tool\'s domains'),
    decided('h1', 'allow'),
    sent('web__post', { hold: 'h1', allowed_by: 'hold' }),
    ...['a', 'b', 'c', 'd'].flatMap((p, i) => [hold(`p${i}`, 'fs__write_file', `argument "path": /w/${p} is outside every workspace root`), decided(`p${i}`, 'allow')]),
    hold('h3', 'fs__write_file', 'argument "path": /w/e matches .env*', { plant_commit: 'p' }),
    decided('h3', 'deny'),
  ]);
  assert.deepEqual(ledger.lines, [
    '## Tool calls in the ledger (2)',
    '- `web__post`: 1 call forwarded (1 outcome unknown). Named in its holds: `api.example.net` (forwarded).',
    '- `fs__write_file`: 5 calls not run (4 allowed but never forwarded, 1 held, and may be a test call Polarizer planted). Named in its holds: `/w/a` (not run), `/w/b` (not run), `/w/c` (not run), and 1 more.',
  ]);
});

// Finding 1. TAINT-SPEC.md, section 3: a URL Polarizer can't read holds the call with a fixed reason.
test('a URL reason is not read as a path', () => {
  const ledger = invented([
    hold('h1', 'web__post', 'argument "url": an IP address, which never matches a domain'),
    decided('h1', 'deny'),
  ]);
  assert.deepEqual(ledger.lines, ['## Tool calls in the ledger (1)', '- `web__post`: 1 call not run (1 denied by a person).']);
  assert.deepEqual(check(withSection(good, ledger), { story, record, ledger }), []);
});

// Finding 2. HOLD-SPEC.md, section 4, and TAINT-SPEC.md, section 5: a reason has at most one path, after
// "argument NAME: " and before a fixed phrase, and at most one host, in a URL reason at its start.
test('a reason names at most the path and host Polarizer puts in it, and nothing ISR cannot read one way only', () => {
  const ledger = invented([
    // Polarizer's own forms: a tainted egress hold with an unlisted host and a read pattern, a destructive move, a Windows path.
    hold('h1', 'web__post', 'session tainted by web__fetch at 2026-11-07T12:00:00.000Z (seq 4); argument "url": host api.example.net is not in this tool\'s domains; argument "file": /w/.env matches .env*'),
    hold('h2', 'fs__move_file', 'class destructive is held on every call; argument "destination": /home/me/.ssh/authorized_keys matches ~/.ssh/**', { rule: 'destructive' }),
    hold('h3', 'fs__write_file', 'argument "path": C:\\w\\.claude\\settings.json matches .claude/**', { rule: 'write-pattern' }),
    // An agent's paths that hold Polarizer's own phrases, so they can be read more than one way: nothing named.
    hold('h4', 'fs__edit_file', 'argument "path": /w/notes is inside Polarizer\'s ledger directory; argument "path": /etc/sudoers.d/agent is outside every workspace root'),
    hold('h5', 'fs__edit_file', 'argument "path": /w/a matches b is outside every workspace root'),
    hold('h6', 'fs__edit_file', 'argument "path": /w/x matches matches .env*'),
    // A reason 1 KiB long, as Polarizer cuts one: its path may have gone on.
    hold('h7', 'fs__edit_file', `argument "path": /w/a matches ${'b'.repeat(994)}`),
    // An agent's path that holds a host clause: the one path, whole, and no host.
    hold('h8', 'fs__edit_file', 'argument "path": /w/a; argument "url": host evil.example is not in this tool\'s domains; b is outside every workspace root'),
  ]);
  assert.deepEqual(ledger.lines, [
    '## Tool calls in the ledger (4)',
    '- `fs__edit_file`: 5 calls not run (5 held and never decided). Named in its holds: `/w/a\\u003b argument \\u0022url\\u0022: host evil.example is not in this tool\'s domains\\u003b b` (not run).',
    '- `fs__move_file`: 1 call not run (1 held and never decided). Named in its holds: `/home/me/.ssh/authorized_keys` (not run).',
    '- `fs__write_file`: 1 call not run (1 held and never decided). Named in its holds: `C:\\w\\.claude\\settings.json` (not run).',
    '- `web__post`: 1 call not run (1 held and never decided). Named in its holds: `api.example.net` (not run), `/w/.env` (not run).',
  ]);
  // What ISR could not read is said under Not looked at.
  assert.deepEqual(rules(check(withSection(good, ledger), { story, record, ledger })), ['ledger-said']);
  assert.deepEqual(check(withSection(good, ledger, also('ISR could not read the paths in 4 hold reasons for certain')), { story, record, ledger }), []);
});

// Finding 3.
test('a path named in a denied hold and in a retry that was forwarded is marked forwarded', () => {
  const reason = 'argument "path": /w/.git/hooks/pre-commit matches .git/hooks/**';
  const ledger = invented([
    hold('h1', 'fs__write_file', reason),
    decided('h1', 'deny'),
    refused('fs__write_file', { hold: 'h1', reason: 'hold h1 was denied' }),
    hold('h2', 'fs__write_file', reason),
    decided('h2', 'allow'),
    sent('fs__write_file', { hold: 'h2', allowed_by: 'hold' }),
  ]);
  assert.deepEqual(ledger.lines, [
    '## Tool calls in the ledger (1)',
    '- `fs__write_file`: 1 call forwarded (1 outcome unknown), 1 not run (1 denied by a person). Named in its holds: `/w/.git/hooks/pre-commit` (forwarded).',
  ]);
});

// Finding 4. MEASURE-SPEC.md, section 8: plant_commit = hex(sha256("POLARIZER-PLANT/1\n" + salt + label)),
// salt the 32 bytes the reveal gives as 64 hex. Polarizer's hold fold keeps a hold's first reveal.
const SALT = 'c3'.repeat(32);
const OTHER = '5a'.repeat(32);
const commit = (label, salt = SALT) => createHash('sha256').update('POLARIZER-PLANT/1\n').update(Buffer.from(salt, 'hex')).update(label).digest('hex');
const revealed = (id, label, salt = SALT) => ({ kind: 'hold.revealed', data: { session: 's', hold: id, label, salt, why: null, derived_from: null } });
const hook = (name) => `argument "path": /w/.git/hooks/${name} matches .git/hooks/**`;

test('a reveal counts only when it checks against the hold\'s plant_commit, and only the first one', () => {
  const ledger = invented([
    // Planted, with a reveal that checks: left out, though a later reveal says real.
    hold('h1', 'fs__write_file', hook('pre-commit'), { plant_commit: commit('planted') }),
    decided('h1', 'deny'),
    revealed('h1', 'planted'),
    revealed('h1', 'real', OTHER),
    // Real, with a reveal that checks: its path is named.
    hold('h2', 'fs__write_file', hook('post-merge'), { plant_commit: commit('real') }),
    decided('h2', 'deny'),
    revealed('h2', 'real'),
    // A reveal that does not check: the hold is counted, and its path is not named as the agents'.
    hold('h3', 'fs__write_file', hook('pre-push'), { plant_commit: commit('planted') }),
    decided('h3', 'deny'),
    revealed('h3', 'real', OTHER),
    // No plant_commit: never planted, whatever a reveal says.
    hold('h4', 'fs__write_file', hook('post-checkout')),
    decided('h4', 'deny'),
    revealed('h4', 'planted'),
  ]);
  assert.deepEqual(ledger.lines, [
    '## Tool calls in the ledger (1)',
    '- `fs__write_file`: 3 calls not run (2 denied by a person, 1 held, and may be a test call Polarizer planted, since its reveal did not check). Named in its holds: `/w/.git/hooks/post-merge` (not run), `/w/.git/hooks/post-checkout` (not run).',
  ]);
});

// Finding 5. LEDGER-SPEC.md: call.sent is written before the call is forwarded, and one with no
// call.returned means "outcome unknown". A call's first call.returned counts.
test('a forwarded call counts the outcome the ledger records, and unknown without one', () => {
  const ledger = invented([
    sent('web__fetch'), returned(1, 'ok'),
    sent('web__fetch'), returned(3, 'transport-error'),
    sent('web__fetch'),
    sent('web__fetch'), returned(6, 'cancelled'), returned(6, 'ok'),
  ]);
  assert.deepEqual(ledger.lines, ['## Tool calls in the ledger (1)', '- `web__fetch`: 4 calls forwarded (1 ok, 1 transport error, 1 cancelled, 1 outcome unknown).']);
});

// Finding 6.
test('a ledger checked with no head file says so under Not looked at, whatever its file name', () => {
  const dir = mkdtempSync(join(tmpdir(), 'isr-ledger-'));
  try {
    const jsonl = join(dir, 'ledger.jsonl');
    const log = join(dir, 'run.log');
    copyFileSync(`${POL}/valid/holds.jsonl`, jsonl);
    copyFileSync(`${POL}/valid/holds.jsonl`, log);
    copyFileSync(`${POL}/valid/holds.head`, join(dir, 'run.head')); // no head file goes with a .log name
    assert.equal(readLedger(`${POL}/valid/holds.jsonl`).head, true);
    for (const path of [jsonl, log, dir]) {
      const ledger = readLedger(path);
      assert.equal(ledger.status, 'intact');
      assert.equal(ledger.head, false);
      assert.deepEqual(rules(check(withSection(good, ledger), { story, record, ledger })), ['ledger-said']);
      assert.deepEqual(check(withSection(good, ledger, also('ISR checked no head file with it')), { story, record, ledger }), []);
      const printed = spawnSync('node', ['skill/src/ledger.js', path], { encoding: 'utf8' });
      assert.equal(printed.stdout, `${ledger.lines.join('\n')}\n`);
      assert.match(printed.stderr, /no head file/i);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// Finding 7.
test('a tool with an empty name reads as an item the checker accepts', () => {
  const ledger = invented([refused(''), refused('""')]);
  assert.deepEqual(ledger.lines, [
    '## Tool calls in the ledger (2)',
    '- `""`: 1 call not run (1 refused by Polarizer).',
    '- `\\u0022\\u0022`: 1 call not run (1 refused by Polarizer).',
  ]);
  assert.deepEqual(check(withSection(good, ledger), { story, record, ledger }), []);
});

// Finding 8. Polarizer's verifier reads a line too deep for its parser (RecursionError) as invalid.
test('a line nested too deep for ISR\'s checks is invalid, not an error', () => {
  const { bytes, prev } = chain([]);
  const deep = `${'['.repeat(7900)}${']'.repeat(7900)}`;
  const line = `{"data":{"x":${deep}},"hash":"${'0'.repeat(64)}","kind":"x.y","prev":"${prev}","seq":1,"ts":"2026-11-07T12:00:00.000Z","v":1}\n`;
  const result = verify(Buffer.concat([bytes, Buffer.from(line)]));
  assert.deepEqual([result.status, result.line, result.seq], ['invalid', 2, 1]);
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
  const edited = check(script.replace('`fs__delete`: 1 call not run', '`fs__delete`: 1 call forwarded'), { story, record, ledger: given });
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
  assert.equal(printed.stderr, '');
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
