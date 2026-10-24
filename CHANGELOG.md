# Changelog

Each release is on GitHub with its full notes: [releases](https://github.com/mpwilso/isr/releases).

## Unreleased

- README cut to about half. The top now reads lockup, CI badge, tagline, what ISR is, status, then the example. The six-tool paragraph moved to The other tools, the example's requirements to [examples/parallax-40171b/README.md](examples/parallax-40171b/README.md), and the full list of limits to [docs/limits.md](docs/limits.md). A new test, `tests/readme.test.js`, holds the README to its rules: under 155 shown lines, no dashes, links that resolve, no bare placeholders, no overclaiming words.
- The `/ship` skill stops at the pushed branch and its CI run; the owner merges. docs/direction.md says which milestones are built.

## [v0.2.1](https://github.com/mpwilso/isr/releases/tag/v0.2.1), 2026-10-11

- ISR installs as a Claude Code plugin: `/plugin marketplace add mpwilso/isr`, then `/plugin install isr@isr`. The plugin holds the skill folder (about 84 KB), not the runner.
- SECURITY.md added, contributing moved to CONTRIBUTING.md, the README starts with the example, and docs/headless-runs.md says what `npm ci` downloads. 112 tests, no model calls.

## [v0.2.0](https://github.com/mpwilso/isr/releases/tag/v0.2.0), 2026-10-11

- A headless runner: `runner/` runs the skill with the Claude Agent SDK, maps the build's named risks to the story's criteria with a separate model call, and holds the writer to the checker with a Stop hook. `scripts/variance.sh` runs it several times and lines the scripts up.
- Four fixes in the runner's gate: a checker path outside the run's folder, a record folder that is itself a link, a repeated mapper answer, and the run's own folder left behind. 111 tests, no model calls.

## [v0.1.0](https://github.com/mpwilso/isr/releases/tag/v0.1.0), 2026-10-02

- Initial public version: a Claude Code skill that reads a user story and a Parallax build record and writes one acceptance script, with a code checker for its shape. It never passes or fails acceptance.
