# Contributing

ISR is a personal project. To report a security problem, see [SECURITY.md](SECURITY.md).

## What's here

- `skill/`: the skill, self-contained. `skill/spec/script-shape.json` holds the script's shape as data, and `skill/src/check.js` enforces it.
- `runner/`: runs the skill headless with the Claude Agent SDK, in a loop that code controls. It needs `npm ci` in that folder; the skill doesn't.
- `examples/parallax-40171b/`: the README example's story, record and script, copied byte for byte from a real run, except the blank lines added between the script's four top lines, with a README that lists the story's requirements; a test runs the checker on them.
- `examples/pellwick/`: invented stories, build records, and the scripts ISR should write for them. Pellwick is an invented company.
- `docs/brand/`: the logo. The scope's three blips are the script's three kinds of item: a solid dot for verified, a ring for check by hand, a dashed ring for confirm.
- `scripts/test.sh`: every test.
- `.claude-plugin/marketplace.json`: lists the skill as a Claude Code plugin whose source is `skill/`. `skill/.claude-plugin/plugin.json` names that plugin, with the same name and description as `skill/SKILL.md`; `claude plugin validate --strict` passes on both files.
- `.claude/skills/ship/`: a `/ship` command for working on this repo. It is not part of ISR, and installing ISR copies only `skill/`.

## Development

```
scripts/test.sh
```

It checks the Node version, lints every file git knows about for dashes, double hyphens and angle-bracket placeholders (the HTML tags p, picture, source, img and b are allowed), then runs every test in `tests/`. No test calls a model or the network. CI runs it on Node 22.18.0 and 24.21.0, and a second job runs `npm ci` in `runner/` and imports the SDK with no model call, weekly as well as on each push. Commit only when it passes, and run it with pipefail when you pipe its output. The script uses GNU `timeout`, so it runs on Linux and WSL2; elsewhere, run one file with `node --test tests/check.test.js`.

To compare scripts from several runs on the same inputs, run `node scripts/compare-runs.js run-1.md run-2.md run-3.md`. It shows each run's Type and counts, and the section each run put each criterion in, matched by criterion number. Confirm questions change wording between runs, so it compares only how many there are. For headless runs, [docs/headless-runs.md](docs/headless-runs.md) covers the runner and `scripts/variance.sh`, which runs it several times and compares the scripts. The `claude -p` flags that runs used before the runner are in [docs/run-log.md](docs/run-log.md#headless-runs-before-the-runner).

Work happens on a branch: push it, wait for CI to pass, and the maintainer merges it into master. CLAUDE.md has the rest of the rules for agents working here.
