<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/brand/lockup-dark.svg">
    <img src="docs/brand/lockup-light.svg" alt="ISR: a radar scope with three blips" height="72">
  </picture>
</p>

[![CI](https://github.com/mpwilso/isr/actions/workflows/ci.yml/badge.svg)](https://github.com/mpwilso/isr/actions/workflows/ci.yml)

<p align="center"><b>Writes the sign-off checklist for an AI-built change: what the build proved, what a person still has to check, and what the business has to decide.</b></p>

ISR, short for intelligence, surveillance and reconnaissance, scouts a change before people accept it. It is a Claude Code skill. Give it a user story and the record that Parallax, the AI build tool, keeps of what it built and tested, and it writes an acceptance script: the checklist the person signing off works through. It never passes or fails anything; the person does.

Status: a portfolio project, built to show how I design, test and judge an AI tool. Tried 20 times on 4 real changes. In one, the story was written before the build started, as intended. Every run is summarized in [the run log](docs/run-log.md), including the misses.

In that one, a person checking by hand found that the change broke something that used to work. The build's 37 passing tests, its automated reviewer and ISR all missed it, but ISR's top risk pointed the check there: [that run](docs/run-log.md#the-first-story-first-run-on-a-real-parallax-change-e3108e-2026-10-05).

The four top lines of a script from a real run, on a Parallax change that adds a hint to error cards when the sandbox can't start (Linux reports that with errors about "namespaces", a feature the sandbox needs). The line "Not looked at" lists what no one has checked yet, so the reader knows where the script's evidence stops.[^example]

> Type: Recommendation
> 
> Bottom line: 1 verified, 3 to check by hand, 8 to confirm; the most important thing is that the build spots a sandbox start failure only by key words in the error text, and the automated reviewer found that any error mentioning "namespace" also gets the hint.
> 
> Not looked at: ISR did not see the build itself, the record says the automated reviewer did not run the tests or see how the web card reads the extra lines or how the card shape checks treat them, and nobody looked at what wording real sandbox start failures produce beyond the one example.
> 
> Next: Answer the first Confirm question on how a sandbox start failure should be recognized, then ask an engineer to size the three checks by hand.

The full script, rendered: [script.md](examples/parallax-40171b/script.md). Its story, its record and the requirements as the script numbers them: [the example's folder](examples/parallax-40171b/).

## What it does

ISR takes a story in the shape Loupe writes, and a Parallax task folder with `intent.md`, `plan.md` and `record.md`. Without a record, ISR still writes a script, and nothing counts as verified.

Where acceptance test generators write tests from a story, ISR starts from what the build already proved: it keeps hand checks to what no automated check verified, holds every script to one shape that a code checker enforces, and publishes its misses in the run log.

You get one script, always in the same shape: four top lines (Type, Bottom line, Not looked at, Next), then Already verified, Check by hand ranked by risk, Confirm for the business, and Not covered when needed. Every criterion in the story appears exactly once, and no list shows more than five items. A story too thin to build from gets a short not ready report instead.

The shape, as data: [skill/spec/script-shape.json](skill/spec/script-shape.json). The template and the rules for each section: [skill/templates/acceptance-script.md](skill/templates/acceptance-script.md) and [skill/writing-rules.md](skill/writing-rules.md). How ISR reads the story and the record: [skill/reading.md](skill/reading.md).

## What it must not do

The checker blocks any pass/fail field or checkbox. The skill is also told not to do the following, which the checker can't catch:

- Pass or fail acceptance.
- Edit the story or the record. It writes its script to a temporary folder unless you ask for a copy.
- Write a hand check whose expected result the story does not define. It asks about it under Confirm instead.
- Give a duration for a hand check; instead it says what the check needs and that the engineer should size it.
- Run tests, start an app, open a browser or touch any environment.

## Try it

You need Claude Code and Node 22.18.0 or later. The checker uses Node and nothing else, and no network.

Install the skill as a plugin, in Claude Code:

```
/plugin marketplace add mpwilso/isr
/plugin install isr@isr
```

Or clone this repo and copy the skill folder into your project:

```
git clone https://github.com/mpwilso/isr.git
mkdir -p YOUR_PROJECT/.claude/skills
cp -r isr/skill YOUR_PROJECT/.claude/skills/isr
```

Both install methods were tried from a local copy of this repo, as far as Claude Code listing the skill. Installing straight from GitHub hasn't been tried yet.

Put the story and the task folder in the project, open Claude Code there, and ask in plain words:

```
Here is a story (story.md) and the build record (the record folder). What should the product owner check by hand?
```

ISR writes the script in a temporary folder, runs its checker, and replies with the script. Ask it to save a copy if you want one in the project.

To check a script yourself, from the root of this repo:

```
node skill/src/check.js script.md --story story.md --record record
```

Leave out `--record` when there is no record. It prints one line per problem and exits 1, or prints `Checked with Node` and the version and exits 0. On bad usage, or a file it cannot read, it exits 2.

To run it from a script with no one at the keyboard (a headless run), and a loop that sends the writer back until the checker passes, see [docs/headless-runs.md](docs/headless-runs.md).

## What was measured

- Predictions were written before runs and the script scored against them, and the script's claims were checked against the commit that landed: [the sandbox hint run](docs/run-log.md#after-the-fact-run-on-an-older-parallax-task-40171b-2026-10-01).
- Four reader agents, each playing a different role, read one script without the story, and the three things all four tripped on were fixed: [plain words for readers](docs/run-log.md#plain-words-for-readers-and-two-regressions-on-the-40171b-inputs-2026-10-01).
- With the rules held fixed, four runs on the same inputs agreed on the Type, the opening question, the questions shown and four of five criteria: [three runs](docs/run-log.md#three-runs-with-the-rules-held-fixed-on-the-40171b-inputs-2026-10-01) and [a fourth](docs/run-log.md#a-fourth-run-with-fixed-rules-and-the-blank-line-shape-on-the-40171b-inputs-2026-10-01).
- In those runs, 2 of 4 counted a criterion as verified although the build's plan named a risk against it, and the checker could not catch that. So a separate model call now links each of the build's risks to the criteria it bears on. A Stop hook, a check that runs when the writer tries to finish, sends the writer back while a linked criterion sits under Already verified. The rest is in [the run log](docs/run-log.md#the-runner-a-loop-that-holds-the-writer-to-the-checker-on-the-40171b-inputs-2026-10-05).
- Loupe, Parallax and ISR ran in order on one real change, and a person then checked it by hand: [that run](docs/run-log.md#the-first-story-first-run-on-a-real-parallax-change-e3108e-2026-10-05).

Full detail, run by run: [docs/run-log.md](docs/run-log.md).

## Limits

- Checks by hand have been run on one change, the one with the story written before the build. They found what the change broke, but not every check could be finished: one would have stopped at an earlier screen, and half of another had nothing real to test against.
- Tested in Claude Code, nowhere else.
- Not shown yet: use by a team, or a time saving. Those need real users.

The full list: [docs/limits.md](docs/limits.md).

## How it was built

I designed ISR and directed its build; Claude Code wrote most of the code. The run log shows the process: [docs/run-log.md](docs/run-log.md). How to work on this repo, and what each folder holds: [CONTRIBUTING.md](CONTRIBUTING.md).

## The other tools

This is one of six tools. Three run in order: [Loupe](https://github.com/mpwilso/loupe) writes the story, [Parallax](https://github.com/mpwilso/parallax) builds it in a sandbox and keeps the record, and ISR tells the person accepting it what is left to check. Three stand alone: [Polarizer](https://github.com/mpwilso/polarizer) holds an agent's risky tool calls until a person approves them, [Mordecai](https://github.com/mpwilso/mordecai) judges whether a Claude skill helps, and [Max Q](https://github.com/mpwilso/Project-Max-Q) ranks job postings against a profile. Each runs on its own. The three were run in order once, on one change: [ISR's run log](https://github.com/mpwilso/isr/blob/master/docs/run-log.md).

## License

[MIT](LICENSE).

[^example]: Written under an earlier version of ISR's rules. One thing changed since: the shape now puts a blank line after each top line, and the script has them. One criterion counts as verified. ISR won't count a criterion as verified when the record names a risk against it. Today's checker flags one miss: the script doesn't say that the tests that ran were just the plan's own. That miss is why the checker now asks for it.
