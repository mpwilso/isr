# ISR

Status: Early. Tried on one real change, in one run, judged by the person who built it. No time saving has been shown.

ISR is a skill that runs in Claude Code. It reads a user story and a Parallax build record, and writes one acceptance script for a person to work through. It never passes or fails acceptance. The person does.

## The problem it addresses

When a change lands, whoever accepts it has to work out what the build already showed and what still needs a person. ISR reads the story and the build record and writes that down: what automated checks verified, what to check by hand, and what the business still has to confirm.

## What you give it and what you get

You give it:

- A story, in the shape Loupe writes. Its criteria can be under `## Acceptance criteria` or `## Requirements`; ISR reads both the same way.
- A Parallax task folder with `intent.md`, `plan.md` and `record.md`. Without a record, ISR still writes a script, and nothing counts as verified.

You get one script, always in the same shape. It starts with four lines:

- **Type:** Recommendation, or Decision needed.
- **Bottom line:** one sentence, with the counts.
- **Not looked at:** what ISR could not see, always including the build itself.
- **Next:** one action for the product owner.

Then these sections:

- **Already verified:** what a passing automated check in the record covers, and what checked it.
- **Check by hand:** what nothing checked, or checked only in part, ranked High, Medium or Low by risk. Each check has Risk, Needs, Steps (at most five), Expect and Covers.
- **Confirm:** questions for the business, each ending with where it came from.
- **Not covered:** only when needed, for a criterion that fits nowhere above, with the reason.

Every criterion in the story appears exactly once: under Already verified, Check by hand or Not covered. No list shows more than five items; the rest are named in one line, `Not shown (N): title; title`. When the story has a `First question:` line, that question is the first Confirm item.

If the story is too thin to build from, ISR writes a short not ready report instead of a script.

## How to use it

You need Claude Code and Node 22.18.0 or later. The checker uses Node and nothing else, and no network.

1. Clone this repo and copy the skill folder into your project:

   ```
   git clone https://github.com/mpwilso/isr.git
   mkdir -p YOUR_PROJECT/.claude/skills
   cp -r isr/skill YOUR_PROJECT/.claude/skills/isr
   ```

   Installing by copy was checked only as far as Claude Code listing the skill; the full run was last done with the skill folder symlinked, not copied.

2. Put the story and the task folder in the project, open Claude Code there, and ask in plain words. For example:

   ```
   Here is a story (story.md) and the build record (the record folder). What should the product owner check by hand?
   ```

   ISR writes the script in a temporary folder, runs its checker, and replies with the script. Ask it to save a copy if you want one in the project.

3. To check a script yourself, from the root of this repo:

   ```
   node skill/src/check.js script.md --story story.md --record record
   ```

   Leave out `--record` when there is no record. It prints one line per problem and exits 1, or prints `Checked with Node` and the version and exits 0.

## What it never does

- Pass or fail acceptance, or write any verdict, result or sign-off.
- Edit the story or the record. It writes its script to a temporary folder unless you ask for a copy.
- Write a hand check whose expected result the story does not define. It asks about it under Confirm instead.
- Give a duration for a hand check. It says what the check needs, like a test project, a real build or an engineer, and that the engineer should size it.
- Run tests, start an app, open a browser or touch any environment.

## An example

This is the script from the one real run. It does not pass today's checker: it was written by an earlier version, before the heading and effort changes (today's checker flags its "43 of 43", since the record says 1 test was skipped). Its first Confirm question rested on a reading the build's plan contradicts: the plan says the gate's ledger entry records the merge commit as tested, not the accepted commit.

The story's acceptance criteria, shortened, and numbered as the script uses them:

1. A task whose base is still the tip of master fast-forwards as it does today.
2. A task whose base has moved: Parallax merges master into the task, re-runs the pre-merge test gate, and lands it on the first click if the gate passes.
3. Merging master in hits a conflict: nothing is merged, and Parallax says so.
4. The gate fails after master is merged in: nothing is merged.
5. A task merged this way shows as merged afterward.

```text
Type: Recommendation
Bottom line: 4 verified, 1 to check by hand, 6 to confirm; the one thing that matters most is that the build's tests used a stand-in for the pre-merge test gate, so nobody has yet seen the real suite run on the merged code before a moved-base task lands.
Not looked at: The build itself, the Parallax code behind the gate and the merged check, which the blind checker also did not see or run, and the two minor risks the record admits: any merge error is reported as a conflict, and a refused final step can leave the task branch moved.
Next: Get Matt's answer to the first question, which commit is recorded as tested, before running the check by hand.

# Acceptance script: Let Accept and merge land a task whose base has moved

## Already verified (4)
- When the task's base is still the tip of master, Accept and merge fast-forwards as it does today. Verified by: the existing fast-forward tests, part of the 43 of 43 plan tests that passed. Criterion 1.
- When merging master into the task hits a conflict, nothing is merged, master and the task stay as they were, and Parallax answers with a conflict message. Verified by: the conflict tests, run directly and through the server. Criterion 3.
- When the gate fails after master is merged in, nothing is merged and master and the task stay as they were. Verified by: the gate failure test. Criterion 4.
- A task landed this way shows as merged, and a rebased or cherry-picked copy does not. Verified by: the moved-base landing test and the merged-rule guard test. Criterion 5.

## Check by hand (1)

### 1. A moved-base task lands on one click with the real gate
- Risk: High. Why: the tests checked the merge and the landing with a stand-in for the gate, and the blind checker could not confirm the real suite runs on the merged code, so untested code could reach master.
- Needs: an engineer, to set the pre-merge test gate to the whole suite and read the ledger; a project in a test environment with a task accepted and not yet merged.
- Steps:
  1. Add a commit to master that does not touch the task's files.
  2. Choose Accept and merge once.
  3. Watch what Parallax shows until the run ends.
  4. Ask the engineer which commit the gate ran on and what it reported.
- Expect: Parallax merges master into the task, the gate runs the whole suite, and the task lands on that first click with no second confirmation. What you see while it runs is not settled yet, see Confirm item 2. Which commit the gate tests is not settled yet, see Confirm item 1.
- Covers: criterion 2.

## Confirm (6)
- The gate tests the commit made by merging master into the task, but Parallax records the accepted commit as the one tested. Should it record the merge commit as the tested one? (First question; Questions before building; criterion 2; Unknown)
- What should the developer see while master is merged in and the gate runs? (criterion 2; Unknown; Questions before building)
- Does the whole suite the pre-merge gate runs include the task's saved tests? (Assumed; Questions before building)
- When the merge hits a conflict, what should Parallax show, and what should the developer do next? (criterion 3; Unknown; Questions before building)
- If the update or the gate fails, should Parallax keep the updated branch or discard it, and what should the task show? The build discards it. (criterion 4; Unknown; Questions before building)

Not shown (1): Should the Accept and merge button text and the product docs describe both paths, fast-forward and merging master in?
```

## Status and known limits

- **One real change.** ISR has been tried on one real change: the Parallax change that lets Accept and merge land a task whose base has moved, where before it only fast-forwarded. That was one real run, and the person who built ISR also judged it.
- **No time saving shown.** Nothing here measures time saved.
- **Claude Code only.** It has been tested in Claude Code and nowhere else.
- **Starting states.** It does not reliably describe a starting state the product can reach. After a fix for this, the starting-state check held in 1 of 3 regression runs on the same real inputs.
- **Duration.** It cannot know how long a hand check takes. In 3 of 3 regression runs it guessed minutes for a check that took about 70 minutes to attempt, so it now says what a check needs and gives no duration.
- **Reworded reply.** In 1 of 3 smoke runs on the invented example, the reply was reworded after the checker had passed the saved script, which broke a step rule.
- **Loupe bug stories.** They have neither `## Requirements` nor `## Acceptance criteria`, so ISR calls them not ready.

The regression runs reused the inputs that exposed these problems, so they show whether a fix held on those inputs, not that it generalizes.

## Related tools

- [Loupe](https://github.com/mpwilso/loupe) writes the story.
- [Parallax](https://github.com/mpwilso/parallax) runs the agents and keeps the record.

## What's here

- `skill/`: the skill, self-contained. `skill/spec/script-shape.json` holds the script's shape as data, and `skill/src/check.js` enforces it.
- `examples/pellwick/`: invented stories, build records, and the scripts ISR should write for them. Pellwick is an invented company.
- `scripts/test.sh`: every test.

## Development

```
scripts/test.sh
```

It checks the Node version, lints every file git knows about for dashes, double hyphens and angle-bracket placeholders, then runs every test in `tests/`. No test calls a model or the network. CI runs it on Node 22.18.0 and 24.21.0. Commit only when it passes, and run it with pipefail when you pipe its output.

Work happens on a branch: push it, wait for CI to pass, fast-forward master, push, then delete the branch locally and on GitHub. CLAUDE.md has the rest of the rules for agents working here.

MIT license: [LICENSE](LICENSE).
