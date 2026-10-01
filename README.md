# ISR

Writes the acceptance script for an AI-built change: what the build proved, what a person still has to check, and what the business has to decide.

Status: A portfolio project, built to show how I design, test and judge an AI tool. Tried on 3 real changes across 12 runs. Every result is in the run log, including the misses.

ISR is the third of three tools. [Loupe](https://github.com/mpwilso/loupe) writes the story, [Parallax](https://github.com/mpwilso/parallax) builds it under a gated agent loop and keeps the record, and ISR tells the person accepting it what is left. ISR is a skill that runs in Claude Code. It reads a user story and a Parallax build record, and writes one acceptance script for a person to work through. It never passes or fails acceptance. The person does.

## The problem it addresses

When a change lands, whoever accepts it has to work out what the build already showed and what still needs a person. ISR reads the story and the build record and writes that down: what automated checks verified, what to check by hand, and what the business still has to confirm.

## How I tested it

- Wrote predictions before runs and scored the script against them.
- Checked the script's claims against the commit that actually landed.
- Had four reader agents, each playing a different role, read one script without the story, and fixed the three things all four tripped on.
- Measured how much runs vary with the rules held fixed: three runs on the same inputs agreed on the Type, the first question, the questions shown and four of five criteria.
- Counted wrong items: two of the last five runs on the same inputs credited a claim to the wrong source. One led to a new rule; the other was logged and left, so the rules don't get fitted to one story.
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

This is the script from a run on a real Parallax change, task 40171b, which adds a hint to error cards when the sandbox can't start; it was written by the current rules, its story and record are in [examples/parallax-40171b/](examples/parallax-40171b/), and the original record is also public in the Parallax repo at [docs/tasks/40171b/](https://github.com/mpwilso/parallax/tree/master/docs/tasks/40171b).

The story's requirements, shortened, and numbered as the script uses them:

1. When the sandbox can't start, the error card adds a one or two line hint to run `parallax doctor`, under the real problem.
2. If the error mentions namespaces or bwrap, the hint also points to the user-namespace step in the WSL guide, which gets a findable heading.
3. An error that isn't a sandbox start failure gets no hint.
4. `parallax show` and the web card show the same hint, and the card's options, question and retry behavior stay as they are.
5. A test covers both cases: a namespace or bwrap error shows both pointers, and another sandbox start error shows only the `parallax doctor` line.

```text
Type: Recommendation
Bottom line: 1 verified, 3 to check by hand, 8 to confirm; the most important thing is that the build spots a sandbox start failure only by key words in the error text, and the automated reviewer found that any error mentioning "namespace" also gets the hint.
Not looked at: ISR did not see the build itself, the record says the automated reviewer did not run the tests or see how the web card reads the extra lines or how the card shape checks treat them, and nobody looked at what wording real sandbox start failures produce beyond the one example.
Next: Answer the first Confirm question on how a sandbox start failure should be recognized, then ask an engineer to size the three checks by hand.

# Acceptance script: Add a doctor hint to Parallax error cards when the sandbox won't start

## Already verified (1)
- Automated tests cover both cases: a namespace or bwrap error shows both pointers, and another sandbox start error shows only the parallax doctor line. Verified by: the build's automated tests, 42 of 42 passed. Criterion 5.

## Check by hand (3)

### 1. A real sandbox start failure shows the hint
- Risk: Medium. Why: the tests used a typed copy of the example error, so it is not known whether real sandbox start failures use wording the build recognizes.
- Needs: an engineer, and a test machine where the sandbox can't start because user namespaces are blocked, as the WSL guide describes for Ubuntu 24.04; the engineer should confirm how to set this up and size it before anyone commits to it.
- Steps:
  1. Ask the engineer to run a task on that machine so it stops because the sandbox won't start.
  2. Run parallax show for that task.
  3. Read the card's bottom line and the lines under the error.
  4. Follow the pointer to the WSL guide in the docs.
- Expect: the bottom line still leads with the real problem, and the card adds one or two lines: one says to run parallax doctor, and for a namespace or bwrap error one points to the user-namespace step, which has a heading you can find in the guide. The heading name and the exact wording are not settled yet; see the second and fourth Confirm items.
- Covers: criterion 1 (a sandbox start failure gets a one or two line doctor hint under the real problem) and criterion 2 (namespace or bwrap errors also point to a findable user-namespace step in the guide).

### 2. Other errors get no hint
- Risk: Medium. Why: a test showed one unrelated error gets no hint, but the automated reviewer found that any error mentioning "namespace", even from another tool, would get one.
- Needs: an engineer who can make a task stop on an error that is not a sandbox start failure; the engineer should confirm how and size it before anyone commits to it.
- Steps:
  1. Ask the engineer to make a task stop on an ordinary error unrelated to the sandbox.
  2. Run parallax show for that task and read the card.
  3. Ask the engineer to make a task stop on an unrelated error whose text mentions a namespace.
  4. Run parallax show for that task and read the card.
- Expect: both cards look as they do today, with no parallax doctor line and no pointer to the guide. If the second card shows a hint, see the fifth Confirm item.
- Covers: criterion 3 (errors that are not sandbox start failures get no hint).

### 3. The web card matches and the card's behavior is unchanged
- Risk: Low. Why: a browser test checked that the hint appears in the web card, but nobody looked at how the web view lays out the extra lines, and the automated reviewer could not confirm how it reads them.
- Needs: the task from check 1, stopped because the sandbox won't start, and access to the web view.
- Steps:
  1. Run parallax show for the task and note the hint lines.
  2. Open the same task's card in the web view.
  3. Compare the hint, question, options and default option with parallax show and with a card from before this change.
  4. Retry the task so the same error repeats.
- Expect: the web card shows the same hint as parallax show, laid out cleanly; the question, options and default option are the same as today; and the task is dropped after the repeated error, as it is today. Whether the web card needed its own change is not settled yet; see the third Confirm item.
- Covers: criterion 4 (parallax show and the web card show the same hint, and the card's options, question and retry behavior stay as they are).

## Confirm (8, 5 shown)
- The build treats an error as a sandbox start failure when its text contains "sandbox runtime", "srt:", "bwrap" or "namespace", so a failure worded any other way gets no hint; is that the right way to recognize it? (the story asks this first; the build decided this)
- The build named the new heading in the WSL guide "Allow user namespaces"; is that the name you want? (criterion 2 leaves this open; the build decided this)
- The build relies on the web card picking up the hint from the parallax show text and made no change to the web view itself; is that right, or does the web card need its own change? (criterion 4 leaves this open; the build decided this)
- The build's hint reads "Run parallax doctor to find the cause." and, for namespace or bwrap errors, "For the user-namespace step, see "Allow user namespaces" in docs/wsl.md."; is that the wording you want? (asked in the story; the build decided this)
- The automated reviewer suggested matching only "user namespace" or "create new namespace" so unrelated errors that mention a namespace get no hint; should the match be tightened before release? (raised in the build record)

Not shown (3): links that pointed at the old user-namespace step in the guide; whether tasks that stopped before this change show the hint; whether the error text alone is enough to spot a sandbox failure without changing what is logged
```

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

## What's here

- `skill/`: the skill, self-contained. `skill/spec/script-shape.json` holds the script's shape as data, and `skill/src/check.js` enforces it.
- `examples/parallax-40171b/`: the README example's story, record and script, copied byte for byte from a real run; a test runs the checker on them.
- `examples/pellwick/`: invented stories, build records, and the scripts ISR should write for them. Pellwick is an invented company.
- `scripts/test.sh`: every test.

## Development

```
scripts/test.sh
```

It checks the Node version, lints every file git knows about for dashes, double hyphens and angle-bracket placeholders, then runs every test in `tests/`. No test calls a model or the network. CI runs it on Node 22.18.0 and 24.21.0. Commit only when it passes, and run it with pipefail when you pipe its output.

Work happens on a branch: push it, wait for CI to pass, fast-forward master, push, then delete the branch locally and on GitHub. CLAUDE.md has the rest of the rules for agents working here.

MIT license: [LICENSE](LICENSE).
