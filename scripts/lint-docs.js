// Docs lint: node scripts/lint-docs.js [file ...]
// With no files, it reads every file git knows about, committed or not.
// It fails on dash characters, double hyphens used as dashes, and angle-bracket
// placeholders that GitHub would render as nothing.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Built from code points, so this file stays free of the characters it bans.
const DASHES = new Map([
  [0x2012, 'figure dash'],
  [0x2013, 'en dash'],
  [0x2014, 'em dash'],
  [0x2015, 'horizontal bar'],
].map(([code, name]) => [String.fromCodePoint(code), name]));

// Two hyphens between spaces, or between two letters. A flag has a letter right after, so it passes.
const DOUBLE_HYPHEN = /(^|\s)--(?=\s|$)|\w--\w/;
// "<id>" or "<path to file>". Comments, autolinks and the README logo's HTML tags (p, picture, source, img, b) are fine.
const PLACEHOLDER = /<(?!!--)(?!https?:|mailto:)(?!(?:p|picture|source|img|b)(?:\s[^<>\n]*)?>)[A-Za-z][^<>\n]*>/;
// Where prose hides in code files: whole-line and trailing comments.
const COMMENT = { js: /(?:^|\s)\/\/(.*)$|^\s*\*(.*)$/, sh: /(?:^|\s)#(.*)$/, yml: /(?:^|\s)#(.*)$/ };

function stripCodeSpans(line) {
  return line.replace(/(`+)[^`]*?\1/g, '');
}

export function lintText(path, text) {
  const problems = [];
  const ext = path.split('.').pop();
  const add = (line, message) => problems.push({ path, line, message });
  let fence = null;
  text.split('\n').forEach((raw, i) => {
    const n = i + 1;
    for (const [char, name] of DASHES) {
      if (raw.includes(char)) add(n, `remove the ${name}; use a comma, a colon or a new sentence`);
    }
    if (ext === 'md') {
      const marker = raw.match(/^\s*(```|~~~)/);
      if (marker) {
        if (!fence) fence = marker[1];
        else if (marker[1] === fence) fence = null;
        return;
      }
      if (fence) return;
      const prose = stripCodeSpans(raw);
      if (DOUBLE_HYPHEN.test(prose)) add(n, 'a double hyphen used as a dash; use a comma, a colon or a new sentence');
      if (PLACEHOLDER.test(prose)) add(n, 'an angle-bracket placeholder renders as nothing on GitHub; put it in a code span');
      return;
    }
    const comment = COMMENT[ext]?.exec(raw);
    const words = comment && (comment[1] ?? comment[2] ?? '');
    if (words && DOUBLE_HYPHEN.test(words)) add(n, 'a double hyphen used as a dash in a comment');
  });
  return problems;
}

function repoFiles() {
  const out = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' });
  return out.split('\0').filter(Boolean);
}

function main(args) {
  const files = args.length ? args : repoFiles();
  let problems = [];
  let checked = 0;
  for (const path of files) {
    let buf;
    try {
      buf = readFileSync(path);
    } catch {
      continue; // deleted but not yet staged
    }
    if (buf.includes(0)) continue; // binary
    checked++;
    problems = problems.concat(lintText(path, buf.toString('utf8')));
  }
  for (const p of problems) console.log(`${p.path}:${p.line}: ${p.message}`);
  console.log(`docs lint: ${checked} files, ${problems.length} problems`);
  process.exit(problems.length ? 1 : 0);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2));
