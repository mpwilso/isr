<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/brand/lockup-dark.svg">
    <img src="docs/brand/lockup-light.svg" alt="ISR: a radar scope with three blips" height="72">
  </picture>
</p>

<p align="center"><b>Writes the acceptance script for an AI-built change: what the build proved, what a person still has to check, and what the business has to decide.</b></p>

Status: A portfolio project, built to show how I design, test and judge an AI tool. Tried on 3 real changes across 13 runs. Every result is in the run log, including the misses.

ISR (Intelligence, Surveillance, and Reconnaissance) is the third of three tools. [Loupe](https://github.com/mpwilso/loupe) writes the story, [Parallax](https://github.com/mpwilso/parallax) builds it under a gated agent loop and keeps the record, and ISR tells the person accepting it what is left. Each runs on its own, and they have not yet been run in that order on one change. ISR is a skill that runs in Claude Code. It reads a user story and a Parallax build record, and writes one acceptance script for a person to work through. It never passes or fails acceptance. The person does.

## The problem it addresses

When a change lands, whoever accepts it has to work out what the build already showed and what still needs a person. ISR reads the story and the build record and writes that down: what automated checks verified, what to check by hand, and what the business still has to confirm.

## How I tested it

- Wrote predictions before runs and scored the script against them.
- Checked the script's claims against the commit that actually landed.
- Had four reader agents, each playing a different role, read one script without the story, and fixed the three things all four tripped on.
- Measured how much runs vary with the rules held fixed: four runs on the same inputs agreed on the Type, the first question, the questions shown and four of five criteria.
- Counted where it broke its own rules: with the rules held fixed, two of four runs counted the same criterion as verified although the plan names a risk against it. That rule is now the weakest, and it is logged rather than patched, so the rules don't get fitted to one story.
- Full detail, run by run: [docs/run-log.md](docs/run-log.md).

## What you give it and what you get

You give it:

- A story, in the shape Loupe writes. Its criteria can be under `## Acceptance criteria` or `## Requirements`; ISR reads both the same way.
- A Parallax task folder with `intent.md`, `plan.md` and `record.md`. Without a record, ISR still writes a script, and nothing counts as verified.

You get one script, always in the same shape. It starts with four lines:

- **Type:** Recommendation, or Decision needed.
- **Bottom line:** one sentence, with the counts.
- **Not looked at:** what ISR could not see. In a script, that always includes the build itself. In the not ready report, it is any build record, since there are no acceptance criteria to check it against.
- **Next:** one action for the product owner.

Then these sections:

- **Already verified:** what a passing automated check in the record covers, and what checked it.
- **Check by hand:** what nothing checked, or checked only in part, ranked High, Medium or Low by risk. Each check has Risk, Needs, Steps (at most five), Expect and Covers, which names each criterion by number and in a few plain words.
- **Confirm:** questions for the business, each ending with where it came from in plain words, like "open in the story" or "the build decided this".
- **Not covered:** only when needed, for a criterion that fits nowhere above, with the reason.

Every criterion in the story appears exactly once: under Already verified, Check by hand or Not covered. No list shows more than five items; the rest are named in one line, `Not shown (N): title; title`, and the heading says how many are shown, like `Confirm (8, 5 shown)`. When the story has a `First question:` line, that question is the first Confirm item.

If the story is too thin to build from, ISR writes a short not ready report instead of a script.

## An example

This is the script from a run on a real Parallax change, task 40171b, which adds a hint to error cards when the sandbox can't start. It was written by the rules at commit 026a514. The only change since is a blank line after each of the four top lines, which the current shape requires. Its story and record are in [examples/parallax-40171b/](examples/parallax-40171b/), and the original record is also public in the Parallax repo at [docs/tasks/40171b/](https://github.com/mpwilso/parallax/tree/master/docs/tasks/40171b). Only one criterion counts as verified, because ISR won't count a criterion when the record names a risk against it.

The story's requirements, shortened, and numbered as the script uses them:

1. When the sandbox can't start, the error card adds a one or two line hint to run `parallax doctor`, under the real problem.
2. If the error mentions namespaces or bwrap, the hint also points to the user-namespace step in the WSL guide, which gets a findable heading.
3. An error that isn't a sandbox start failure gets no hint.
4. `parallax show` and the web card show the same hint, and the card's options, question and retry behavior stay as they are.
5. A test covers both cases: a namespace or bwrap error shows both pointers, and another sandbox start error shows only the `parallax doctor` line.

> Type: Recommendation
> 
> Bottom line: 1 verified, 3 to check by hand, 8 to confirm; the most important thing is that the build spots a sandbox start failure only by key words in the error text, and the automated reviewer found that any error mentioning "namespace" also gets the hint.
> 
> Not looked at: ISR did not see the build itself, the record says the automated reviewer did not run the tests or see how the web card reads the extra lines or how the card shape checks treat them, and nobody looked at what wording real sandbox start failures produce beyond the one example.
> 
> Next: Answer the first Confirm question on how a sandbox start failure should be recognized, then ask an engineer to size the three checks by hand.

The full script, rendered: [examples/parallax-40171b/script.md](examples/parallax-40171b/script.md)

## How to use it

You need Claude Code and Node 22.18.0 or later. The checker uses Node and nothing else, and no network.

1. Clone this repo and copy the skill folder into your project:

   ```
   git clone https://github.com/mpwilso/isr.git
   mkdir -p YOUR_PROJECT/.claude/skills
   cp -r isr/skill YOUR_PROJECT/.claude/skills/isr
   ```

   Installing by copy has been checked only as far as Claude Code listing the skill.

2. Put the story and the task folder in the project, open Claude Code there, and ask in plain words. For example:

   ```
   Here is a story (story.md) and the build record (the record folder). What should the product owner check by hand?
   ```

   ISR writes the script in a temporary folder, runs its checker, and replies with the script. Ask it to save a copy if you want one in the project. The checker is there because a model's output changes from run to run, so plain code checks the script's shape and hard rules instead of trusting the model to.

3. To check a script yourself, from the root of this repo:

   ```
   node skill/src/check.js script.md --story story.md --record record
   ```

   Leave out `--record` when there is no record. It prints one line per problem and exits 1, or prints `Checked with Node` and the version and exits 0. On bad usage, or a file it cannot read, it exits 2.

## What it must not do

The checker rejects a script that has:

- A verdict, result, status or sign-off field, or a checkbox, below the four top lines.

The skill is told not to do these, and the checker cannot catch them:

- Pass or fail acceptance.
- Edit the story or the record. It writes its script to a temporary folder unless you ask for a copy.
- Write a hand check whose expected result the story does not define. It asks about it under Confirm instead.
- Give a duration for a hand check; instead it says what the check needs and that the engineer should size it.
- Run tests, start an app, open a browser or touch any environment.

## Known limits

- No check by hand has been run to the end yet.
- Tested in Claude Code only.
- Loupe bug reports have no criteria section, so ISR calls them not ready.
- Not shown yet: use by a team, or a time saving. Those need real users.

The rest, run by run, is in [docs/run-log.md](docs/run-log.md).

## How it was built

I designed ISR and directed its build; Claude Code wrote most of the code. The run log shows the process: [docs/run-log.md](docs/run-log.md).

## What's here

- `skill/`: the skill, self-contained. `skill/spec/script-shape.json` holds the script's shape as data, and `skill/src/check.js` enforces it.
- `examples/parallax-40171b/`: the README example's story, record and script, copied byte for byte from a real run, except the blank lines added between the script's four top lines; a test runs the checker on them.
- `examples/pellwick/`: invented stories, build records, and the scripts ISR should write for them. Pellwick is an invented company.
- `docs/brand/`: the logo. The scope's three blips are the script's three kinds of item: a solid dot for verified, a ring for check by hand, a dashed ring for confirm.
- `scripts/test.sh`: every test.

## Development

```
scripts/test.sh
```

It checks the Node version, lints every file git knows about for dashes, double hyphens and angle-bracket placeholders (the HTML tags p, picture, source, img and b are allowed), then runs every test in `tests/`. No test calls a model or the network. CI runs it on Node 22.18.0 and 24.21.0. Commit only when it passes, and run it with pipefail when you pipe its output.

To compare scripts from several runs on the same inputs, run `node scripts/compare-runs.js run-1.md run-2.md run-3.md`. It shows each run's Type and counts, and the section each run put each criterion in, matched by criterion number. Confirm questions change wording between runs, so it compares only how many there are. For runs with `claude -p`, [docs/headless-runs.md](docs/headless-runs.md) has the permission flags.

Work happens on a branch: push it, wait for CI to pass, fast-forward master, push, then delete the branch locally and on GitHub. CLAUDE.md has the rest of the rules for agents working here.

MIT license: [LICENSE](LICENSE).
