# Hand check results: Move the box cutoff to 96 hours over the holidays, so the warehouse can keep up

- Story: holiday-cutoff.story.md
- Script: holiday-cutoff.script.md
- Review: holiday-cutoff.review.md

ISR wrote down what each tester reported. It never decides whether a check passed or failed, and it does not accept the change.

## Checks by hand (1)

### 1. The page shows 96 hours over the holidays and 72 after
- Covers: criterion 1 (96 hours over the holidays) and criterion 4 (72 hours again from 5 January).
- Checked by: Sam Okafor, 2026-10-10
- Did: opened the "change my box" page for a staging box that ships on 18 December, then for one that ships on 5 January.
- Saw: both pages showed a cutoff of 96 hours before the ship date.
- Evidence: evidence/change-page-18-december.png; evidence/change-page-5-january.png
- Tester says: did not match what the script expects.

## Not checked by hand (2)
- Criterion 2: the script lists it as already verified.
- Criterion 3: the script lists it as not covered, moved to Confirm.
