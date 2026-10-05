// The ISR loop. A blind mapper links the risks the build names to the story's criteria; then the writer runs the
// skill, and a Stop hook runs the checker with that risk map and sends the writer back until the script passes,
// up to MAX_REWORK times. What comes out is the file the checker passed, never the writer's reply.
// `query` is passed in, so tests drive the loop with a fake writer and never call a model.
import { cpSync, existsSync, mkdtempSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, readRecord, readStory } from '../skill/src/check.js';
import { extractRisks, MAP_SCHEMA, mapPrompt, toRiskMap } from './risks.js';

export const MAX_REWORK = 3;
export const SCRIPT = 'acceptance-script.md';
const SKILL = join(dirname(fileURLToPath(import.meta.url)), '..', 'skill');
const CHECKER = '.claude/skills/isr/src/check.js';
const NO_MEMORY = { CLAUDE_CODE_DISABLE_AUTO_MEMORY: '1' };

// A fresh folder holding copies of the inputs and the skill, so the writer reads and writes nothing else.
export function prepare({ story, record }) {
  const work = realpathSync(mkdtempSync(join(tmpdir(), 'isr-run-')));
  cpSync(story, join(work, 'story.md'));
  if (record) cpSync(record, join(work, statSync(record).isDirectory() ? 'record' : 'record.md'), { recursive: true });
  cpSync(SKILL, join(work, '.claude', 'skills', 'isr'), { recursive: true });
  return work;
}

export function writerPrompt({ record, risks }) {
  const ask = record
    ? `Here is a story (story.md) and the build record (${statSync(record).isDirectory() ? 'the record folder' : 'record.md'}). What should the product owner check by hand?`
    : 'Here is a story (story.md). What should the product owner check by hand?';
  const lines = [ask, '', `This folder is already your temporary folder: save the script here as ${SCRIPT}.`];
  if (risks) lines.push('The risks the build names against criteria are in risks.json: pass `--risks risks.json` to the checker.');
  return lines.join('\n');
}

// Rules every tool call: reads inside the folder, writes only to the script, and the checker as the one command.
export function gate(work) {
  const inside = (p) => {
    const abs = resolve(work, p ?? '.');
    return abs === work || abs.startsWith(work + sep);
  };
  const escaped = work.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const checker = new RegExp(`^node (?:${escaped}/)?${CHECKER.replace(/\./g, '\\.')}(?: [\\w./ -]+)?$`);
  return (name, input) => {
    if (name === 'Skill') return allow;
    if (['Read', 'Glob', 'Grep'].includes(name)) return inside(input.file_path ?? input.path) ? allow : deny('Read only inside this folder.');
    if (['Write', 'Edit'].includes(name)) {
      return resolve(work, input.file_path ?? '') === join(work, SCRIPT) ? allow : deny(`Write only ${SCRIPT}, in this folder.`);
    }
    if (name === 'Bash') {
      if (checker.test(input.command.trim())) return allow;
      return deny(`The one command allowed here is the checker: node ${CHECKER} ${SCRIPT} --story story.md and its other flags. This folder is already your temporary folder.`);
    }
    return deny(`${name} is not used here.`);
  };
}
const allow = { decision: 'allow' };
const deny = (reason) => ({ decision: 'deny', reason });

// Every refusal, and every checker run the writer makes, goes in the run record.
const asHook = (rule, state) => async (input) => {
  const { decision, reason } = rule(input.tool_name, input.tool_input ?? {});
  if (decision === 'deny') state.denied.push({ tool: input.tool_name, input: JSON.stringify(input.tool_input ?? {}).slice(0, 200) });
  else if (input.tool_name === 'Bash') state.checkerRuns++;
  return { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: decision, permissionDecisionReason: reason } };
};

// The checker as the writer's runs see it, with the risk map when there is one.
export function checkScript(work, { story, record, riskMap }) {
  const path = join(work, SCRIPT);
  if (!existsSync(path)) return [{ line: 0, rule: 'missing', message: `${SCRIPT} was not saved in this folder.` }];
  return check(readFileSync(path, 'utf8'), { story, record, risks: riskMap?.risks ?? null });
}

const listProblems = (problems) => problems.map((p) => `${SCRIPT}:${p.line}: ${p.message} [${p.rule}]`).join('\n');

// The Stop hook: the writer can't finish while the checker reports a problem, until MAX_REWORK sends are used.
export function stopHook(work, inputs, state) {
  return async () => {
    const problems = checkScript(work, inputs);
    state.stops.push({ problems: problems.map((p) => p.rule) });
    if (!problems.length || state.reworks >= MAX_REWORK) return {};
    state.reworks++;
    return {
      decision: 'block',
      reason: `The checker still reports these problems. Fix every one in ${SCRIPT}, run the checker again, then reply.\n${listProblems(problems)}`,
    };
  };
}

async function drain(stream, state, key) {
  let result = null;
  for await (const message of stream) {
    if (message.type === 'system' && message.subtype === 'init') state[key].model = message.model;
    if (message.type === 'result') result = message;
  }
  if (!result) throw new Error(`the ${key} ended with no result`);
  Object.assign(state[key], { subtype: result.subtype, costUsd: result.total_cost_usd ?? null, turns: result.num_turns, sessionId: result.session_id });
  return result;
}

// hideRisks is an experiment, off by default: the writer is not told about the risk map, so only the Stop hook
// uses it. It exists to measure the Stop hook, and is not how ISR is meant to run.
export async function runIsr({ story: storyPath, record: recordPath = null, query, model, budgetUsd = 2, hideRisks = false }) {
  const story = readStory(readFileSync(storyPath, 'utf8'));
  const record = recordPath ? readRecord(recordPath) : null;
  const work = prepare({ story: storyPath, record: recordPath });
  const state = { work, mapper: {}, writer: {}, stops: [], reworks: 0, checkerRuns: 0, denied: [] };
  const env = { ...process.env, ...NO_MEMORY };

  // 1. The mapper: no tools, the criteria and the risks only, a structured reply.
  let riskMap = null;
  const risks = recordPath && !story.notReady ? extractRisks(recordPath) : [];
  if (risks.length) {
    const reply = await drain(query({
      prompt: mapPrompt(story.criteria, risks),
      options: { cwd: work, model, env, tools: [], settingSources: [], permissionMode: 'dontAsk', maxTurns: 3, outputFormat: { type: 'json_schema', schema: MAP_SCHEMA } },
    }), state, 'mapper');
    if (reply.subtype !== 'success') throw new Error(`the mapper stopped: ${reply.subtype}`);
    riskMap = toRiskMap(risks, reply.structured_output, story.criteria.length);
    if (!hideRisks) writeFileSync(join(work, 'risks.json'), `${JSON.stringify(riskMap, null, 2)}\n`);
  }

  // 2. The writer: the skill, gated tools, and the Stop hook that holds it to the checker.
  const inputs = { story, record, riskMap };
  const rule = gate(work);
  await drain(query({
    prompt: writerPrompt({ record: recordPath, risks: hideRisks ? null : riskMap }),
    options: {
      cwd: work, model, env,
      settingSources: ['project'], skills: ['isr'],
      tools: ['Skill', 'Read', 'Glob', 'Grep', 'Write', 'Edit', 'Bash'],
      hooks: { PreToolUse: [{ hooks: [asHook(rule, state)] }], Stop: [{ hooks: [stopHook(work, inputs, state)] }] },
      canUseTool: async () => ({ behavior: 'deny', message: 'Every call is ruled on by the gate; this one was not.' }),
      maxTurns: 60, maxBudgetUsd: budgetUsd,
    },
  }), state, 'writer');

  const problems = checkScript(work, inputs);
  const script = existsSync(join(work, SCRIPT)) ? readFileSync(join(work, SCRIPT), 'utf8') : null;
  // Over-blocking shows here: every criterion a risk names is kept out of Already verified.
  const blocked = [...new Set((riskMap?.risks ?? []).flatMap((r) => r.criteria))].sort((a, b) => a - b);
  return { script, problems, riskMap, blocked, criteriaCount: story.criteria.length, state };
}

export { listProblems };
