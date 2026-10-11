# Headless runs

## The runner

`runner/` runs ISR with the Claude Agent SDK, in a loop that code controls:

```
cd runner && npm ci && cd ..
node runner/run.js --story story.md --record record --out run-1
```

`npm ci` takes about 290 MB on Linux x64, most of it the Claude Agent SDK's native binary for the platform (235 MB). The skill alone needs none of it.

1. **Risks, by code.** It reads every risk the build names: the bullets under the plan's Risks, and the record's Known risks lines.
2. **The mapper.** A separate model call, with no tools, sees only the story's criteria and those risks, and says which criteria each risk bears on. It never sees the record's results or a script. The links go in `risks.json`.
3. **The writer.** The skill runs in a fresh folder holding copies of the story, the record and the skill. A PreToolUse hook rules on every tool call: reads inside the folder, writes only to the script, and the checker as the one command.
4. **The Stop hook.** When the writer tries to finish, code runs the checker with the risk map. If it reports a problem, the writer is sent back with the checker's lines, up to 3 times.

With a risk map, the checker fails a script that puts a criterion a risk names under Already verified. Before the runner, that rule was the one the checker could not enforce, and 2 of 4 fixed-rules runs broke it. The mapper can only make a script more careful: a link can keep a criterion out of Already verified, and nothing it says can put one in.

What comes out is the file the checker passed, not the writer's reply, so a reply reworded after the check can't slip through. The folder given with `--out` holds `script.md`, `risks.json` and `run.json`; the run's own folder is removed when the run ends. `run.json` records what the run log needs: the size and sha256 of each input, the skill commit, the model, the cost, the checker runs, every refused tool call, and what each Stop said. The exit code is 0 when the checker passed, 1 when it did not, and 2 when the run could not finish. A run that stops after a model call still writes `run.json`, with the error and what it cost. A record folder that holds a link is refused before any model call, since a read could follow the link out of the run's folder. `--budget` caps the writer's spend in dollars (default 2).

`--hide-risks-from-writer` is an experiment, off by default. With it, the writer is not told about the risk map and runs the checker without `--risks`; only the Stop hook uses the map. It exists to measure the Stop hook, since a writer that has the map can fix a bent script with its own checker runs before it ever stops, and it is not how ISR is meant to run.

`run.json` also records which criteria the risk map blocks from Already verified, and how many criteria the story has, so over-blocking shows in every run.

The tests drive the loop with a stand-in for the SDK, so no test calls a model.

## Several runs

```
scripts/variance.sh --story story.md --record record --runs 3
```

It runs the runner that many times on the same inputs, each into `run-N` in one folder (by default `isr-variance-` and the time, which git ignores), then lines the scripts up with `scripts/compare-runs.js`. It passes `--model`, `--budget` and `--hide-risks-from-writer` on to every run. Each run costs money, so it refuses more than 5 runs without `--more`.

## With claude -p

Before the runner, runs used `claude -p`. The flags they used are kept in the run log, under [Headless runs before the runner](run-log.md#headless-runs-before-the-runner).
