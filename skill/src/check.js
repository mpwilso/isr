// Checks an acceptance script against the shape in ../spec/script-shape.json.
//   node check.js SCRIPT [--story FILE] [--record FILE_OR_TASK_FOLDER]
// With --story it also checks that every acceptance criterion appears exactly once.
// With --story and no --record, it holds the script to the rules for "no record was given".
// Prints one line per problem and exits 1, or prints "Checked with Node VERSION." and exits 0.
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const shape = JSON.parse(readFileSync(join(here, '..', 'spec', 'script-shape.json'), 'utf8'));
const re = (pattern, flags = '') => new RegExp(pattern, flags);
const isVerdict = (line) => re(shape.banned.verdict, 'i').test(line);
const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k]));
// A Confirm source phrase as a whole-text pattern: "criterion N leaves this open" takes any number for N.
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const sourcePattern = (phrase) => re(`^${escape(phrase).replace(/\bN\b/g, '\\d+')}$`);

export function readStory(text) {
  const sections = new Map();
  let current = null;
  for (const line of text.split('\n')) {
    const heading = line.match(/^(#{1,2}) (.+?)\s*$/);
    if (heading) {
      current = heading[1] === '##' ? heading[2] : null;
      if (current) sections.set(current, []);
    } else if (current) sections.get(current).push(line);
  }
  // Loupe's v1 stories say "Acceptance criteria"; its v2 stories say "Requirements". Either counts.
  const headings = shape.story.criteria.filter((s) => sections.has(s));
  const criteria = headings.flatMap((s) => sections.get(s)).filter((l) => re(shape.story.item).test(l));
  const thin = re(shape.story.notReady, 'm').test(text);
  return {
    notReady: thin || criteria.length === 0,
    firstQuestion: re(shape.story.firstQuestion, 'm').test(text),
    criteria,
    missing: [...(headings.length ? [] : [shape.story.criteria[0]]), ...shape.story.sections.filter((s) => !sections.has(s))],
  };
}

// A record is a task folder (record.md, intent.md, plan.md) or one file of pasted text.
export function readRecord(path) {
  if (statSync(path).isDirectory()) {
    const file = join(path, shape.record.folderFile);
    if (!existsSync(file)) return { notReady: `the task folder has no ${shape.record.folderFile}`, skipped: 0 };
    path = file;
  }
  const text = readFileSync(path, 'utf8');
  const skipped = Math.max(0, ...[...text.matchAll(re(shape.record.skipped, 'g'))].map((m) => Number(m[1])));
  for (const pattern of shape.record.notReady) {
    const m = text.match(re(pattern, 'm'));
    if (m) return { notReady: `the record says "${m[0]}"`, skipped };
  }
  for (const m of text.matchAll(re(shape.record.passedOf, 'g'))) {
    if (Number(m[1]) < Number(m[2])) return { notReady: `the record says "${m[0]}"`, skipped };
  }
  return { notReady: null, skipped };
}

export function check(text, { story = null, record = null } = {}) {
  const lines = text.replace(/\n+$/, '').split('\n');
  const problems = [];
  const add = (line, rule, key, vars = {}) =>
    problems.push({ line, rule, message: fill(shape.messages[key] ?? key, vars) });

  // Banned anywhere: dashes, double hyphens used as dashes, verdict fields, the team's own words.
  const dashes = shape.banned.dashes.map(([code, name]) => [String.fromCodePoint(code), name]);
  lines.forEach((line, i) => {
    for (const [char, name] of dashes) if (line.includes(char)) add(i + 1, 'dash', 'dash', { name });
    if (re(shape.banned.doubleHyphen).test(line)) add(i + 1, 'dash', 'doubleHyphen');
    for (const w of shape.banned.teamWords) {
      const found = line.match(re(w.pattern, w.flags));
      if (found) add(i + 1, 'team-words', 'teamWords', { found: found[0], instead: w.instead });
    }
    if (i > 3 && isVerdict(line)) add(i + 1, 'verdict', 'verdict');
  });

  shape.top.forEach((top, i) => {
    if (!re(top.pattern).test(lines[i] ?? '')) add(i + 1, 'top-lines', top.message);
  });
  if (lines[4] !== '') add(5, 'layout', 'layout');

  const title = lines[5] ?? '';
  const kind = re(shape.script.title).test(title) ? 'script' : re(shape.notReady.title).test(title) ? 'notReady' : null;
  if (!kind) {
    add(6, 'title', 'title');
    return sorted(problems);
  }
  const defs = kind === 'script' ? shape.script.sections : [{ key: 'missing', heading: shape.notReady.section, required: true }];
  const sections = parseSections(lines, defs, add);

  for (const [key, s] of Object.entries(sections)) checkCounts(s, add);
  if (kind === 'script') checkScript(lines, sections, { story, record }, add);
  else {
    if (!re(shape.notReady.next).test(lines[3] ?? '')) add(4, 'not-ready', 'notReadyNext');
    if (story && !story.notReady) add(6, 'not-ready', 'storyReady');
  }
  return sorted(problems);
}

const sorted = (problems) => problems.sort((a, b) => a.line - b.line);

function parseSections(lines, defs, add) {
  const order = defs.map((d) => d.heading).join(', ');
  const sections = {};
  let current = null;
  let check = null;
  let lastIndex = -1;
  for (let i = 6; i < lines.length; i++) {
    const line = lines[i];
    const n = i + 1;
    if (/^#/.test(line) && lines[i - 1] !== '') add(n, 'layout', 'layout');
    const h = line.match(re(shape.heading));
    if (h) {
      const def = defs.find((d) => d.heading === h[1]);
      if (!def) { add(n, 'sections', 'unknownSection', { heading: h[1], order }); current = null; continue; }
      if (sections[def.key]) { add(n, 'sections', 'duplicateSection', { heading: h[1] }); current = null; continue; }
      const index = defs.indexOf(def);
      if (index < lastIndex) add(n, 'sections', 'outOfOrder', { heading: h[1], order });
      lastIndex = Math.max(lastIndex, index);
      if (h[2] === undefined) add(n, 'counts', 'headingCount', { heading: h[1] });
      const said = h[2] === undefined ? null : Number(h[2]);
      const saidShown = h[3] === undefined ? null : Number(h[3]);
      current = sections[def.key] = { def, line: n, said, saidShown, items: [], checks: [], none: false, notShown: null };
      check = null;
      continue;
    }
    if (line === '' || isVerdict(line)) continue; // a verdict line is reported once, as a verdict
    if (!current) { add(n, 'stray', 'stray'); continue; }
    const shown = line.match(re(shape.notShown.pattern));
    if (shown) { current.notShown = { line: n, said: Number(shown[1]), names: shown[2].split(shape.notShown.separator) }; continue; }
    if (re(shape.none).test(line)) { current.none = true; continue; }
    if (current.def.checks) {
      const t = line.match(re(shape.script.check.title));
      if (t) { check = { line: n, number: Number(t[1]), body: [] }; current.checks.push(check); continue; }
      if (check && !current.notShown) { check.body.push({ n, line }); continue; }
    } else if (line.startsWith('- ') && !current.notShown) {
      current.items.push({ n, line });
      continue;
    }
    add(n, 'stray', 'stray');
  }
  for (const def of defs) {
    if (def.required && !sections[def.key]) add(6, 'sections', 'missingSection', { heading: def.heading });
  }
  return sections;
}

function checkCounts(s, add) {
  const heading = s.def.heading;
  const shown = s.def.checks ? s.checks.length : s.items.length;
  const hidden = s.notShown ? s.notShown.said : 0;
  const max = shape.maxItems;
  if (s.none && shown) add(s.line, 'counts', 'noneMixed', { heading });
  else if (s.none && s.said) add(s.line, 'counts', 'noneWithCount', { heading });
  else if (!s.none && !shown && !s.notShown) add(s.line, 'counts', 'empty', { heading });
  if (s.said !== null && !s.none && s.said !== shown + hidden) add(s.line, 'counts', 'headerCount', { heading, said: s.said, shown, hidden });
  if (s.notShown && s.notShown.names.length !== s.notShown.said) {
    add(s.notShown.line, 'counts', 'notShownCount', { said: s.notShown.said, named: s.notShown.names.length });
  }
  if (shown > max) add(s.line, 'max-items', 'tooMany', { heading, count: shown, max });
  if (s.notShown && shown < max) add(s.notShown.line, 'max-items', 'hiddenTooSoon', { heading, count: shown, max });
  // When the cap hides items, the heading says how many it shows: "## Confirm (8, 5 shown)".
  if (s.said !== null && s.notShown && s.saidShown !== shown) add(s.line, 'shown-count', 'headingShown', { heading, hidden, said: s.said, shown });
  if (s.said !== null && !s.notShown && s.saidShown !== null) add(s.line, 'shown-count', 'headingNoneHidden', { heading, said: s.said });
  if (s.def.item) {
    for (const item of s.items) if (!re(s.def.item).test(item.line)) add(item.n, 'item-shape', s.def.itemMessage);
  }
}

// Criterion numbers an item names: "Criterion 3", "criteria 1 and 2".
function refs(text) {
  const out = [];
  for (const m of text.matchAll(re(shape.criterionRef, 'gi'))) out.push(...m[1].split(/\D+/).filter(Boolean).map(Number));
  return out;
}

function checkScript(lines, sections, { story, record }, add) {
  const c = shape.script.check;
  const risks = c.risks;
  let worst = 0;
  const covered = []; // [criterion, line]
  const byHand = sections.byHand;

  byHand?.checks.forEach((check, i) => {
    if (check.number !== i + 1) add(check.line, 'check-fields', 'checkNumber', { expected: i + 1 });
    const order = c.fields.map((f) => f.label).join(', ');
    const label = re(`^- (?:${c.fields.map((f) => f.label).join('|')}):`);
    let at = -1;
    for (const field of c.fields) {
      const found = check.body.findIndex((b) => re(field.pattern).test(b.line));
      if (found === -1 || found < at) add(check.line, 'check-fields', 'checkField', { n: check.number, label: field.label, order });
      else at = found;
    }
    const steps = check.body.filter((b) => re(c.step).test(b.line));
    if (!steps.length) add(check.line, 'steps', 'noSteps', { n: check.number });
    if (steps.length > c.maxSteps) add(steps[c.maxSteps].n, 'steps', 'tooManySteps', { n: check.number, count: steps.length, max: c.maxSteps });
    for (const s of steps) {
      if (s.line.replace(/^\s*\d+\.\s+/, '').split(re(c.sentenceSplit)).length > 1) add(s.n, 'steps', 'longStep');
    }
    for (const b of check.body) {
      if (!label.test(b.line) && !re(c.step).test(b.line) && !isVerdict(b.line)) add(b.n, 'stray', 'stray');
      if (re(shape.banned.businessWords.fields).test(b.line)) {
        const words = b.line.replace(/^- \w+:|^\s*\d+\./, '');
        for (const p of shape.banned.businessWords.patterns) {
          if (re(p.pattern).test(words)) add(b.n, 'business-words', 'businessWords', { what: p.what });
        }
      }
    }
    const risk = check.body.map((b) => b.line.match(re(c.fields[0].pattern))).find(Boolean)?.[1];
    if (risk) {
      const r = risks.indexOf(risk);
      if (r < worst) add(check.line, 'risk-order', 'riskOrder', { risk, before: risks[worst] });
      worst = Math.max(worst, r);
    }
    const covers = check.body.find((b) => /^- Covers:/.test(b.line));
    if (covers) for (const n of refs(covers.line)) covered.push([n, covers.n]);
    // Found in the blind read of the e9a55a script: readers saw "criterion 3" and could not tell what it asked.
    if (covers && refs(covers.line).length && !re(c.coversNamed).test(covers.line)) add(covers.n, 'covers-name', 'coversName');
  });

  // Each Confirm source is a plain phrase from the shape file, so a reader never sees the story's section names.
  const phrases = shape.script.sources.map((s) => s.phrase);
  for (const item of sections.confirm?.items ?? []) {
    const source = item.line.match(re(shape.script.source.pattern))?.[1];
    if (!source) continue; // item-shape reports a missing source
    if (!source.split(shape.script.source.separator).every((part) => phrases.some((p) => sourcePattern(p).test(part)))) {
      add(item.n, 'confirm-source', 'confirmSource', { phrases: phrases.map((p) => `"${p}"`).join(', ') });
    }
  }

  for (const key of ['verified', 'notCovered']) {
    for (const item of sections[key]?.items ?? []) {
      const found = refs(item.line);
      if (!found.length) add(item.n, 'item-shape', 'noCriterion');
      for (const n of found) covered.push([n, item.n]);
    }
  }
  for (const key of ['verified', 'byHand', 'notCovered']) {
    const shown = sections[key]?.notShown;
    for (const name of shown?.names ?? []) {
      const found = refs(name);
      if (!found.length) add(shown.line, 'item-shape', 'noCriterion');
      for (const n of found) covered.push([n, shown.line]);
    }
  }

  // Found in real run 1: a record with a skipped test, and a Verified by that said "43 of 43".
  if (record?.skipped) {
    const r = shape.record;
    const said = record.skipped === 1 ? '1 test was skipped' : `${record.skipped} tests were skipped`;
    for (const item of sections.verified?.items ?? []) {
      const all = item.line.match(re(r.allPassed));
      if (all) add(item.n, 'skipped-tests', 'skippedAllPassed', { skipped: said, text: all[0] });
      else if (re(r.passedCount).test(item.line) && !re(fill(r.skippedCount, { n: record.skipped })).test(item.line)) {
        add(item.n, 'skipped-tests', 'skippedNotSaid', { skipped: said });
      }
    }
  }

  // The Bottom line's counts against the section headings.
  const said = (key) => (sections[key] ? (sections[key].none ? 0 : sections[key].said) : null);
  const m = (lines[1] ?? '').match(re(shape.script.counts));
  if (!m) add(2, 'counts', 'bottomCounts');
  else {
    const pairs = [['verified', 'verified', m[1]], ['byHand', 'to check by hand', m[2]], ['confirm', 'to confirm', m[3]], ['notCovered', 'not covered', m[4]]];
    for (const [key, what, value] of pairs) {
      const count = said(key) ?? 0;
      if (Number(value ?? 0) !== count) add(2, 'counts', 'bottomMismatch', { said: value ?? 'nothing', what, count });
    }
  }

  const type = (lines[0] ?? '').replace(/^Type: /, '');
  if (sections.notCovered?.items.some((i) => i.line.includes(shape.script.movedToConfirm)) && type !== 'Decision needed') {
    add(1, 'type', 'movedType');
  }

  if (record?.notReady) {
    if (type !== shape.record.type) add(1, 'build-not-ready', 'buildNotReadyType', { why: record.notReady });
    if (!re(shape.record.bottomLine).test(lines[1] ?? '')) add(2, 'build-not-ready', 'buildNotReadyBottom', { why: record.notReady });
  }
  if (!story) return;
  if (story.notReady) {
    add(6, 'not-ready', 'storyNotReady');
    return;
  }
  if (!record) {
    if (said('verified')) add(sections.verified.line, 'no-record', 'noRecordVerified');
    if (!re(shape.noRecord, 'i').test(lines[2] ?? '')) add(3, 'no-record', 'noRecordSaid');
  }
  const notLookedAt = (lines[2] ?? '').toLowerCase();
  for (const section of story.missing) {
    const words = shape.story.sectionWords[section];
    if (!notLookedAt.includes(words)) add(3, 'missing-sections', 'missingStorySection', { section, words });
  }
  if (story.firstQuestion) {
    const first = sections.confirm?.items[0];
    const source = first?.line.match(re(shape.script.source.pattern))?.[1] ?? '';
    if (!source.split(shape.script.source.separator).includes(shape.script.firstQuestionSource)) {
      add(first?.n ?? sections.confirm?.line ?? 6, 'first-question', 'firstQuestion');
    }
  }
  const total = story.criteria.length;
  const seen = new Map();
  for (const [n, line] of covered) {
    if (n < 1 || n > total) add(line, 'coverage-unknown', 'coverageUnknown', { n, count: total });
    else if (seen.has(n)) add(line, 'coverage-duplicate', 'coverageDuplicate', { n });
    else seen.set(n, line);
  }
  const where = sections.verified?.line ?? 6;
  for (let n = 1; n <= total; n++) if (!seen.has(n)) add(where, 'coverage-missing', 'coverageMissing', { n });
}

export function main(args) {
  const opts = {};
  const files = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--story' || args[i] === '--record') opts[args[i].slice(2)] = args[++i];
    else files.push(args[i]);
  }
  if (files.length !== 1 || Object.values(opts).some((v) => !v)) {
    console.error('Usage: node check.js SCRIPT [--story FILE] [--record FILE_OR_TASK_FOLDER]');
    return 2;
  }
  let problems;
  try {
    problems = check(readFileSync(files[0], 'utf8'), {
      story: opts.story ? readStory(readFileSync(opts.story, 'utf8')) : null,
      record: opts.record ? readRecord(opts.record) : null,
    });
  } catch (err) {
    console.error(`Not checked: ${err.message}`);
    return 2;
  }
  for (const p of problems) console.log(`${files[0]}:${p.line}: ${p.message} [${p.rule}]`);
  if (problems.length) return 1;
  console.log(`Checked with Node ${process.versions.node}.`);
  return 0;
}

// realpath, so the checker also runs when the skill folder is a symlink.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) process.exitCode = main(process.argv.slice(2));
