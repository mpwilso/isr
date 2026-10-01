# Run log

This log was written from the builder's own notes after the runs; the raw outputs are not kept in this repo.

Each entry names the note file it came from.

## Real run 1, 2026-10-01

- Run: ISR on one real change, the Parallax change that lets Accept and merge land a task whose base has moved.
- Input: the story for that change, and the record of Parallax task 786e71. That record says 43 plan tests passed and 1 was skipped, Second Eye, the blind checker, passed it, 7 files changed, and the build cost an estimated $2.63 of a $5.00 cap.
- Result: a script with 4 verified, 1 to check by hand and 6 to confirm, shown in the README. The builder judged it. An attempt at the hand check took about 70 minutes and $1.47 and did not get far enough to run it.
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
- Agreed in all three: Type Recommendation; the first question and its source; the five Confirm questions shown; three checks by hand; criterion 1 and criterion 3 under Check by hand; criterion 5 under Already verified.
- Differed: criterion 2 was verified in run 2 and checked by hand in runs 1 and 3, although the plan names a risk against that step in the WSL guide; risk levels (criterion 1 High once and Medium twice, criterion 4 from Medium to Low); how criteria were grouped into checks; the order of Confirm items; and which items fell under Not shown.
- Verified counts: 1, 2 and 1. Most of the earlier spread of 3, 2 and 1 came from rule changes.
- Wrong item: run 2 said the build's plan states something about the error wording that the plan does not say; the plan says the wording likely comes from the agent runtime. Counting the first regression, two of the last five runs on these inputs had a wrong item, both about where a claim came from.
- Decision: no new rules from these inputs. Five runs on one story risk fitting rules to that story. The next evidence should come from a different story.
- Notes: `variance-40171b/run-1`, `run-2` and `run-3`.
