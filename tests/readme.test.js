import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const readme = readFileSync('README.md', 'utf8');

// Built from code points, so this file stays free of the characters it bans.
const EM_DASH = String.fromCodePoint(0x2014);
const EN_DASH = String.fromCodePoint(0x2013);

// The README with code blocks, code spans, HTML comments and quoted lines taken out: what GitHub shows as the README's own prose and tags.
// A quote is copied output, like the example script's top lines, not the README's own claims.
const prose = (text) =>
  text
    .replace(/^```[\s\S]*?^```$/gm, '')
    .replace(/`[^`\n]*`/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^>.*$/gm, '');

const tags = new Set(['p', 'picture', 'source', 'img', 'b', 'details', 'summary', 'br', 'a', 'sub', 'sup']);

// GitHub's heading anchors: lower case, punctuation dropped, spaces as hyphens.
const slug = (heading) => heading.trim().toLowerCase().replace(/[^\w\- ]/g, '').replace(/ /g, '-');
// Headings outside code blocks and quotes; a quoted script's "##" lines are not the README's.
const headings = (text) => prose(text).split('\n').filter((line) => /^#{1,6} /.test(line)).map((line) => line.replace(/^#+ /, ''));

function problems(text, base = '.') {
  const found = [];
  // A collapsed block is there for anyone who opens it; the limit is on what a reader sees.
  const shownLines = text.replace(/<details>[\s\S]*?<\/details>/g, '<details></details>');
  const lines = shownLines.split('\n').length - (shownLines.endsWith('\n') ? 1 : 0);
  if (lines >= 155) found.push(`${lines} lines; keep it under 155`);
  if (text.includes(EM_DASH)) found.push('an em dash');
  if (text.includes(EN_DASH)) found.push('an en dash');
  const links = [...text.matchAll(/\]\(([^)\s]+)\)|\b(?:src|srcset|href)="([^"]+)"/g)].map((m) => m[1] ?? m[2]);
  for (const link of links) {
    if (link.startsWith('#')) {
      if (!headings(text).map(slug).includes(link.slice(1))) found.push(`an anchor with no heading: ${link}`);
      continue;
    }
    if (/^(https?:|mailto:)/.test(link)) continue;
    if (!existsSync(join(base, link.split(/[?#]/)[0]))) found.push(`a broken link: ${link}`);
  }
  const shown = prose(text);
  for (const [tag, name] of shown.matchAll(/<\/?([^\s>/]*)[^>]*>/g)) {
    if (!tags.has(name.toLowerCase())) found.push(`a bare angle-bracket placeholder: ${tag}`);
  }
  // Alt text is shown, so it is prose too; the rest of a tag is not, and nor is a link's address.
  const words = shown.replace(/<[^>]*>/g, (tag) => tag.match(/alt="([^"]*)"/)?.[1] ?? '').replace(/\]\([^)\s]+\)/g, ']');
  for (const [word] of words.matchAll(/\b(only|first|best)\b/gi)) found.push(`"${word}" in the prose`);
  return found;
}

test('the README passes every rule: short, no dashes, links that resolve, no hidden placeholders, no claims it cannot prove', () => {
  assert.deepEqual(problems(readme), []);
});

test('each README rule catches what it should', () => {
  assert.deepEqual(problems('line\n'.repeat(155)), ['155 lines; keep it under 155']);
  assert.deepEqual(problems(`<details>\n${'line\n'.repeat(155)}</details>\n`), []);
  assert.deepEqual(problems('## Setup\n\nJump to [setup](#setup) or [the end](#the-end).\n\n```\n## The end\n```\n'), ['an anchor with no heading: #the-end']);
  assert.deepEqual(problems(`A long pause${EM_DASH}then more.\n`), ['an em dash']);
  assert.deepEqual(problems(`Pages 3${EN_DASH}4.\n`), ['an en dash']);
  assert.deepEqual(problems('See [the notes](docs/nowhere.md) and <img src="brand/missing.svg">.\n'), [
    'a broken link: docs/nowhere.md',
    'a broken link: brand/missing.svg',
  ]);
  assert.deepEqual(problems('Show the draft under <the reason>.\n'), ['a bare angle-bracket placeholder: <the reason>']);
  assert.deepEqual(problems('Show the draft under `<the reason>`.\n\n```\n<folder>\n```\n'), []);
  assert.deepEqual(problems('The first tool, and the best.\n<img src="docs/brand/lockup-light.svg" alt="Our only mark">\n'), [
    '"first" in the prose',
    '"best" in the prose',
    '"only" in the prose',
  ]);
  assert.deepEqual(problems('```markdown\nFirst question: only the next box?\n```\n> Only the best.\n[the run](https://example.com/the-first-run)\n'), []);
});

test('the README opens with the lockup, the CI badge, the tagline, what ISR is, the status line and the example, in that order', () => {
  const top = readme.split('\n## ')[0];
  const order = [
    '<source media="(prefers-color-scheme: dark)" srcset="docs/brand/lockup-dark.svg">',
    '<img src="docs/brand/lockup-light.svg" alt="ISR: a radar scope with three blips" height="72">',
    '[![CI](https://github.com/mpwilso/isr/actions/workflows/ci.yml/badge.svg)](https://github.com/mpwilso/isr/actions/workflows/ci.yml)',
    '<p align="center"><b>Writes the acceptance script for an AI-built change',
    'ISR reads a user story and a Parallax build record and writes the acceptance script: what the build proved, what a person still has to check, and what the business has to decide.',
    'Status: a portfolio project, built to show how I design, test and judge an AI tool. ',
    '> Type: Recommendation',
  ];
  const at = order.map((part) => top.indexOf(part));
  order.forEach((part, i) => assert.ok(at[i] >= 0, `missing: ${part}`));
  assert.deepEqual(at, [...at].sort((a, b) => a - b));
});

test('the quoted top lines are the example script\'s, word for word', () => {
  const quote = readme.split('\n').filter((line) => line.startsWith('>')).map((line) => line.replace(/^> ?/, ''));
  const script = readFileSync('examples/parallax-40171b/script.md', 'utf8').split('\n');
  assert.equal(quote.length, 7, 'four top lines with a blank line after each but the last');
  assert.deepEqual(quote, script.slice(0, quote.length));
});
