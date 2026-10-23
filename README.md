<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/brand/lockup-dark.svg">
    <img src="docs/brand/lockup-light.svg" alt="ISR: a radar scope with three blips" height="72">
  </picture>
</p>

<p align="center"><b>Writes the acceptance script for an AI-built change: what the build proved, what a person still has to check, and what the business has to decide.</b></p>

The first four lines of a script from a real run, on Parallax task 40171b, which adds a hint to error cards when the sandbox can't start:[^example]

> Type: Recommendation
> 
> Bottom line: 1 verified, 3 to check by hand, 8 to confirm; the most important thing is that the build spots a sandbox start failure only by key words in the error text, and the automated reviewer found that any error mentioning "namespace" also gets the hint.
> 
> Not looked at: ISR did not see the build itself, the record says the automated reviewer did not run the tests or see how the web card reads the extra lines or how the card shape checks treat them, and nobody looked at what wording real sandbox start failures produce beyond the one example.
> 
> Next: Answer the first Confirm question on how a sandbox start failure should be recognized, then ask an engineer to size the three checks by hand.

The script was written under earlier rules; today's checker would ask for one more line under Not looked at, as the footnote says.[^example]

Not looked at names what no one has checked yet, so the reader knows where the script's evidence stops.

The full script, rendered: [examples/parallax-40171b/script.md](examples/parallax-40171b/script.md)

Where acceptance test generators write tests from a story, ISR starts from what the build already proved: it keeps hand checks to what no automated check verified, holds every script to one shape that a code checker enforces, and publishes its misses in the run log.

Status: A portfolio project, built to show how I design, test and judge an AI tool. Tried on 4 real changes across 19 runs, one of them with the story written before the build. Every run is summarized in the run log, including the misses.

ISR (Intelligence, Surveillance, and Reconnaissance) is one of six tools, and one of three that run in order. [Loupe](https://github.com/mpwilso/loupe) writes the story, [Parallax](https://github.com/mpwilso/parallax) builds it under a gated agent loop and keeps the record, and ISR tells the person accepting it what is left. Each runs on its own, and they have been run in that order on one change so far. The other three stand alone: [Polarizer](https://github.com/mpwilso/polarizer) holds an agent's risky MCP tool calls until a person approves them, [Mordecai](https://github.com/mpwilso/mordecai) judges whether a skill helps, and [Project Max-Q](https://github.com/mpwilso/Project-Max-Q) ranks job postings and checks resume claims. ISR is a skill that runs in Claude Code. It reads a user story and a Parallax build record, and writes one acceptance script for a person to work through. It never passes or fails acceptance. The person does.

## The problem it addresses

When a change lands, whoever accepts it has to work out what the build already showed and what still needs a person. ISR reads the story and the build record and writes that down: what automated checks verified, what to check by hand, and what the business still has to confirm.

## How I tested it

- Wrote predictions before runs and scored the script against them.
- Checked the script's claims against the commit that actually landed.
- Had four reader agents, each playing a different role, read one script without the story, and fixed the three things all four tripped on.
- Measured how much runs vary with the rules held fixed: four runs on the same inputs agreed on the Type, the first question, the questions shown and four of five criteria.
- Counted where it broke its own rules: with the rules held fixed, two of four runs counted the same criterion as verified although the plan names a risk against it. The checker could not enforce that rule, so I built a loop that can: a separate model links each of the build's risks to the criteria it bears on, and a Stop hook won't let the writer finish while a linked criterion sits under Already verified. The rule-breaking script from those runs fails it; the loop's first real run kept the rule without being sent back. One run, so it shows the loop works, not that it fixes the rate.
- Ran Loupe, Parallax and ISR in order on one real change, then checked by hand. The hand check found a regression that the build's 37 passing tests, its automated reviewer and ISR all missed; ISR's top risk pointed the check at it.
- Full detail, run by run: [docs/run-log.md](docs/run-log.md).

## What you give it and what you get

You give it a story in the shape Loupe writes, and a Parallax task folder with `intent.md`, `plan.md` and `record.md`. Without a record, ISR still writes a script, and nothing counts as verified.

You get one script, always in the same shape: four top lines (Type, Bottom line, Not looked at, Next), then Already verified, Check by hand ranked by risk, Confirm for the business, and Not covered when needed. Every criterion in the story appears exactly once, and no list shows more than five items. A story too thin to build from gets a short not ready report instead.

The shape, as data: [skill/spec/script-shape.json](skill/spec/script-shape.json). The template and the rules for each section: [skill/templates/acceptance-script.md](skill/templates/acceptance-script.md) and [skill/writing-rules.md](skill/writing-rules.md). How ISR reads the story and the record: [skill/reading.md](skill/reading.md).

## The example

The example at the top comes from task 40171b. Its story and record are in [examples/parallax-40171b/](examples/parallax-40171b/), and the original record is also public in the Parallax repo at [docs/tasks/40171b/](https://github.com/mpwilso/parallax/tree/master/docs/tasks/40171b).

The story's requirements, shortened, and numbered as the script uses them:

1. When the sandbox can't start, the error card adds a one or two line hint to run `parallax doctor`, under the real problem.
2. If the error mentions namespaces or bwrap, the hint also points to the user-namespace step in the WSL guide, which gets a findable heading.
3. An error that isn't a sandbox start failure gets no hint.
4. `parallax show` and the web card show the same hint, and the card's options, question and retry behavior stay as they are.
5. A test covers both cases: a namespace or bwrap error shows both pointers, and another sandbox start error shows only the `parallax doctor` line.

## How to use it

You need Claude Code and Node 22.18.0 or later. The checker uses Node and nothing else, and no network.

1. Install the skill as a plugin, in Claude Code:

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

   Each way has been checked as far as Claude Code listing the skill, the plugin from a local copy of this repo. `claude plugin validate` passes on the marketplace file and on the skill folder. The install from GitHub has not been tried.

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

4. To run it headless, with the loop that holds the writer to the checker, see [docs/headless-runs.md](docs/headless-runs.md):

   ```
   node runner/run.js --story story.md --record record --out run-1
   ```

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

- Checks by hand have been run on one change, e3108e. They found a regression, but not every check could be finished: one would have stopped at an earlier screen, and half of another had nothing real to test against.
- Tested in Claude Code only.
- Loupe bug reports have no criteria section, so ISR calls them not ready.
- The runner's mapper can keep most criteria out of Already verified when a plan names broad risks. On 40171b it blocked 4 of 5, and a review of each link found the blocking earned. It has not been judged on any other story.
- Not shown yet: use by a team, or a time saving. Those need real users.

The rest, run by run, is in [docs/run-log.md](docs/run-log.md).

## How it was built

I designed ISR and directed its build; Claude Code wrote most of the code. The run log shows the process: [docs/run-log.md](docs/run-log.md).

How to work on this repo, and what each folder holds: [CONTRIBUTING.md](CONTRIBUTING.md).

MIT license: [LICENSE](LICENSE).

[^example]: Written by the rules at commit 026a514. The only change since is a blank line after each of the four top lines, which the current shape requires. Only one criterion counts as verified, because ISR won't count a criterion when the record names a risk against it. Today's checker flags the script for not saying that only the plan's tests ran, the miss that led to that rule.
