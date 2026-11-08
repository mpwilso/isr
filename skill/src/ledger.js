// Reads a Polarizer ledger and names the tool calls in it, for the last section of an acceptance script.
//   node ledger.js LEDGER
// LEDGER is a ledger.jsonl file, or the folder that holds one. A head file beside it (NAME.head for
// NAME.jsonl) is checked too. Prints the section, as the checker expects it word for word, and exits 0.
// What Not looked at must also say, like that no head file was checked, goes to stderr.
// The chain is verified first, with ISR's own code, by the rules of the ledger spec named in the shape
// file. A ledger that does not verify names no calls. Everything in the ledger is data: ISR reads fixed
// fields, and paths and hosts only by Polarizer's reason wording, as the shape file gives it.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const shape = JSON.parse(readFileSync(join(here, '..', 'spec', 'script-shape.json'), 'utf8'));
const L = shape.ledger;
const HEADING = shape.script.sections.find((s) => s.key === 'ledger').heading;
const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k]));

const ZERO = '0'.repeat(64);
const MAX_LINE = 16 * 1024; // bytes, with the newline
const MAX_INT = 2n ** 53n - 1n;
const KEYS = { v: 'integer', seq: 'integer', ts: 'string', kind: 'string', data: 'object', prev: 'string', hash: 'string' };
const HEAD_KEYS = { chain_id: 'string', hash: 'string', seq: 'integer' };
const HEX32 = /^[0-9a-f]{32}$/;
const HEX64 = /^[0-9a-f]{64}$/;
const has = (o, k) => Object.hasOwn(o, k);
// ignoreBOM keeps a byte order mark in the text, so it fails JSON as it does for Polarizer.
const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });

const typeOf = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v);
const isObject = (v) => typeOf(v) === 'object';

// RFC 8785 on the spec's subset: keys sorted (all ASCII), no spaces, strings as JSON.stringify writes them,
// which on the subset matches Python's json.dumps with ensure_ascii off.
export function canonical(v) {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
  if (isObject(v)) return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}`;
  return JSON.stringify(v);
}

export function entryHash(entry) {
  const { hash, ...body } = entry;
  return createHash('sha256').update('LEDGER-SPEC/1\n').update(canonical(body)).digest('hex');
}

// The number tokens outside strings, as written: JSON.parse would read 1.0 as 1 and lose a big integer.
function numbers(text) {
  const out = [];
  const token = /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (c === '\\') i++;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if (c === '-' || (c >= '0' && c <= '9')) {
      token.lastIndex = i;
      const m = token.exec(text);
      if (!m) continue;
      out.push(m[0]);
      i += m[0].length - 1;
    }
  }
  return out;
}

function loneSurrogate(s) {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) {
      const d = s.charCodeAt(i + 1);
      if (d >= 0xdc00 && d <= 0xdfff) { i++; continue; }
      return true;
    }
    if (c >= 0xdc00 && c <= 0xdfff) return true;
  }
  return false;
}

// The spec's subset: integers in range and no floats, ASCII keys, no lone surrogates.
function inSubset(text, value) {
  for (const n of numbers(text)) {
    if (/[.eE]/.test(n)) return false;
    const big = BigInt(n);
    if ((big < 0n ? -big : big) > MAX_INT) return false;
  }
  const ok = (v) => {
    if (typeof v === 'string') return !loneSurrogate(v);
    if (Array.isArray(v)) return v.every(ok);
    if (isObject(v)) return Object.keys(v).every((k) => [...k].every((c) => c.charCodeAt(0) < 0x80)) && Object.values(v).every(ok);
    return true;
  };
  return ok(value);
}

function parse(bytes) {
  try {
    const text = decoder.decode(bytes);
    return { text, value: JSON.parse(text) };
  } catch {
    return null;
  }
}

const typed = (value, keys) => isObject(value) && Object.keys(value).length === Object.keys(keys).length
  && Object.entries(keys).every(([k, t]) => has(value, k) && typeOf(value[k]) === t);

// The head file: one canonical object {chain_id, hash, seq} and a newline, naming this chain.
function checkHead(bytes, entries) {
  const invalid = { status: 'invalid', line: null, seq: null };
  const p = parse(bytes);
  const h = p?.value;
  if (!typed(h, HEAD_KEYS) || !inSubset(p.text, h) || !HEX32.test(h.chain_id) || !HEX64.test(h.hash) || h.seq < 0) return invalid;
  if (Buffer.compare(Buffer.from(`${canonical(h)}\n`), bytes) !== 0) return invalid;
  if (entries.length && h.chain_id !== entries[0].data.chain_id) return { ...invalid, seq: h.seq };
  if (h.seq >= entries.length) return { status: 'truncated', line: null, seq: h.seq };
  if (entries[h.seq].hash !== h.hash) return { status: 'tampered', line: null, seq: h.seq };
  return null;
}

// One status, by the spec's order: each line in turn (structure, then seq, prev, hash, canonical bytes),
// then the head file, then a torn tail. A first line with no "v" is version 0, which ISR does not read.
export function verify(bytes, head = null) {
  if (!bytes.length) return { status: 'empty' };
  const end = bytes.lastIndexOf(0x0a) + 1;
  const lines = [];
  for (let start = 0; start < end;) {
    const nl = bytes.indexOf(0x0a, start);
    lines.push(bytes.subarray(start, nl));
    start = nl + 1;
  }
  const entries = [];
  for (let i = 0; i < lines.length; i++) {
    const p = parse(lines[i]);
    const e = p?.value;
    if (i === 0 && isObject(e) && !has(e, 'v')) return { status: 'version 0', line: 1, seq: null };
    const at = (status) => ({ status, line: i + 1, seq: isObject(e) && typeOf(e.seq) === 'integer' ? e.seq : null });
    const problem = tooDeepIsInvalid(() => {
      const structure = isObject(e) && lines[i].length + 1 <= MAX_LINE && typed(e, KEYS) && e.v === 1 && inSubset(p.text, e)
        && (i === 0 ? e.kind === 'ledger.genesis' && typeof e.data.chain_id === 'string' && HEX32.test(e.data.chain_id) : e.kind !== 'ledger.genesis');
      if (!structure) return 'invalid';
      if (e.seq !== i) return 'tampered';
      if (e.prev !== (i ? entries[i - 1].hash : ZERO)) return 'tampered';
      if (e.hash !== entryHash(e)) return 'tampered';
      if (Buffer.compare(Buffer.from(canonical(e)), lines[i]) !== 0) return 'not canonical';
      return null;
    });
    if (problem) return at(problem);
    entries.push(e);
  }
  const last = { line: entries.length, seq: entries.length ? entries.length - 1 : null };
  const headProblem = head && checkHead(head, entries);
  if (headProblem) return headProblem;
  if (end < bytes.length) return { status: 'torn tail', ...last };
  return { status: 'intact', ...last, entries, head: Boolean(head) };
}

// A line nested deeper than ISR's checks can recurse is invalid, as one too deep for Polarizer's parser is.
function tooDeepIsInvalid(checks) {
  try {
    return checks();
  } catch (err) {
    if (err instanceof RangeError) return 'invalid';
    throw err;
  }
}

// A hold reason's values, by Polarizer's wording (HOLD-SPEC.md, section 4; TAINT-SPEC.md, sections 3 and 5):
// at most one host, in a URL reason at the start, and one path, between "argument NAME: " and the phrase
// that ends it. The path counts only when that phrase is the one such phrase there, so a path that holds
// one can't move where it ends. A reason 1 KiB long may have been cut. Returns the values, or null when
// the reason has a path or host ISR could not read one way only.
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const R = L.reason;
const PHRASES = [...R.ends, R.matches];
const REASON = new RegExp(`${R.start}(?:(${R.path}(?:${R.ends.map(escape).join('|')}|${escape(R.matches)}.+)))?$`, 's');
const CLAUSE = new RegExp(R.clause, 's');
const hits = (text) => PHRASES.reduce((n, p) => {
  for (let i = text.indexOf(p); i !== -1; i = text.indexOf(p, i + 1)) n++;
  return n;
}, 0);

function reasonValues(reason) {
  const m = Buffer.byteLength(reason) < R.maxBytes ? REASON.exec(reason) : null;
  if (m && (m[2] === undefined || hits(m[2]) === 1)) return [m[1], m[3]].filter((v) => v !== undefined);
  return CLAUSE.test(reason) ? null : [];
}

// MEASURE-SPEC.md, section 8: a reveal checks when sha256 of the prefix, its salt's 32 bytes and its label
// is the hold's plant_commit.
const PLANT_PREFIX = 'POLARIZER-PLANT/1\n';
function revealChecks(commit, { label, salt }) {
  if (typeof commit !== 'string' || !['real', 'planted'].includes(label) || !/^[0-9a-fA-F]{64}$/.test(salt)) return false;
  return createHash('sha256').update(PLANT_PREFIX).update(Buffer.from(salt, 'hex')).update(label).digest('hex') === commit;
}

// Polarizer may have planted a hold that has plant_commit. Its first reveal says which, if it checks, as
// Polarizer's hold fold and stats read it. A hold that was forwarded was real: a planted one never is.
function planted(h, reveal) {
  if (h.forwarded || !h.plant) return 'real';
  if (!reveal) return 'maybe';
  return revealChecks(h.commit, reveal) ? reveal.label : 'unchecked';
}

// Each tool's calls: how many were forwarded and their outcomes, how many were not and why, and the paths
// and hosts its holds name. A hold Polarizer revealed as planted was never the agents' call, so it is
// left out. Also how many hold reasons had a value ISR could not read.
export function tally(entries) {
  const tools = new Map();
  const holds = new Map();
  const reveals = new Map();
  const calls = new Map(); // a call.sent's seq, until its first call.returned: its tool
  const tool = (name) => {
    name = String(name);
    if (!tools.has(name)) tools.set(name, { name, forwarded: 0, outcomes: new Map(), notRun: new Map(), named: new Map() });
    return tools.get(name);
  };
  const bump = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);
  for (const { seq, kind, data } of entries) {
    const hold = typeof data.hold === 'string' ? holds.get(data.hold) : undefined;
    if (kind === 'hold.created' && typeof data.hold === 'string' && !hold) {
      holds.set(data.hold, { id: data.hold, tool: data.tool, reason: String(data.reason ?? ''), plant: has(data, 'plant_commit'), commit: data.plant_commit, ending: null, forwarded: false });
    } else if (hold && ['hold.decided', 'hold.expired', 'hold.abandoned'].includes(kind)) {
      hold.ending ??= kind === 'hold.decided' ? data.decision : 'undecided';
    } else if (kind === 'hold.revealed' && typeof data.hold === 'string' && typeof data.label === 'string' && typeof data.salt === 'string') {
      if (!reveals.has(data.hold)) reveals.set(data.hold, data);
    } else if (kind === 'call.sent') {
      const t = tool(data.tool);
      t.forwarded++;
      calls.set(seq, t);
      if (hold) hold.forwarded = true;
    } else if (kind === 'call.returned' && calls.has(data.call_seq)) {
      if (typeof data.outcome === 'string' && has(L.outcomes, data.outcome)) bump(calls.get(data.call_seq).outcomes, data.outcome);
      calls.delete(data.call_seq);
    } else if (kind === 'call.refused' && !hold) bump(tool(data.tool).notRun, L.notRun.refused);
  }
  let unread = 0;
  for (const h of holds.values()) {
    const state = planted(h, reveals.get(h.id));
    if (state === 'planted') continue;
    const t = tool(h.tool);
    if (!h.forwarded) bump(t.notRun, L.notRun[state === 'maybe' ? 'maybePlanted' : state === 'unchecked' ? 'didNotCheck' : h.ending === 'deny' ? 'denied' : h.ending === 'allow' ? 'allowed' : 'undecided']);
    if (state !== 'real') continue;
    const values = reasonValues(h.reason);
    if (!values) unread++;
    // A value named in any hold that was forwarded is marked forwarded.
    for (const v of values ?? []) if (h.forwarded || !t.named.has(v)) t.named.set(v, h.forwarded ? 'forwarded' : 'not run');
  }
  const notRun = (t) => [...t.notRun.values()].reduce((a, n) => a + n, 0);
  const sorted = [...tools.values()].sort((a, b) => b.forwarded - a.forwarded || notRun(b) - notRun(a) || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  return { tools: sorted, unread };
}

// A ledger value as a code span, so it reads as data. Anything outside printable ASCII, the characters
// Markdown or the checker would read as structure, and quotes are written as JSON escapes, so an empty
// value can be written "" and nothing else is.
export function code(value) {
  let text = '';
  for (const c of String(value)) {
    const n = c.codePointAt(0);
    if (n >= 0x20 && n <= 0x7e && !'`;[]"'.includes(c)) text += c;
    else for (const unit of c.length === 2 ? [c.charCodeAt(0), c.charCodeAt(1)] : [n]) text += `\\u${unit.toString(16).padStart(4, '0')}`;
  }
  if (text.length > 200) text = `${text.slice(0, 197)}...`;
  return `\`${text || '""'}\``;
}

function item(t) {
  const parts = [];
  if (t.forwarded) {
    const counts = Object.entries(L.outcomes).filter(([k]) => t.outcomes.has(k)).map(([k, words]) => `${t.outcomes.get(k)} ${words}`);
    const unknown = t.forwarded - [...t.outcomes.values()].reduce((a, n) => a + n, 0);
    if (unknown) counts.push(`${unknown} ${L.noOutcome}`);
    parts.push(`${t.forwarded} forwarded (${counts.join(', ')})`);
  }
  const reasons = [...t.notRun];
  const notRun = reasons.reduce((a, [, n]) => a + n, 0);
  if (notRun) parts.push(`${notRun} not run (${reasons.map(([label, n]) => `${n} ${label}`).join(', ')})`);
  // "1 call forwarded (1 ok), 2 not run": the first count names the calls.
  let line = `- ${code(t.name)}: ${parts.join(', ').replace(/^(\d+) /, (_, n) => `${n} ${n === '1' ? 'call' : 'calls'} `)}.`;
  const named = [...t.named];
  if (named.length) {
    const shown = named.slice(0, L.maxNamed).map(([v, where]) => `${code(v)} (${where})`);
    const more = named.length - L.maxNamed;
    line += ` ${L.named} ${shown.join(', ')}${more > 0 ? `, and ${more} more` : ''}.`;
  }
  return line;
}

const why = (r) => fill(r.line === null ? L.why.head : r.status === 'torn tail' ? L.why.torn : L.why.line, r);

// The section's lines, how many tools it names, and how many hold reasons it could not read.
export function section(result) {
  const none = (text) => ({ lines: [`## ${HEADING} (0)`, text], tools: 0, unread: 0 });
  if (result.status === 'unreadable') return none(fill(L.none.unreadable, result));
  if (result.status === 'empty') return none(L.none.empty);
  if (result.status === 'version 0') return none(L.none.version0);
  if (result.status !== 'intact') return none(fill(L.none.broken, { why: why(result) }));
  const { tools, unread } = tally(result.entries);
  if (!tools.length) return none(L.none.intact);
  const max = shape.maxItems;
  const shown = tools.slice(0, max);
  const lines = [`## ${HEADING} (${tools.length}${tools.length > max ? `, ${max} shown` : ''})`, ...shown.map(item)];
  if (tools.length > max) lines.push(`Not shown (${tools.length - max}): ${tools.slice(max).map((t) => code(t.name)).join(shape.notShown.separator)}`);
  return { lines, tools: tools.length, unread };
}

// What Not looked at must also say about a ledger, as [the shape's said pattern, its message].
export function notes(ledger) {
  const out = [];
  if (ledger.status === 'intact' && !ledger.head) out.push([L.saidAlso.noHead, 'ledgerNoHead']);
  if (ledger.unread) out.push([L.saidAlso.unread, 'ledgerUnread']);
  return out;
}

// A path to a ledger file or its folder. A file that can't be read is reported in the section, not thrown.
export function readLedger(path) {
  let result;
  try {
    const file = statSync(path).isDirectory() ? join(path, L.folderFile) : path;
    const headFile = file.endsWith('.jsonl') ? `${file.slice(0, -'.jsonl'.length)}.head` : null;
    result = verify(readFileSync(file), headFile && existsSync(headFile) ? readFileSync(headFile) : null);
  } catch (err) {
    result = { status: 'unreadable', why: err.code ?? 'an error reading it' };
  }
  return { ...result, ...section(result) };
}

export function main(args) {
  if (args.length !== 1) {
    console.error('Usage: node ledger.js LEDGER');
    return 2;
  }
  const ledger = readLedger(args[0]);
  console.log(ledger.lines.join('\n'));
  for (const [, message] of notes(ledger)) console.error(fill(shape.messages[message], ledger));
  return 0;
}

// realpath, so it also runs when the skill folder is a symlink.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) process.exitCode = main(process.argv.slice(2));
