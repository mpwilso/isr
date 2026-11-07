Type: Decision needed

Bottom line: Sam reported that check 1, the cutoff on the "change my box" page, did not match what the script expects for a box that ships on 5 January; ISR proposes a build mistake, so the lesson would go to the build tool's eval cases.

Not looked at: the build itself and its configuration, since ISR read only the story, the script, the build record and the results.

Next: Theo picks the class, then carries the case below into Parallax's eval cases by hand once a fix and its test exist.

# Lesson: The page shows 96 hours over the holidays and 72 after

- Results: holiday-cutoff.results.md, check 1.
- Covers: criterion 1 (96 hours over the holidays) and criterion 4 (72 hours again from 5 January).
- Tester saw: both pages showed a cutoff of 96 hours before the ship date.
- Class proposed by ISR: build mistake. This is a proposal, not a finding.
- Class picked by a person: not picked yet.
- Lesson goes to: the build tool's eval cases (Parallax's evals/cases.toml).

## Why ISR proposes this (3)
- The story says the cutoff is back to 72 hours from 5 January. (the story says this)
- The build's tests set the date with a stand-in clock, and the two that read staging's own clock were skipped. (the build record says this)
- A box that ships on 5 January showed 96 hours. (the tester reported this)

## Carry over by hand
```toml
[[case]]
id = "pellwick-holiday-cutoff-5-january"
# repo: not known yet, since the record does not name the repository.
# base: not known yet, since the record does not give the commit the build started from.
# fix: not known yet, since nothing has fixed it.
# tests: not known yet, since no test covers it yet.
goal = """On the "change my box" page, a box that ships on 5 January shows a cutoff of 96 hours. From 5 January the cutoff should be 72 hours again."""
```
