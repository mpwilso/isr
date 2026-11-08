# Changelog

Each release is on GitHub with its full notes: [releases](https://github.com/mpwilso/isr/releases).

## [v0.4.0](https://github.com/mpwilso/isr/releases/tag/v0.4.0), 2026-11-07

- With a Polarizer ledger from the run, the script ends with a new section, Tool calls in the ledger: each tool the build's agents called through Polarizer, how many calls ran, how many were held, denied or refused, and the paths and hosts the ledger names in its holds, so the person accepting the change knows where to look. `node skill/src/ledger.js LEDGER` prints it, and `node skill/src/check.js SCRIPT --ledger LEDGER` checks it word for word; without `--ledger`, a script can't have it. ISR verifies the chain first, with its own code, by version 1 of Polarizer's docs/LEDGER-SPEC.md, and a ledger that does not verify names nothing and says why. It reads the ledger rather than `polarizer export --ocsf`, because the export leaves out hold reasons, where the ledger names paths and hosts. The shape file gains the section, its fixed wording and two Not looked at rules. Tested on Polarizer's conformance ledgers, copied at Polarizer commit 700498a, and on invented ledgers; no real run has been read. 218 tests, no model calls.

## [v0.3.0](https://github.com/mpwilso/isr/releases/tag/v0.3.0), 2026-11-07

- Steps 5 to 7 of docs/direction.md are built, with invented examples and no live runs yet. After the script, ISR keeps three files beside it, each with its shape in `skill/spec/` (`review-shape.json`, `results-shape.json`, `lesson-shape.json`), a template and the same checker, `node skill/src/check.js FILE`. A review records who reviewed the script, when, what they changed and whether they approved it for use; the script's own shape is unchanged. Results record what each tester did and saw, with evidence links or file paths, traced to every criterion in the story; they need a review that approved the script, dated on or before each check, and ISR never decides pass or fail. A lesson, for a check the tester said did not match, proposes a build mistake, a requirements gap or a wrong assumption with its reasons, and holds one entry for Parallax's eval cases or Loupe's learned file, for the person to carry over by hand. 28 new tests, no model calls.
- The README's CI badge is centered, like the other tools' READMEs. The docs lint now allows the `a` tag, with the owner's approval, so the badge's link passes; `tests/lint-docs.test.js` checks that a link passes and a bare placeholder still fails.
- Also: the README says again that every run is summarized in the run log. 149 tests, no model calls.

## [v0.2.2](https://github.com/mpwilso/isr/releases/tag/v0.2.2), 2026-11-06

- README cut to about half. The top now reads lockup, CI badge, tagline, what ISR is, status, then the example. The six-tool paragraph moved to The other tools, the example's requirements to [examples/parallax-40171b/README.md](examples/parallax-40171b/README.md), and the full list of limits to [docs/limits.md](docs/limits.md). A new test, `tests/readme.test.js`, holds the README to its rules: under 155 shown lines, no dashes, links that resolve, no bare placeholders, no overclaiming words.
- The `/ship` skill stops at the pushed branch and its CI run; the owner merges. docs/direction.md says which milestones are built.
- README in plainer words, after a review by a reader who is not technical: the tagline says sign-off checklist, the name ISR is spelled out at the top, Parallax's record is explained, and headless, namespace and Stop hook are defined where they appear. Task and commit ids moved out of the prose into the linked docs. The run where a person's check by hand found what the change broke, which the tests, the automated reviewer and ISR all missed, now sits under the status line. The run count is 20 on 4 real changes, as the run log lists them; the old 19 left out a run that was denied its files.
- CI: each master commit gets its own concurrency group. Keyed by branch, a newer merge cancelled the run still waiting on the one before it.
- Also: `skill/.claude-plugin/plugin.json`, so `claude plugin validate --strict` passes on the skill folder; the runner copies a story given as a link from where it points; CI installs the runner's SDK from its lock file and imports it, weekly as well as on each push; four npm audit advisories fixed in the runner's lock file; Dependabot updates to the Agent SDK (0.3.310) and two actions. 121 tests, no model calls.

## [v0.2.1](https://github.com/mpwilso/isr/releases/tag/v0.2.1), 2026-10-11

- ISR installs as a Claude Code plugin: `/plugin marketplace add mpwilso/isr`, then `/plugin install isr@isr`. The plugin holds the skill folder (about 84 KB), not the runner.
- SECURITY.md added, contributing moved to CONTRIBUTING.md, the README starts with the example, and docs/headless-runs.md says what `npm ci` downloads. 112 tests, no model calls.

## [v0.2.0](https://github.com/mpwilso/isr/releases/tag/v0.2.0), 2026-10-11

- A headless runner: `runner/` runs the skill with the Claude Agent SDK, maps the build's named risks to the story's criteria with a separate model call, and holds the writer to the checker with a Stop hook. `scripts/variance.sh` runs it several times and lines the scripts up.
- Four fixes in the runner's gate: a checker path outside the run's folder, a record folder that is itself a link, a repeated mapper answer, and the run's own folder left behind. 111 tests, no model calls.

## [v0.1.0](https://github.com/mpwilso/isr/releases/tag/v0.1.0), 2026-10-02

- Initial public version: a Claude Code skill that reads a user story and a Parallax build record and writes one acceptance script, with a code checker for its shape. It never passes or fails acceptance.
