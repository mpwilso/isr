import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { shape } from '../skill/src/check.js';

const read = (path) => readFileSync(path, 'utf8');
const skill = read('skill/SKILL.md');

test('SKILL.md has a name and a description that says when to use it and what it does not do', () => {
  const front = skill.match(/^---\nname: (.+)\ndescription: (.+)\n---\n/);
  assert.ok(front, 'front matter with name and description');
  assert.equal(front[1], 'isr');
  const description = front[2];
  assert.ok(description.length <= 1024, `description is ${description.length} characters`);
  for (const words of ['what should I test by hand', 'help me accept this change', 'UAT steps', 'the build is done', 'does not run tests', 'pass acceptance']) {
    assert.ok(description.includes(words), words);
  }
});

test('SKILL.md stays under 500 lines and every file it points to exists', () => {
  assert.ok(skill.split('\n').length < 500);
  const paths = [...skill.matchAll(/`SKILL\/([^`\s]+)`/g)].map((m) => m[1]);
  assert.ok(paths.length >= 4);
  for (const path of paths) assert.ok(existsSync(`skill/${path}`), path);
});

test('the skill folder is self-contained: the checker imports only Node and its own folder', () => {
  const imports = [...read('skill/src/check.js').matchAll(/^import .+ from '([^']+)';$/gm)].map((m) => m[1]);
  for (const name of imports) assert.match(name, /^node:/);
  assert.equal(JSON.parse(read('skill/package.json')).type, 'module');
});

test('a copy of just the skill folder checks a script on its own', () => {
  const dir = mkdtempSync(join(tmpdir(), 'isr-skill-'));
  try {
    cpSync('skill', join(dir, 'isr'), { recursive: true });
    const ex = resolve('examples/pellwick');
    const out = execFileSync('node', ['isr/src/check.js', `${ex}/skip-a-box.script.md`, '--story', `${ex}/skip-a-box.story.md`, '--record', `${ex}/skip-a-box.record`], { cwd: dir, encoding: 'utf8' });
    assert.match(out, /^Checked with Node /);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the checker still runs when the skill folder is a symlink', () => {
  // Found in smoke run 1: through a symlinked skill folder the checker printed nothing and exited 0.
  const dir = mkdtempSync(join(tmpdir(), 'isr-link-'));
  try {
    symlinkSync(resolve('skill'), join(dir, 'isr'));
    const out = execFileSync('node', ['isr/src/check.js', resolve('tests/fixtures/good.script.md')], { cwd: dir, encoding: 'utf8' });
    assert.match(out, /^Checked with Node /);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the script template follows the shape file', () => {
  const lines = read('skill/templates/acceptance-script.md').split('\n');
  shape.top.forEach((top, i) => assert.ok(lines[i].startsWith(top.pattern.match(/^\^(.+?: )/)[1]), lines[i]));
  assert.ok(lines[5].startsWith(shape.script.title.slice(1, -3)));
  const headings = lines.filter((l) => l.startsWith('## ')).map((l) => l.replace(/^## (.+) \(\[N\]\)$/, '$1'));
  assert.deepEqual(headings, shape.script.sections.map((s) => s.heading));
  const labels = lines.filter((l) => /^- \w+:/.test(l)).map((l) => l.match(/^- (\w+):/)[1]);
  assert.deepEqual(labels.filter((l) => l !== 'Criterion'), shape.script.check.fields.map((f) => f.label));
});

test('the not ready template follows the shape file', () => {
  const lines = read('skill/templates/not-ready.md').split('\n');
  assert.ok(lines[5].startsWith(shape.notReady.title.slice(1, -3)));
  assert.ok(lines.includes(`## ${shape.notReady.section} ([N])`));
  assert.match(lines[3], new RegExp(shape.notReady.next));
});

test('every example script has its story', () => {
  const ex = readdirSync('examples/pellwick');
  for (const file of ex.filter((f) => f.endsWith('.script.md'))) {
    assert.ok(ex.includes(`${file.split('.')[0]}.story.md`), file);
  }
});
