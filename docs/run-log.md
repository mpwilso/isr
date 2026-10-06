# Run log

This log was written from the builder's own notes after the runs; the raw outputs are not kept in this repo.

The advisor named in some entries is a separate Claude chat that reviewed each step, wrote predictions before runs, and judged the output alongside Matt.

Each entry names the note file it came from.

## Real run 1, 2026-10-01

- Run: ISR on one real change, the Parallax change that lets Accept and merge land a task whose base has moved.
- Input: the story for that change, and the record of Parallax task 786e71. That record says 43 plan tests passed and 1 was skipped, Second Eye, the blind checker, passed it, 7 files changed, and the build cost an estimated $2.63 of a $5.00 cap.
- Result: a script with 4 verified, 1 to check by hand and 6 to confirm. The builder judged it. An attempt at the hand check took about 70 minutes and $1.47 and did not get far enough to run it.
- README: this script was the README example until the README switched to the 40171b script in `examples/parallax-40171b/`.
- Notes: `real-run-1/run/record/record.md`, `real-run-1/run/script.md`, `real-run-1/after.txt`.

## Regression on the real-run inputs, 3 runs

- Run: ISR after the first fixes, three times, with the same request and inputs as real run 1.
- Result: four of six checks held in all three runs. The starting-state check held in 1 of 3. All three guessed minutes for the gate run in the hand check, against the about 70 minutes the real attempt took (`real-run-1/after.txt` line 13), so the effort was understated in 3 of 3. Cost: $0.54, $0.52 and $0.59.
- What this does not show: that the fixes hold on other inputs. These runs reused the inputs that exposed the problems, so they show only whether a fix held on those inputs.
- Notes: `report-m2.md`.

## Smoke runs on the invented example, 3 runs

- Run: ISR after the first fixes, three times, on the invented Pellwick skip-a-box story and record.
- Result: in 1 of 3 runs the reply was reworded after the checker had passed the saved script, and the reworded reply broke a step rule. Cost: $0.43, $0.46 and $0.44.
- Notes: `report-m2.md`.

## Runs after the duration rule, 2 runs

- Run: ISR after it accepted `## Requirements` and stopped stating durations, once on the Pellwick skip-a-box inputs and once on the real-run inputs.
- Result: neither gave a duration, and both replies passed the checker. The real-input run still asked for a starting state the product does not allow. Cost: $0.42 and $0.55.
- Notes: `report-m2b.md`.

## Smoke run after the writing-rules change, 1 run

- Run: ISR after the writing-rules change to the duration sentence, once on the Pellwick skip-a-box inputs, with the README example request.
- Result: no duration given. The run's own checker failed once ("Not shown (7)" named 9 items) and then passed. The reply equalled the saved script and passed the checker as returned. Cost: $0.44.
- Notes: `audit-smoke/smoke-1.jsonl`, `audit-smoke/smoke-1.reply.md`, `audit-smoke/smoke-1.saved-script.md`.

## Retrospective run on an older Parallax task (e9a55a), 2026-10-01

- This is a retrospective run, not a clean test. The story was written by Loupe after the build, from the build request. The record is Parallax's task e9a55a. Matt knew the record when judging the output.
- Inputs: story 9089 bytes, record files 5210, 6973 and 2286 bytes, copied byte for byte.
- Result: the checker passed on Node 22.23.3 after one round of fixes, which cleared three wording issues. The script reads: Type Recommendation, 0 verified, 4 to check by hand, 8 to confirm (5 shown, 3 not shown). Cost: not recorded.
- Hand check, reading only, against the commit that landed the task (efec592): confirmed the added em dash, in the macOS and Linux sentence, and that the sentence now points to step 6, the clone step; confirmed the new test arranges an existing approval key; confirmed the hardening step and the Harden WSL section never say who runs them after the switch to the new user. The three fresh-distro checks were not attempted; they need a clean machine and an engineer to size them.
- Misses: the record's point about the order of the unset commands did not appear in the script; only its matching risk did, under Not shown. The em dash nit also went under Not shown rather than becoming a check.
- Predictions hit: the fresh-distro check was marked High with an engineer sizing it and no durations, and the Node minimum question came first under Confirm. Predicted miss: ISR put 0 under Already verified, because the record shows only 22 tests, not the full suite.
- What this does not show: any time saving, or that the script helps anyone but the person who built the change.
- Notes: `retro-run-1/run/story.md`, `retro-run-1/run/record/`, `retro-run-1/run/script.md`.

## After-the-fact run on an older Parallax task (40171b), 2026-10-01

- This is an after-the-fact run, not a clean test, and the first run under the run protocol in Matt's notes. Loupe wrote the story in a fresh claude.ai chat from the task's build request. The record is Parallax's task 40171b. The advisor knew the record when predicting and judging.
- No baseline: Matt chose to skip it, so this run says nothing about time saved.
- Inputs: story 7893 bytes; record files 2957, 4407 and 1967 bytes, copied byte for byte.
- Run: skill at b7344bd, in Claude Code on claude-opus-5-5. Cost $0.56. About 3 minutes by Claude Code's wall clock, which includes reopening the session to read the cost. ISR ran the checker twice: the first run flagged the Not shown count, and the second passed on Node 22.23.3.
- Result: Type Recommendation, 3 verified, 2 to check by hand (both Medium), 8 to confirm (5 shown, 3 not shown).
- Predictions, written before the story and the run: hits on the Type, the number verified, the first question, tightening the bare "namespace" match, and the hint wording and heading name. ISR also kept the web card as a check by hand even though the browser test passed, because nobody read the web card code, which was the careful call. Miss: Not looked at did not say the tests were the plan's two files and not the full suite; the e9a55a run did say so.
- Hand check, reading only, against the commit that landed the task (c6b512d): the four tests the plan named exist, the matching words match Confirm 1, the hint wording matches Confirm 3, and the heading "Allow user namespaces" exists in docs/wsl.md. No wrong items found. The two checks by hand were not attempted; they need an engineer and a test environment.
- Judgment: ISR made the bare "namespace" match its headline and a Medium check. The blind checker in the record called that risk small. Low or a Confirm item would have fit better. This is a difference of judgment, not an error.
- Several verified items rest on the plan, since the record only says the plan's tests passed. Reading the commit confirmed them this time.
- What this does not show: any time saving, use by anyone but the builder, or a real run with the story written first.
- Notes: `retro-run-2/story.md`, `retro-run-2/predictions.md`, `retro-run-2/record/`, `retro-run-2/run/script.md`.

## Plain words for readers, and two regressions on the 40171b inputs, 2026-10-01

- Why: four reader agents read the e9a55a script blind, each as one person: a product owner who is not technical, a QA tester, an engineer asked to size it, and a manager who doubts the tool. They come from the same family of model as ISR, did not see the story, and are not a human verdict. All four tripped on the same three things: criteria cited by number only, ISR's own source labels, and "Confirm (8)" over five shown items. Trust scores were 2, 2, 3 and 2 out of 5; all four said it was honest that nothing was verified, and none could act on it alone.
- Changes: Covers lines name each criterion in plain words; Confirm sources use eight plain phrases, at most two per item; team words such as "blind checker" and "Second Eye" are banned in favor of "the automated reviewer"; capped lists say "(N, M shown)"; a criterion with a risk named against it in the record or plan can't go under Already verified, and the automated reviewer is never named as verifying behavior it did not test; every "To confirm" in a requirement must reach Confirm.
- Running headless: the first attempt, in default mode, was denied reading the skill files through the link and denied mktemp. ISR returned an unshaped script labeled "Not checked". Cost $0.37. Later runs added `--permission-mode acceptEdits`, `--add-dir` for the skill folder and /tmp, and allowed mktemp, node and ls. That is not the setup of earlier runs.
- Regression 1, cost $0.53, checker passed in 2 rounds: 2 verified, 3 to check by hand, 5 to confirm. One wrong item: criterion 3 was listed as verified by the tests and the automated reviewer, while the script's own first Confirm item repeated the reviewer's finding that the match is too loose. One Confirm source named seven places.
- Regression 2, after the two-phrase cap and the named-risk rule, cost $0.66, checker passed in 1 round: 1 verified, 3 to check by hand, 6 to confirm (5 shown). Criterion 3 was back under Check by hand, sources named at most two places, and the reviewer was no longer named as a verifier. Gap: criterion 4's "To confirm" was not asked, which led to the new checker rule.
- Variance: three runs on the same inputs put 3, 2 and 1 criteria under Already verified.
- What this does not show: that a person finds the new wording clearer, or that the checker's new rules hold across other stories.
- Notes: `blind-read-e9a55a/reads.md`, `retro-run-2-regress/`, `retro-run-2-regress-2/`.

## Three runs with the rules held fixed, on the 40171b inputs, 2026-10-01

- Why: to separate variation from the model from variation caused by rule changes. Earlier runs on these inputs put 3, 2 and 1 criteria under Already verified, but the rules changed between them.
- Setup: master 026a514, the same story and record copied byte for byte into three folders, the README prompt word for word, and the same permission flags as the regressions.
- Cost: $0.47, $0.47 and $0.56, $1.50 in total. Each run's checker passed in one round.
- Agreed in all three: Type Recommendation; the first question and its source; the five Confirm questions shown; three checks by hand; criterion 1, criterion 3 and criterion 4 under Check by hand; criterion 5 under Already verified.
- Differed: criterion 2 was verified in run 2 and checked by hand in runs 1 and 3, although the plan names a risk against that step in the WSL guide; risk levels (criterion 1 High once and Medium twice, criterion 4 from Medium to Low); how criteria were grouped into checks; the order of Confirm items; and which items fell under Not shown.
- Verified counts: 1, 2 and 1. Most of the earlier spread of 3, 2 and 1 came from rule changes.
- Wrong item: run 2 said the build's plan states something about the error wording that the plan does not say; the plan says the wording likely comes from the agent runtime. Counting the first regression, two of the last five runs on these inputs had a wrong item, both about where a claim came from.
- Decision: no new rules from these inputs. Five runs on one story risk fitting rules to that story. The next evidence should come from a different story.
- Notes: `variance-40171b/run-1`, `run-2` and `run-3`.

## A fourth run with fixed rules, and the blank-line shape, on the 40171b inputs, 2026-10-01

- Why: a fresh example after the shape changed to put a blank line after each of the four top lines, so scripts render correctly as Markdown. Before this, the four top lines ran together into one paragraph on GitHub and in most tools a team would paste into.
- Setup: this branch's skill, the same story and record copied byte for byte, the same flags as the variance runs, the README prompt word for word.
- Result: cost $0.53, checker passed in 1 round. 2 verified, 3 to check by hand, 7 to confirm (5 shown).
- Agreed with the three earlier fixed-rules runs on: Type Recommendation; the first question and its source; the five Confirm questions shown; criteria 1, 3 and 4 under Check by hand; criterion 5 under Already verified. It differed on criterion 2, as run 2 did.
- Rule bent: criterion 2 was counted as verified although the plan names a risk against that step in the WSL guide. The claim itself is true against the landed commit. With the rules fixed, 2 of 4 runs on these inputs bent the named-risk rule, both times on criterion 2. This is the weakest rule so far, and the checker cannot enforce it.
- Not used as the README example, because it bent a rule; the example stays the run-3 script, which kept every rule, with the blank lines added.
- Notes: `example-40171b-v2/run/`.

## The runner: a loop that holds the writer to the checker, on the 40171b inputs, 2026-10-05

- Why: the named-risk rule was the weakest, broken in 2 of 4 fixed-rules runs, and the checker could not enforce it, since linking a risk to a criterion takes judgment.
- Change: `runner/` runs the skill with the Claude Agent SDK. Code reads the build's risks; a separate model call with no tools links each risk to criteria, seeing only the criteria and the risks; the checker's new `--risks` rule fails a script that verifies a linked criterion; a Stop hook runs the checker when the writer tries to finish and sends it back, up to 3 times. Setup is in `docs/headless-runs.md`.
- Reproduction: the fixed-rules run-4 script passes the checker at master, and fails with a risk map, on criterion 2, both with a map written by hand and with the map the mapper wrote in the smoke run. The README example, which kept the rule, passes with either map.
- Smoke run: skill and runner uncommitted on branch runner-loop at 1d61263, claude-opus-5-5, the same story and record as the variance runs. Cost $0.44: $0.06 for the mapper, $0.38 for the writer. 15 writer turns. The checker passed when the writer first stopped, so the Stop hook sent nothing back. 1 verified, 3 to check by hand, 8 to confirm; criterion 2 under Check by hand, criterion 5 verified, the same placement as the README example.
- Mapper only, 5 more runs: $0.12 in total. The links for single risks varied, but all 6 mapper runs, counting the smoke run, linked criteria 1 to 4 and left criterion 5 unlinked. Criterion 2 was linked every time, by the plan's risk about changing the WSL guide step.
- Over-blocking: on 40171b the mapper linked 4 of 5 criteria in all 6 runs, so only 1 could be verified. On stories whose plans name broad risks, Already verified may be left nearly empty. Whether each link is right has not been judged by a person yet.
- The runner returns the file the checker passed, not the writer's reply, so a reply reworded after the check can no longer slip through.
- What this does not show: that the loop lowers the rate of broken rules, since in this one run the writer kept the rule on its own, as 2 of the 4 earlier runs did; a real run where the Stop hook sent a script back; the mapper on any other story. The send-back is shown only in tests, with a stand-in for the SDK.
- Notes: `runner-smoke-1/` (`run.json`, `risks.json`, `script.md`, and `map-5.mjs`, the script for the mapper-only runs).

## Four runner runs on the 40171b inputs, two with the risks hidden from the writer, 2026-10-05

- Why: to see the Stop hook act on a real run. With the risk map in hand, the writer's own checker runs fail a bent script before it ever stops, so a normal run can't show the hook. `--hide-risks-from-writer` leaves the map to the Stop hook alone. It is an experiment, not how ISR is meant to run.
- Setup: branch runner-loop at e3d6a2b, claude-opus-5-5, the same story and record as the variance runs, the writer capped at $0.65 (normal) or $0.90 (hidden). Two runs at a time, in parallel.
- Total cost: $1.48 of a $3.00 limit.

| Run | Risks hidden | Cost | Checker runs by the writer | Stop hook send-backs | Criterion 2 | Blocked by the map | Final file passed |
|:---|:---|---:|---:|---:|:---|:---|:---|
| normal-1 | no | $0.42 | 1 | 0 | Check by hand | 1, 2, 3, 4 of 5 | yes |
| normal-2 | no | $0.35 | 1 | 0 | Check by hand | 1, 2, 3, 4 of 5 | yes |
| hidden-1 | yes | $0.37 | 2 | 0 | Check by hand | 1, 2, 3, 4 of 5 | yes |
| hidden-2 | yes | $0.34 | 1 | 0 | Check by hand | 1, 2, 3, 4 of 5 | yes |

- What the normal arm shows: the loop runs end to end, and with the map in hand the writer placed every criterion where the map allows on its first stop. It can't show the Stop hook catching anything, since the writer's own checker would have caught a bent script first.
- What the hidden arm shows: without the map, the writer still kept criterion 2 out of Already verified in both runs, so the Stop hook had nothing to send back. No real run has yet shown a send-back; that path is shown only in tests, with a stand-in for the SDK.
- Agreed in all four: every criterion in the same section (1 to 4 by hand, 5 verified) and Type Recommendation. Counts differed only in checks by hand (3 or 4) and Confirm items (9 or 10).
- Over-blocking: the mapper again linked criteria 1 to 4 in every run, so 10 of 10 mapper runs on these inputs now agree. Its links have still not been judged by a person.
- Refused tool calls: each run had one or two, all Bash. The writer tried a combined command to read its inputs (`cd`, `ls`, `cat` together), or a `sed` edit of the script; each time it fell back to the allowed tools and finished.
- What this does not show: a rate. Two runs per arm, on one story, can't say how often the writer bends the rule without the map; the earlier 2 of 4 came from runs under `claude -p`, with a different setup.
- Notes: `runner-runs/normal-1`, `normal-2`, `hidden-1` and `hidden-2`, each with `run.json`, `risks.json` and `script.md`, and the reply and stderr next to each.

## Judging the mapper's links on 40171b, 2026-10-05

- Why: the mapper linked criteria 1 to 4 to a risk in 10 of 10 runs, so only criterion 5 could be verified. The question was whether that blocking is earned or the mapper over-links.
- What was judged: the 10 distinct risk-to-criterion links the mapper made across the 5 saved runner runs (the smoke run and the 4 runs in runner-runs). The question for each: if this risk came true, would that criterion plausibly fail or be unproven?
- Who judged: an independent reviewer agent (same model family as ISR) that saw only the 5 criteria, the 5 risks and the links in shuffled order, without how often each was made; the advisor, who wrote marks before seeing the agent's; and Matt, who broke the one tie that decided a criterion.
- Results: 7 links right by agreement or Matt's tie-break: free-text detection to criteria 1 and 3, the shape check to criteria 1 and 4, web card rendering to criterion 4, the bare "namespace" match to criterion 3, and editing the WSL guide step to criterion 2 (the agent said right, the advisor said wrong, Matt said right). 2 links right by the agent and unsure by the advisor: free-text detection to criterion 2, and the shape check to criterion 2. 1 link doubtful: the bare "namespace" match to criterion 2 (the agent said wrong, the advisor unsure), made in 4 of 5 runs. 1 link missing: web card rendering to criterion 1, which the agent found and the mapper never made.
- Verdict for this story: the blocking is earned. Every blocked criterion is held out by at least one link judged right. Neither the doubtful link nor the missing one changed what could be verified.
- What this does not show: the mapper on any other story; a judgment by anyone outside the builder and two models of the same family; whether broad plan risks over-block on stories where the build is less risky.
- Notes: `runner-smoke-1/risks.json`, `runner-runs/*/risks.json`.

## The first story-first run, on a real Parallax change (e3108e), 2026-10-05

- Why: Loupe, Parallax and ISR had never been run in order on one change. The change: the sandbox start hint on Parallax's error cards matched the bare word "namespace", so another tool's error could get it by mistake.
- What ran, in order:
  - Matt's request, in his own words.
  - Loupe's story. It first wrote a bug report, which ISR can't read because it has no Requirements or Acceptance criteria section. Following ISR's own not-ready guidance, Matt answered its four questions and Loupe rewrote it as a user story with 5 numbered requirements.
  - Parallax's build, task e3108e, in a separate worktree on its own branch. Matt approved the plan and clicked Accept and merge, which landed it on that branch.
  - The record (intent, plan and record), copied byte for byte.
  - Blind predictions by a helper agent that saw only the story and the record, written before ISR ran.
  - ISR's runner.
  - Checks by reading against the landed commit (c273ee1), then three checks by hand by Matt.
- Inputs: story 5998 bytes; record files 4324, 5221 and 1753 bytes.
- Costs and times: Parallax $0.77 of a $5.00 cap. ISR $0.37, runner with skill 7b1df40 on claude-opus-5-5, 72 seconds. Its checker passed on the first run, and the Stop hook sent nothing back.
- Result: Type Recommendation, 2 verified, 2 to check by hand (High and Medium), 6 to confirm (5 shown). The mapper blocked criteria 2, 3 and 5 of 5.
- ISR got right:
  - It blocked exactly the requirements the record doesn't prove.
  - It picked the right high risk: three of the four user namespace wordings came from the model's memory and were never checked against real output.
  - It raised the two decisions the build made on its own as Confirm questions: a "sandbox runtime" or "srt:" marker is now required for any hint, and a bare bwrap error with no marker gets none.
- ISR missed or overclaimed:
  - It counted requirement 1 as verified although that requirement includes "unchanged card", and the tests only check that the hint lines are gone. ISR verifies whole criteria, and here the evidence covered part of one.
  - It did not flag that only the plan's one test file ran (37 of 37), the same miss as on 40171b.
  - It did not mention that logging must not change.
  - It did not flag a contradiction in the plan's step 2: one bullet says a marker or a wording is enough, the next says a marker is required.
- What the checks found:
  - Matt ran bwrap and srt inside a bwrap that forbids new user namespaces. Both printed "bwrap: Creating new namespace failed: nesting depth or /proc/sys/user/max_*_namespaces exceeded (ENOSPC)", with no "srt:" or "sandbox runtime" marker.
  - So the change gives that real output no hint, where the old code, read at 22ef600, gave both lines. This is a regression that the build's 37 passing tests, the automated reviewer and ISR's reading of the record all missed.
  - In the seeded demo UI, the error card still showed both lines in order, and a budget card showed neither. A demo error card written on Sept 30, before the change, also showed both lines with the new code.
  - Reading the code also suggests that a real sandbox start failure stops at preflight with a "stuck" card, which never gets the hint, so the feature may never have reached a real user.
  - ISR's first check by hand, which says to turn off user namespaces and open the task's error card, would most likely have ended at that preflight card.
  - The kubectl half of ISR's second check was not attempted: no older card for another tool's namespace error exists.
  - The change was not merged to master.
- Predictions: 7 hits, 11 misses, 0 wrong of 18. Most misses were the helper expecting more checks by hand than ISR kept: 8 against 2.
- Advisor error, from Matt: the advisor advised accepting the build's "marker required" rule, citing the wrapped error text, which came from tests, not real output.
- Process slips, as written in the run's decisions file:
  - "Process slip: the checker fixes were applied with a short python string replacement, not Claude Code's file tools, which Loupe's files mode asks for. The content is what the file tools would have written. Logged, not redone."
  - "Correction: entries 18 to 21 first carried times from 18:40 to 18:46, and times.md and handcheck.md said Step F part 1 ran 18:35 to 18:47. Those were estimates written ahead of time. File times show all of it was written by 18:37:45. Fixed in all three files."
- Change after this run: a checker rule. When the record says only the plan's tests ran, Not looked at must say so. With it, this run's script and the README example both fail on that line, and the e9a55a script, which said it, passes.
- Follow-up in Parallax, branch real-sandbox-hint, not merged:
  - The code path matched these notes, with one step they left out: before preflight, Reticle runs its tests through srt and records srt's last line.
  - The fix keeps what bwrap or srt printed when the sandbox doesn't start, and quotes it on the stuck card with one next step.
  - CI's real-failure test exists: a real preflight inside a bwrap that forbids new user namespaces. CI passed, 617 tests, 0 skipped.
  - A real task run that way on this machine got this card, quoted from `real-run-3/fix-real-card.txt`:

    > Bottom line: Needs you: the sandbox didn't start, so the build didn't launch.
    > - the sandbox didn't start, so the build didn't launch (bwrap: Creating new namespace failed: nesting depth or /proc/sys/user/max_*_namespaces exceeded (ENOSPC)) (ledger 1b372506)
    > - To fix it, allow user namespaces (see "Allow user namespaces" in docs/wsl.md and the sysctl line in the README's setup step 1), then retry; parallax doctor checks the sandbox once it's set. (ledger 1b372506)

- What this shows: the pipeline as a whole found a real regression. ISR alone did not, but its top risk pointed the check at it.
- What this does not show: a time saving, or a judge other than Matt and the agents.
- Notes: `real-run-3/`.
