// Runs ISR headless, through the loop in loop.js, and keeps what the run log needs.
//   node runner/run.js --story FILE [--record FILE_OR_TASK_FOLDER] [--out FOLDER] [--model MODEL] [--budget USD]
//     [--hide-risks-from-writer]
// --hide-risks-from-writer is an experiment to measure the Stop hook; see docs/headless-runs.md.
// Prints the checked script, or the script under "Failed the checker:" with the problems left. Exits 0 when the
// checker passed, 1 when it did not, and 2 on bad usage or a run that could not finish.
// Writes FOLDER/script.md, FOLDER/risks.json when there is a risk map, and FOLDER/run.json.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { listProblems, MAX_REWORK, runIsr } from './loop.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');

function files(path) {
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path).sort().map((f) => join(path, f)).filter((f) => statSync(f).isFile());
}

const fingerprint = (path) => {
  const buf = readFileSync(path);
  return { path, bytes: buf.length, sha256: createHash('sha256').update(buf).digest('hex') };
};

function skillCommit() {
  try {
    const head = execFileSync('git', ['-C', REPO, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
    const dirty = execFileSync('git', ['-C', REPO, 'status', '--porcelain', 'skill', 'runner'], { encoding: 'utf8' }).trim();
    return dirty ? `${head} with uncommitted changes` : head;
  } catch {
    return 'unknown';
  }
}

export async function main(args, { query, print = (text) => process.stdout.write(text), note = console.error } = {}) {
  const rest = args.filter((a) => a !== '--hide-risks-from-writer');
  const opts = { hideRisks: rest.length < args.length };
  for (let i = 0; i < rest.length; i += 2) {
    if (!['--story', '--record', '--out', '--model', '--budget'].includes(rest[i]) || !rest[i + 1]) opts.bad = true;
    else opts[rest[i].slice(2)] = rest[i + 1];
  }
  const budget = opts.budget === undefined ? undefined : Number(opts.budget);
  if (opts.bad || !opts.story || (budget !== undefined && !(Number.isFinite(budget) && budget > 0))) {
    note('Usage: node runner/run.js --story FILE [--record FILE_OR_TASK_FOLDER] [--out FOLDER] [--model MODEL] [--budget USD] [--hide-risks-from-writer]');
    return 2;
  }
  const out = opts.out ?? `isr-run-${new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '')}`;
  const started = new Date().toISOString();
  query ??= (await import('@anthropic-ai/claude-agent-sdk')).query;

  let run;
  try {
    run = await runIsr({ story: opts.story, record: opts.record ?? null, query, model: opts.model, budgetUsd: budget, hideRisks: opts.hideRisks });
  } catch (err) {
    note(`Not run: ${err.message}`);
    return 2;
  }
  const { script, problems, riskMap, blocked, criteriaCount, state } = run;
  mkdirSync(out, { recursive: true });
  if (script !== null) writeFileSync(join(out, 'script.md'), script);
  if (riskMap) writeFileSync(join(out, 'risks.json'), `${JSON.stringify(riskMap, null, 2)}\n`);
  const cost = [state.mapper.costUsd, state.writer.costUsd].filter((c) => typeof c === 'number');
  writeFileSync(join(out, 'run.json'), `${JSON.stringify({
    started, ended: new Date().toISOString(), skill: skillCommit(), node: process.versions.node,
    inputs: [opts.story, ...(opts.record ? files(opts.record) : [])].map(fingerprint),
    hideRisksFromWriter: opts.hideRisks,
    blocked: { criteria: blocked, of: criteriaCount },
    mapper: state.mapper, writer: state.writer,
    costUsd: cost.length ? Number(cost.reduce((a, b) => a + b, 0).toFixed(4)) : null,
    checkerRuns: state.checkerRuns, denied: state.denied, stops: state.stops, reworks: state.reworks, maxRework: MAX_REWORK,
    checker: { passed: problems.length === 0, problems: problems.map((p) => `${p.line}: ${p.message} [${p.rule}]`) },
  }, null, 2)}\n`);

  if (!problems.length) print(script);
  else print(`Failed the checker:\n${listProblems(problems)}\n\n${script ?? ''}`);
  note(`isr: ${problems.length ? 'failed the checker' : 'checked'}, ${state.reworks} sent back by the Stop hook, $${cost.reduce((a, b) => a + b, 0).toFixed(2)}, saved in ${out}`);
  return problems.length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = await main(process.argv.slice(2));
