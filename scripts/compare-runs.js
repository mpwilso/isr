// Lines up several acceptance scripts from runs on the same inputs: node scripts/compare-runs.js SCRIPT SCRIPT [...]
// It matches criteria by number, so it can say where each run put each one. Confirm questions are free
// text and change wording from run to run, so it compares only how many each run asked.
// Prints the table and exits 0, or exits 2 on bad usage or a file it cannot read.
import { readFileSync, realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseSections, refs, shape } from '../skill/src/check.js';

const defs = shape.script.sections;
const NOT_A_SCRIPT = 'not a script';

// One run: its Type, the count each section's heading gives, and the section each criterion is in.
export function readRun(text) {
  const lines = text.replace(/\n+$/, '').split('\n');
  const type = (lines[0] ?? '').replace(/^Type: /, '');
  const title = lines.findIndex((l) => new RegExp(shape.script.title).test(l));
  if (title === -1) return { type, counts: {}, criteria: new Map(), script: false };
  const sections = parseSections(lines, { title: title + 1 }, defs, () => {});
  const counts = {};
  const criteria = new Map();
  for (const def of defs) {
    const s = sections[def.key];
    counts[def.key] = !s || s.none ? 0 : s.said ?? s.items.length + s.checks.length;
    if (!s || !def.criteria) continue;
    const covers = s.checks.map((c) => c.body.find((b) => /^- Covers:/.test(b.line))?.line ?? '');
    for (const line of [...s.items.map((i) => i.line), ...covers, ...(s.notShown?.names ?? [])]) {
      for (const n of refs(line)) if (!criteria.has(n)) criteria.set(n, def.heading);
    }
  }
  return { type, counts, criteria, script: true };
}

export function compare(runs) {
  const out = runs.map((r, i) => `Run ${i + 1}: ${r.name}`);
  const row = (label, cells) => [label, ...cells];
  const rows = [row('', runs.map((_, i) => `run ${i + 1}`)), row('Type', runs.map((r) => r.type))];
  for (const def of defs) rows.push(row(def.heading, runs.map((r) => (r.script ? String(r.counts[def.key]) : NOT_A_SCRIPT))));
  const numbers = [...new Set(runs.flatMap((r) => [...r.criteria.keys()]))].sort((a, b) => a - b);
  let agreed = 0;
  for (const n of numbers) {
    const cells = runs.map((r) => (r.script ? r.criteria.get(n) ?? 'missing' : NOT_A_SCRIPT));
    const same = cells.every((c) => c === cells[0]) && cells[0] !== 'missing';
    if (same) agreed++;
    rows.push(row(`Criterion ${n}`, [...cells, same ? '' : 'differs']));
  }
  const widths = rows[0].map((_, k) => Math.max(...rows.map((r) => (r[k] ?? '').length)));
  out.push('', ...rows.map((r) => r.map((c, k) => (c ?? '').padEnd(widths[k] ?? 0)).join('  ').trimEnd()));
  out.push('', `${agreed} of ${numbers.length} criteria are in the same section in every run.`);
  return out.join('\n');
}

export function main(args) {
  if (args.length < 2) {
    console.error('Usage: node scripts/compare-runs.js SCRIPT SCRIPT [...]');
    return 2;
  }
  let runs;
  try {
    runs = args.map((name) => ({ name, ...readRun(readFileSync(name, 'utf8')) }));
  } catch (err) {
    console.error(`Not compared: ${err.message}`);
    return 2;
  }
  console.log(compare(runs));
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) process.exitCode = main(process.argv.slice(2));
