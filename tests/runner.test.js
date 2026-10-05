import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gate, MAX_REWORK, runIsr, SCRIPT } from '../runner/loop.js';
import { extractRisks, mapPrompt, toRiskMap } from '../runner/risks.js';
import { main } from '../runner/run.js';

const read = (path) => readFileSync(path, 'utf8');
const EX = 'examples/parallax-40171b';
const inputs = { story: `${EX}/story.md`, record: `${EX}/record` };
// Written by hand for these tests, not by the mapper: which criteria each 40171b risk bears on.
const handMap = JSON.parse(read('tests/fixtures/named-risk/40171b.risks.json'));
const mapperReply = { links: handMap.risks.map((r, i) => ({ risk: i + 1, criteria: r.criteria, why: 'by hand' })) };
// Fixed-rules run 4 verified criterion 2 although the plan names a risk against it; the README example did not.
const bent = read('tests/fixtures/named-risk/run-4.script.md');
const kept = read(`${EX}/script.md`);

// A stand-in for the SDK's query(): the mapper replies with `reply`; the writer saves each script in `writes` in turn
// through the gate, and asks to stop after each one, as a real writer would.
function fakeQuery({ reply = mapperReply, writes }) {
  const calls = [];
  const query = ({ prompt, options }) => (async function* () {
    calls.push({ prompt, options });
    yield { type: 'system', subtype: 'init', model: 'fake-model' };
    if (options.outputFormat) {
      yield { type: 'result', subtype: 'success', structured_output: reply, total_cost_usd: 0.01, num_turns: 1, session_id: 'm' };
      return;
    }
    const pre = options.hooks.PreToolUse[0].hooks[0];
    const stop = options.hooks.Stop[0].hooks[0];
    for (let i = 0; ; i++) {
      const file_path = join(options.cwd, SCRIPT);
      const ruled = await pre({ tool_name: 'Write', tool_input: { file_path } });
      assert.equal(ruled.hookSpecificOutput.permissionDecision, 'allow');
      writeFileSync(file_path, writes[Math.min(i, writes.length - 1)]);
      const said = await stop({ hook_event_name: 'Stop', stop_hook_active: i > 0 });
      if (said.decision !== 'block') break;
      calls.push({ sentBack: said.reason });
    }
    yield { type: 'result', subtype: 'success', total_cost_usd: 0.5, num_turns: 9, session_id: 'w' };
  })();
  return { query, calls };
}

test('the risks come from the plan\'s Risks section and the record\'s Known risks, by code', () => {
  const risks = extractRisks(inputs.record);
  assert.deepEqual(risks.map((r) => r.from), ['plan', 'plan', 'plan', 'plan', 'record']);
  assert.match(risks[0].risk, /^Detection works on free text/);
  assert.match(risks[3].risk, /^Changing item 4 in `docs\/wsl\.md`/);
  assert.match(risks[4].risk, /bare "namespace"/);
  assert.doesNotMatch(risks[4].risk, /ledger/);
  const pellwick = extractRisks('examples/pellwick/skip-a-box.record');
  assert.ok(pellwick.some((r) => r.from === 'plan') && pellwick.some((r) => r.from === 'record'));
});

test('the mapper is blind: its prompt holds the criteria and the risks, not the record\'s results', () => {
  const prompt = mapPrompt(['1. one', '2. two'], extractRisks(inputs.record));
  assert.match(prompt, /^1\. one$/m);
  assert.match(prompt, /^5\. parallax\/decide\.py:163 nit: The trigger words/m);
  const data = prompt.slice(prompt.indexOf('Criteria:'));
  assert.doesNotMatch(data, /42 of 42|\bpass(?:ed)?\b|Second Eye|Found|Verified by/);
});

test('a mapper reply that skips a risk or names a criterion the story lacks is refused', () => {
  const risks = extractRisks(inputs.record);
  assert.throws(() => toRiskMap(risks, { links: mapperReply.links.slice(1) }, 5), /did not answer risk 1/);
  assert.throws(() => toRiskMap(risks, { links: [{ risk: 1, criteria: [6], why: '' }, ...mapperReply.links.slice(1)] }, 5), /criterion 6/);
  assert.deepEqual(toRiskMap(risks, mapperReply, 5).risks.map((r) => r.criteria), handMap.risks.map((r) => r.criteria));
});

test('the gate allows reads in the folder, writing the script, and the checker, and nothing else', () => {
  const work = '/tmp/isr-run-x';
  const rule = gate(work);
  const ok = (name, input) => rule(name, input).decision === 'allow';
  assert.ok(ok('Read', { file_path: `${work}/record/plan.md` }));
  assert.ok(ok('Read', { file_path: 'story.md' }));
  assert.ok(ok('Glob', { pattern: '*' }));
  assert.ok(ok('Write', { file_path: `${work}/${SCRIPT}` }));
  assert.ok(ok('Bash', { command: `node .claude/skills/isr/src/check.js ${SCRIPT} --story story.md --record record --risks risks.json` }));
  assert.ok(ok('Bash', { command: `node ${work}/.claude/skills/isr/src/check.js ${SCRIPT} --story story.md` }));
  assert.ok(!ok('Read', { file_path: '/home/someone/.ssh/id_rsa' }));
  assert.ok(!ok('Read', { file_path: `${work}/../other` }));
  assert.ok(!ok('Write', { file_path: `${work}/story.md` }));
  assert.ok(!ok('Write', { file_path: `${work}/risks.json` }));
  assert.ok(!ok('Edit', { file_path: `${work}/.claude/skills/isr/src/check.js` }));
  assert.ok(!ok('Bash', { command: 'mktemp -d' }));
  assert.ok(!ok('Bash', { command: `node .claude/skills/isr/src/check.js ${SCRIPT}; rm -rf ~` }));
  assert.ok(!ok('Bash', { command: 'node -e "process.exit(0)"' }));
  assert.ok(!ok('WebFetch', { url: 'https://example.com' }));
});

test('the Stop hook sends back a script that verifies a criterion with a named risk, and the fixed one comes out', async () => {
  const { query, calls } = fakeQuery({ writes: [bent, kept] });
  const run = await runIsr({ ...inputs, query });
  assert.deepEqual(run.problems, []);
  assert.equal(run.script, kept);
  assert.equal(run.state.reworks, 1);
  assert.deepEqual(run.state.stops.map((s) => s.problems), [['named-risk'], []]);
  const sentBack = calls.find((c) => c.sentBack).sentBack;
  assert.match(sentBack, /Criterion 2 is under Already verified, but the build's plan names a risk against it/);
  const writer = calls.find((c) => c.options.hooks);
  assert.match(writer.prompt, /--risks risks\.json/);
  assert.deepEqual(writer.options.skills, ['isr']);
  assert.ok(writer.options.maxBudgetUsd > 0);
  assert.deepEqual(JSON.parse(read(join(run.state.work, 'risks.json'))).risks.map((r) => r.criteria), handMap.risks.map((r) => r.criteria));
});

test(`the Stop hook gives up after ${MAX_REWORK} sends, and the problems left come out with the script`, async () => {
  const { query } = fakeQuery({ writes: [bent] });
  const run = await runIsr({ ...inputs, query });
  assert.equal(run.state.reworks, MAX_REWORK);
  assert.equal(run.state.stops.length, MAX_REWORK + 1);
  assert.deepEqual(run.problems.map((p) => p.rule), ['named-risk']);
});

test('with no record there is no mapper and no risk map', async () => {
  const story = 'examples/pellwick/skip-a-box.story.md';
  const { query, calls } = fakeQuery({ writes: [read('examples/pellwick/skip-a-box.no-record.script.md')] });
  const run = await runIsr({ story, query });
  assert.deepEqual(run.problems, []);
  assert.equal(calls.length, 1);
  assert.doesNotMatch(calls[0].prompt, /risks/);
  assert.equal(run.riskMap, null);
});

test('run.js saves the script, the risk map and a run record, and exits 0 when the checker passed', async () => {
  const out = mkdtempSync(join(tmpdir(), 'isr-out-'));
  try {
    const printed = [];
    const code = await main(['--story', inputs.story, '--record', inputs.record, '--out', out], { ...fakeQuery({ writes: [bent, kept] }), print: (t) => printed.push(t), note: () => {} });
    assert.equal(code, 0);
    assert.equal(printed.join(''), kept);
    assert.equal(read(join(out, 'script.md')), kept);
    const run = JSON.parse(read(join(out, 'run.json')));
    assert.equal(run.checker.passed, true);
    assert.equal(run.reworks, 1);
    assert.equal(run.costUsd, 0.51);
    assert.deepEqual(run.inputs.map((i) => i.path.split('/').pop()), ['story.md', 'intent.md', 'plan.md', 'record.md']);
    assert.match(run.inputs[0].sha256, /^[0-9a-f]{64}$/);
    assert.equal(run.writer.model, 'fake-model');
    assert.deepEqual(run.denied, []);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test('run.js labels a script that failed the checker, and exits 1', async () => {
  const out = mkdtempSync(join(tmpdir(), 'isr-out-'));
  try {
    const printed = [];
    const code = await main(['--story', inputs.story, '--record', inputs.record, '--out', out], { ...fakeQuery({ writes: [bent] }), print: (t) => printed.push(t), note: () => {} });
    assert.equal(code, 1);
    assert.match(printed.join(''), /^Failed the checker:\n.+\[named-risk\]\n\nType: /);
    assert.equal(JSON.parse(read(join(out, 'run.json'))).checker.passed, false);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test('run.js shows its usage and exits 2 without loading the SDK', () => {
  const r = spawnSync('node', ['runner/run.js'], { encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /^Usage: node runner\/run\.js --story FILE/);
});
