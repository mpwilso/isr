import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getHeapStatistics } from 'node:v8';

const read = (path) => readFileSync(path, 'utf8');

const ci = read('.github/workflows/ci.yml');

test('the test job runs the Node versions scripts/test.sh names, and the runner job one of them', () => {
  const pinned = read('scripts/test.sh').match(/^NODE_VERSIONS="([^"]+)"/m)[1].split(' ');
  const matrices = [...ci.matchAll(/^\s+node: \[([^\]]+)\]/gm)].map((m) => m[1].split(',').map((v) => v.trim().replace(/'/g, '')));
  assert.equal(matrices.length, 2, 'the test job and the runner job');
  const [testMatrix, runnerMatrix] = matrices;
  assert.deepEqual(testMatrix, pinned);
  assert.equal(runnerMatrix.length, 1, 'the runner job runs one version: the SDK is a large download');
  assert.ok(pinned.includes(runnerMatrix[0]), runnerMatrix[0]);
});

test('every action in CI is pinned to a full commit SHA', () => {
  const uses = [...ci.matchAll(/uses: (\S+)/g)].map((m) => m[1]);
  assert.ok(uses.length > 0);
  for (const u of uses) assert.match(u, /@[0-9a-f]{40}$/, u);
});

test('CI reads only, every checkout drops its token, and every job skips a pull request from this repo', () => {
  assert.match(ci, /^permissions:\n  contents: read\n/m);
  const jobs = [...ci.split('\njobs:\n')[1].matchAll(/^  (\w+):\n/gm)].map((m) => m[1]);
  assert.deepEqual(jobs, ['test', 'runner']);
  const forkRule = "if: github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name != github.repository";
  assert.equal(ci.split(forkRule).length - 1, jobs.length);
  const checkouts = ci.match(/uses: actions\/checkout@/g).length;
  assert.equal(ci.match(/persist-credentials: false/g).length, checkouts);
});

test('CI installs the runner\'s dependency from its lock file and imports the SDK, weekly as well as on each push', () => {
  assert.match(ci, /^on:\n  push:\n[\s\S]*?^  pull_request:\n[\s\S]*?^  schedule:\n(?:\s+#.*\n)*\s+- cron: '\d+ \d+ \* \* \d'\n/m);
  const [sdk] = Object.keys(JSON.parse(read('runner/package.json')).dependencies);
  assert.match(ci, /^\s+- run: npm ci\n\s+working-directory: runner\n/m);
  assert.match(ci, new RegExp(`^\\s+- run: node --input-type=module -e "const m = await import\\('${sdk}'\\); if \\(typeof m\\.query !== 'function'\\) process\\.exit\\(1\\)"\\n\\s+working-directory: runner\\n`, 'm'));
});

test('the README stays under 200 lines', () => {
  assert.ok(read('README.md').split('\n').length < 200);
});

test('run from scripts/test.sh, every test process has the memory cap', { skip: !process.env.ISR_MEMORY_MB && 'not run from scripts/test.sh' }, () => {
  // The heap limit adds the young generation to the cap: 560 MB on Node 22.23 and 704 MB on Node 24.21 for a 512 MB cap.
  // Uncapped, it is several times larger.
  const limitMb = getHeapStatistics().heap_size_limit / 1024 / 1024;
  const capMb = Number(process.env.ISR_MEMORY_MB);
  assert.ok(limitMb < capMb * 1.5, `heap limit ${Math.round(limitMb)} MB, cap ${capMb} MB`);
});

test('the plugin marketplace lists the skill folder, and the skill there is named isr and runs as ESM', () => {
  // `claude plugin validate .` checks more, but CI has no Claude Code; this checks what an install depends on.
  const market = JSON.parse(read('.claude-plugin/marketplace.json'));
  assert.equal(market.name, 'isr');
  assert.ok(market.owner?.name, 'owner.name');
  assert.equal(market.plugins.length, 1);
  const [plugin] = market.plugins;
  assert.equal(plugin.name, 'isr');
  assert.equal(plugin.source, './skill');
  assert.equal(read('skill/SKILL.md').match(/^---\nname: (.+)\n/)[1], plugin.name);
  assert.equal(JSON.parse(read('skill/package.json')).type, 'module');
});
