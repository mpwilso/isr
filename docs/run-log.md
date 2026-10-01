# Run log

This log was written from the builder's own notes after the runs; the raw outputs are not kept in this repo.

Each entry names the note file it came from.

## Real run 1, 2026-10-01

- Run: ISR on one real change, the Parallax change that lets Accept and merge land a task whose base has moved.
- Input: the story for that change, and the record of Parallax task 786e71. That record says 43 plan tests passed and 1 was skipped, Second Eye, the blind checker, passed it, 7 files changed, and the build cost an estimated $2.63 of a $5.00 cap.
- Result: a script with 4 verified, 1 to check by hand and 6 to confirm, shown in the README. The builder judged it. An attempt at the hand check took about 70 minutes and $1.47 and did not get far enough to run it.
- Notes: `real-run-1/run/record/record.md`, `real-run-1/run/script.md`, `real-run-1/after.txt`.

## Regression on the real-run inputs, 3 runs

- Run: ISR after the first fixes, three times, with the same request and inputs as real run 1.
- Result: four of six checks held in all three runs. The starting-state check held in 1 of 3. All three guessed minutes for the gate run in the hand check, against the about 70 minutes the real attempt took (`real-run-1/after.txt` line 13), so the effort was understated in 3 of 3. Cost: $0.54, $0.52 and $0.59.
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
