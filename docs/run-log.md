This log was written from the builder's own notes after the runs; the raw outputs are not kept in this repo.

# Run log

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
