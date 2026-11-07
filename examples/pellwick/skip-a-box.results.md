# Hand check results: Let subscribers skip their next box from their account

- Story: skip-a-box.story.md
- Script: skip-a-box.script.md
- Review: skip-a-box.review.md

ISR wrote down what each tester reported. It never decides whether a check passed or failed, and it does not accept the change.

## Checks by hand (2)

### 1. No charge for a skipped box
- Covers: criterion 3 (no charge for a skipped box).
- Checked by: Sam Okafor, 2026-10-09
- Did: skipped the next box of a staging subscriber, then ran the billing job for the box's original ship date.
- Saw: the billing job made no charge for the skipped box on that date.
- Evidence: evidence/billing-run-2026-10-09.txt (the billing job's output)
- Tester says: matched what the script expects.

### 2. The skip note in Stockroom
- Covers: criterion 4 (a skip note in Stockroom).
- Checked by: Dana Ruiz, 2026-10-09
- Did: opened the same subscriber in Stockroom as an agent, then opened their history.
- Saw: the history showed no note about the skip, though the web app's own notes page for that subscriber listed "Skipped by customer".
- Evidence: evidence/stockroom-history.png; evidence/web-app-notes.png
- Tester says: did not match what the script expects.

## Not checked by hand (2)
- Criterion 1: the script lists it as already verified.
- Criterion 2: the script lists it as already verified.
