// Checks the files that follow an acceptance script, each against its shape in ../spec/:
// a script review (review-shape.json), hand check results (results-shape.json) and a lesson (lesson-shape.json).
// Each file names the files it rests on, by path from its own folder, and the checker reads them:
// a review names its script; results name the story, the script and the review; a lesson names the results.
// check.js imports this file and this file imports check.js, so neither uses the other's exports while loading.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkWords, fill, isVerdict, parseSections, readStory, readTop, refs, shape } from './check.js';

const here = dirname(fileURLToPath(import.meta.url));
const load = (name) => JSON.parse(readFileSync(join(here, '..', 'spec', name), 'utf8'));
export const shapes = { review: load('review-shape.json'), results: load('results-shape.json'), lesson: load('lesson-shape.json') };
const re = (pattern, flags = '') => new RegExp(pattern, flags);
const DATE = /\d{4}-\d{2}-\d{2}/;
const realDate = (s) => {
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};
const classNames = shapes.lesson.classes.map((c) => c.name);
const withClasses = (pattern) => pattern.replace(/\{classes\}/g, classNames.join('|'));
const field = (spec, label) => spec.fields.find((f) => f.label === label);
const quoted = (list) => list.map((p) => `"${p}"`).join(', ');
const noop = () => {};

const titleIndex = (lines) => lines.findIndex((l) => l.startsWith('# '));
export function followupKind(text) {
  const lines = text.split('\n');
  const i = titleIndex(lines);
  return i === -1 ? null : Object.keys(shapes).find((k) => re(shapes[k].title).test(lines[i])) ?? null;
}

// Reads a follow-up file into its top lines (a lesson's), title, fields and sections, and reports what is out of shape.
export function readFollowup(text, kind, add = noop) {
  const spec = shapes[kind];
  const lines = text.replace(/\n+$/, '').split('\n');
  const head = kind === 'lesson' ? readTop(lines, add) : null;
  const t = titleIndex(lines);
  if (head && t !== head.title - 1) add(head.title, 'title', 'followTitle', { n: head.title });
  checkWords(lines, head ? head.line.at(-1) : 0, add);
  const doc = { head, title: lines[t].match(re(spec.title))[1], titleLine: t + 1, fields: {}, fieldLine: {}, sections: {} };

  const order = spec.sections.map((s) => s.heading).join(', ');
  const seen = [];
  let statement = false;
  let section = null;
  let entry = null;
  let fence = false;
  let lastIndex = -1;
  for (let i = t + 1; i < lines.length; i++) {
    const line = lines[i];
    const n = i + 1;
    if (section?.def?.kind === 'block' && /^```/.test(line)) { section.fences.push(n); fence = !fence; continue; }
    if (fence) { section.block.push({ n, line }); continue; }
    if (line === '' || isVerdict(line)) continue; // a verdict line is reported once, as a verdict
    if (/^#/.test(line) && lines[i - 1] !== '') add(n, 'layout', 'layout');
    const h = line.match(/^## (.+?)(?: \((\d+)\))?$/);
    if (h) {
      const def = spec.sections.find((d) => d.heading === h[1]);
      entry = null;
      if (!def) { add(n, 'sections', 'unknownSection', { heading: h[1], order }); section = { skip: true }; continue; }
      if (doc.sections[def.key]) { add(n, 'sections', 'duplicateSection', { heading: h[1] }); section = { skip: true }; continue; }
      const index = spec.sections.indexOf(def);
      if (index < lastIndex) add(n, 'sections', 'outOfOrder', { heading: h[1], order });
      lastIndex = Math.max(lastIndex, index);
      if (def.count !== false && h[2] === undefined) add(n, 'counts', 'headingCount', { heading: h[1] });
      section = doc.sections[def.key] = { def, line: n, said: h[2] === undefined ? null : Number(h[2]), items: [], entries: [], block: [], fences: [], none: false };
      continue;
    }
    if (section?.skip) continue;
    const f = line.match(/^- ([^:]+): (.*)$/);
    if (!section) {
      if (line === spec.statement) { statement = true; continue; }
      if (!f || !field(spec, f[1])) { add(n, 'stray', 'followStray'); continue; }
      if (f[1] in doc.fields) { add(n, 'fields', 'followFieldRepeated', { label: f[1] }); continue; }
      doc.fields[f[1]] = f[2];
      doc.fieldLine[f[1]] = n;
      seen.push(f[1]);
      continue;
    }
    if (section.def.kind !== 'block' && re(shape.none).test(line)) { section.none = true; continue; }
    if (section.def.kind === 'checks') {
      const c = line.match(re(spec.check.title));
      if (c) { entry = { n, number: Number(c[1]), title: c[2], fields: {}, lines: {}, order: [] }; section.entries.push(entry); continue; }
      if (entry && f && field(spec.check, f[1]) && !(f[1] in entry.fields)) {
        entry.fields[f[1]] = f[2];
        entry.lines[f[1]] = n;
        entry.order.push(f[1]);
        continue;
      }
    } else if (section.def.kind === 'items' && line.startsWith('- ')) { section.items.push({ n, line }); continue; }
    add(n, 'stray', 'followStray');
  }
  if (fence) add(section.fences.at(-1), 'block', 'block');

  const labels = spec.fields.map((d) => d.label);
  const valid = (def, value) => (def.covers
    ? re(shape.script.check.coversNamed).test(`- Covers: ${value}`)
    : re(withClasses(def.pattern)).test(value) && (!def.date || !DATE.test(value) || realDate(value.match(DATE)[0])));
  for (const def of spec.fields) {
    const value = doc.fields[def.label];
    if (value === undefined) add(doc.titleLine, 'fields', def.message);
    else if (!valid(def, value)) add(doc.fieldLine[def.label], 'fields', def.message);
  }
  const expected = labels.filter((l) => seen.includes(l));
  const wrong = seen.findIndex((l, k) => l !== expected[k]);
  if (wrong !== -1) add(doc.fieldLine[seen[wrong]], 'fields', 'followFieldOrder', { label: seen[wrong], order: labels.join(', ') });
  if (spec.statement && !statement) add(doc.titleLine, 'statement', 'followStatement', { statement: spec.statement });

  for (const def of spec.sections) if (!doc.sections[def.key]) add(doc.titleLine, 'sections', 'missingSection', { heading: def.heading });
  for (const s of Object.values(doc.sections)) {
    if (s.def.kind === 'block') continue;
    const heading = s.def.heading;
    const shown = s.items.length + s.entries.length;
    if (s.none && shown) add(s.line, 'counts', 'noneMixed', { heading });
    else if (s.none && s.said) add(s.line, 'counts', 'noneWithCount', { heading });
    else if (!s.none && !shown) add(s.line, 'counts', 'empty', { heading });
    if (s.said !== null && !s.none && s.said !== shown) add(s.line, 'counts', 'followCount', { heading, said: s.said, shown });
    if (s.def.max && shown > s.def.max) add(s.line, 'max-items', 'followTooMany', { heading, count: shown, max: s.def.max });
    for (const item of s.items) if (!re(s.def.item).test(item.line)) add(item.n, 'item-shape', s.def.itemMessage);
    const checkLabels = spec.check?.fields.map((d) => d.label) ?? [];
    for (const e of s.entries) {
      let at = -1;
      for (const def of spec.check.fields) {
        const k = e.order.indexOf(def.label);
        if (k === -1 || k < at) add(e.n, 'check-fields', 'checkField', { n: e.number, label: def.label, order: checkLabels.join(', ') });
        else {
          at = k;
          if (!valid(def, e.fields[def.label])) add(e.lines[def.label], 'check-fields', 'checkValue', { n: e.number, label: def.label, what: def.message });
        }
      }
    }
  }
  return doc;
}

// A file this one names, by path from its folder. Reports a problem and returns null when it is not there.
function linked(doc, label, dir, add, value = doc.fields[label]) {
  if (!value) return null;
  const path = resolve(dir, value);
  if (!existsSync(path) || !statSync(path).isFile()) { add(doc.fieldLine[label], 'link', 'followLink', { path: value }); return null; }
  return { path, dir: dirname(path), text: readFileSync(path, 'utf8') };
}

// An acceptance script's title and its checks by hand, or null when the text is not a script.
function readScript(text) {
  const lines = text.replace(/\n+$/, '').split('\n');
  const head = readTop(lines, noop);
  const title = lines[head.title - 1] ?? '';
  if (!re(shape.script.title).test(title)) return null;
  const sections = parseSections(lines, head, shape.script.sections, noop);
  return {
    title: title.replace(/^# Acceptance script: /, ''),
    checks: (sections.byHand?.checks ?? []).map((c) => ({
      number: c.number,
      title: lines[c.line - 1].replace(/^### \d+\. /, ''),
      covers: c.body.find((b) => b.line.startsWith('- Covers: '))?.line.slice('- Covers: '.length),
    })),
  };
}

function checkReview(doc, dir, add) {
  const script = linked(doc, 'Script', dir, add);
  if (!script) return;
  const s = readScript(script.text);
  if (!s) add(doc.fieldLine.Script, 'link', 'followLinkKind', { path: doc.fields.Script, what: 'an acceptance script' });
  else if (s.title !== doc.title) add(doc.titleLine, 'link', 'followLinkTitle', { what: 'the script', title: s.title });
}

function checkResults(doc, dir, add) {
  const spec = shapes.results;
  const story = linked(doc, 'Story', dir, add);
  const script = linked(doc, 'Script', dir, add);
  const review = linked(doc, 'Review', dir, add);
  const checks = doc.sections.checks?.entries ?? [];

  // What the tester says, in the template's phrases, and evidence unless the check was not finished or not run.
  for (const e of checks) {
    const said = e.fields['Tester says']?.replace(/\.$/, '');
    const outcome = spec.outcomes.find((o) => o.phrase === said);
    if (said !== undefined && !outcome) add(e.lines['Tester says'], 'outcome', 'outcome', { phrases: quoted(spec.outcomes.map((o) => o.phrase)) });
    const evidence = e.fields.Evidence;
    if (evidence === undefined) continue;
    if (evidence === spec.evidence.none) {
      if (outcome?.evidence) add(e.lines.Evidence, 'evidence', 'evidenceNone', { outcome: outcome.phrase });
    } else if (!evidence.split(spec.evidence.separator).every((part) => re(spec.evidence.part).test(part))) {
      add(e.lines.Evidence, 'evidence', 'evidencePart');
    }
  }
  checks.forEach((e, i) => { if (e.number !== i + 1) add(e.n, 'check-number', 'checkNumber', { expected: i + 1 }); });

  // The same checks as the script, by number, title and Covers line.
  const s = script && readScript(script.text);
  if (script && !s) add(doc.fieldLine.Script, 'link', 'followLinkKind', { path: doc.fields.Script, what: 'an acceptance script' });
  if (s) {
    if (s.title !== doc.title) add(doc.titleLine, 'link', 'followLinkTitle', { what: 'the script', title: s.title });
    for (const e of checks) {
      const c = s.checks.find((x) => x.number === e.number);
      if (!c) { add(e.n, 'script-checks', 'notInScript', { n: e.number }); continue; }
      if (c.title !== e.title) add(e.n, 'script-checks', 'scriptTitle', { n: e.number, title: c.title });
      if (e.fields.Covers !== undefined && e.fields.Covers !== c.covers) add(e.lines.Covers, 'script-checks', 'scriptCovers', { n: e.number, covers: c.covers });
    }
    for (const c of s.checks) {
      if (!checks.some((e) => e.number === c.number)) add(doc.sections.checks?.line ?? doc.titleLine, 'script-checks', 'missingCheck', { n: c.number, title: c.title });
    }
  }

  // A person reviewed this script, approved it for use, and did so before any check was run.
  if (review) {
    if (followupKind(review.text) !== 'review') add(doc.fieldLine.Review, 'link', 'followLinkKind', { path: doc.fields.Review, what: 'a script review' });
    else {
      const r = readFollowup(review.text, 'review');
      if (r.fields['Script approved for use'] !== shapes.review.approved) add(doc.fieldLine.Review, 'review', 'notApproved');
      if (script && r.fields.Script && resolve(review.dir, r.fields.Script) !== script.path) add(doc.fieldLine.Review, 'review', 'reviewOther');
      const reviewed = r.fields['Reviewed on'];
      for (const e of checks) {
        const checked = e.fields['Checked by']?.match(DATE)?.[0];
        if (reviewed && checked && checked < reviewed) add(e.lines['Checked by'], 'review', 'reviewLater', { reviewed, checked });
      }
    }
  }

  // Every criterion in the story, exactly once: under a check's Covers, or under Not checked by hand.
  if (!story) return;
  const st = readStory(story.text);
  if (st.notReady) { add(doc.fieldLine.Story, 'link', 'storyNotReady'); return; }
  const covered = [
    ...checks.flatMap((e) => (e.fields.Covers ? refs(e.fields.Covers).map((n) => [n, e.lines.Covers]) : [])),
    ...(doc.sections.others?.items ?? []).flatMap((i) => refs(i.line.split(':')[0]).map((n) => [n, i.n])),
  ];
  const total = st.criteria.length;
  const at = new Map();
  for (const [n, line] of covered) {
    if (n < 1 || n > total) add(line, 'coverage-unknown', 'coverageUnknown', { n, count: total });
    else if (at.has(n)) add(line, 'coverage-duplicate', 'coverageDuplicate', { n });
    else at.set(n, line);
  }
  for (let n = 1; n <= total; n++) if (!at.has(n)) add(doc.sections.others?.line ?? doc.titleLine, 'coverage-missing', 'coverageMissing', { n });
}

function checkLesson(doc, dir, add) {
  const spec = shapes.lesson;
  const results = doc.fields.Results?.match(re(field(spec, 'Results').pattern));
  const linkedResults = results && linked(doc, 'Results', dir, add, results[1]);
  if (linkedResults && followupKind(linkedResults.text) !== 'results') {
    add(doc.fieldLine.Results, 'link', 'followLinkKind', { path: results[1], what: 'hand check results' });
  } else if (linkedResults) {
    // The check the tester said did not match, with its title, Covers line and what the tester saw, word for word.
    const n = Number(results[2]);
    const e = readFollowup(linkedResults.text, 'results').sections.checks?.entries.find((x) => x.number === n);
    if (!e) add(doc.fieldLine.Results, 'results', 'results', { n });
    else {
      const said = e.fields['Tester says']?.replace(/\.$/, '');
      if (said !== shapes.results.outcomes.find((o) => o.lesson).phrase) add(doc.fieldLine.Results, 'results', 'notDidNotMatch', { n, outcome: said ?? 'nothing' });
      if (e.title !== doc.title) add(doc.titleLine, 'results', 'resultsTitle', { n, title: e.title });
      if (doc.fields.Covers !== undefined && doc.fields.Covers !== e.fields.Covers) add(doc.fieldLine.Covers, 'results', 'resultsCovers', { n, covers: e.fields.Covers });
      if (doc.fields['Tester saw'] !== undefined && doc.fields['Tester saw'] !== e.fields.Saw) add(doc.fieldLine['Tester saw'], 'results', 'resultsSaw', { saw: e.fields.Saw });
    }
  }

  // The class a person picked, or else the one ISR proposed, says where the lesson goes.
  const proposed = doc.fields['Class proposed by ISR']?.match(re(withClasses(field(spec, 'Class proposed by ISR').pattern)))?.[1];
  const pickedLine = doc.fields['Class picked by a person'];
  const picked = pickedLine?.match(re(withClasses(field(spec, 'Class picked by a person').pattern)));
  const isPicked = Boolean(picked?.[1]);
  const name = isPicked ? picked[1] : proposed;
  const cls = spec.classes.find((c) => c.name === name);
  const dest = cls && spec.destinations[cls.goesTo];
  const goesTo = doc.fields['Lesson goes to'];
  if (dest && goesTo !== undefined && goesTo !== `${dest.words}.`) {
    add(doc.fieldLine['Lesson goes to'], 'goes-to', 'goesTo', { which: isPicked ? 'picked' : 'proposed', name, words: dest.words });
  }
  if (picked) {
    const type = doc.head.text[0].replace(/^Type: /, '');
    if (isPicked && type !== 'Recommendation') add(doc.head.line[0], 'type', 'typePicked');
    if (!isPicked && type !== 'Decision needed') add(doc.head.line[0], 'type', 'typeNotPicked');
    if (!isPicked && !re(spec.proposed, 'i').test(doc.head.text[1])) add(doc.head.line[1], 'proposal', 'bottomProposed');
  }

  const why = spec.sections.find((s) => s.key === 'why');
  const phrases = spec.sources.map((s) => s.phrase);
  for (const item of doc.sections.why?.items ?? []) {
    const source = item.line.match(re(why.item))?.[1];
    if (source && !phrases.includes(source)) add(item.n, 'reason-source', 'source', { phrases: quoted(phrases) });
  }

  const carry = doc.sections.carry;
  if (!carry) return;
  if (carry.fences.length !== 2 || !carry.block.some((b) => b.line.trim())) add(carry.line, 'block', 'block');
  else if (dest) (cls.goesTo === 'evalCase' ? checkCase : checkEntry)(carry.block.filter((b) => b.line.trim()), dest, add);
}

// One entry in the story tool's learned file: one sentence, then its fields, indented.
function checkEntry(block, dest, add) {
  const [first, ...rest] = block;
  const entry = first.line.match(re(dest.entry));
  if (!entry) { add(first.n, 'entry', 'entryFirst', { file: dest.words }); return; }
  if (!re(dest.sentenceEnd).test(entry[1]) || re(dest.secondSentence).test(entry[1])) add(first.n, 'entry', 'entrySentence');
  const names = Object.keys(dest.fields);
  const seen = new Set();
  for (const b of rest) {
    const f = b.line.match(re(dest.field));
    if (!f) { add(b.n, 'entry', 'entryFirst', { file: dest.words }); continue; }
    if (!names.includes(f[1])) { add(b.n, 'entry', 'entryField', { field: f[1], fields: names.join(', ') }); continue; }
    if (seen.has(f[1])) { add(b.n, 'entry', 'entryRepeated', { field: f[1] }); continue; }
    seen.add(f[1]);
    const value = f[2].match(re(dest.fields[f[1]]));
    if (!value || (f[1] === 'source' && !realDate(value[1]))) add(b.n, 'entry', 'entryFieldValue', { field: f[1], value: f[2], file: dest.words });
  }
  for (const r of dest.required) if (!seen.has(r)) add(first.n, 'entry', 'entryMissing', { field: r });
}

// One case for the build tool's eval cases: every field set, or marked as not known yet.
function checkCase(block, dest, add) {
  if (block[0].line !== dest.header) { add(block[0].n, 'case', 'caseHeader', { file: dest.words }); return; }
  const known = [...dest.required, ...dest.optional];
  const seen = new Set();
  let inString = false;
  const opensOrCloses = (line) => (line.match(/"""/g) ?? []).length % 2 === 1;
  for (const b of block.slice(1)) {
    if (inString) { if (opensOrCloses(b.line)) inString = false; continue; }
    const key = b.line.match(re(dest.key)) ?? b.line.match(re(dest.unknown));
    if (key) {
      if (!known.includes(key[1])) add(b.n, 'case', 'caseKey', { key: key[1], fields: known.join(', ') });
      else if (seen.has(key[1])) add(b.n, 'case', 'caseRepeated', { key: key[1] });
      seen.add(key[1]);
    }
    if (opensOrCloses(b.line)) inString = true;
  }
  for (const r of dest.required) if (!seen.has(r)) add(block[0].n, 'case', 'caseMissing', { key: r });
}

export function checkFollowup(text, { dir = '.' } = {}) {
  const kind = followupKind(text);
  const spec = shapes[kind];
  const problems = [];
  const add = (line, rule, key, vars = {}) => problems.push({
    line, rule, message: fill(spec.messages?.[key] ?? shape.messages[key] ?? key, { classes: classNames.join(', '), ...vars }),
  });
  const doc = readFollowup(text, kind, add);
  ({ review: checkReview, results: checkResults, lesson: checkLesson })[kind](doc, dir, add);
  return problems.sort((a, b) => a.line - b.line);
}
