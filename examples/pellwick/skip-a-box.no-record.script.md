Type: Recommendation
Bottom line: 0 verified, 4 to check by hand, 12 to confirm; with no build record, every criterion needs a person to check it.
Not looked at: no build record was given, so nothing counts as verified, and ISR did not look at the build itself.
Next: Ask the developers for the build record before testing, since it may already cover some of these checks.

# Acceptance script: Let subscribers skip their next box from their account

## Already verified (0)
None. No build record was given.

## Check by hand (4)

### 1. No charge for a skipped box
- Risk: High. Why: a wrong charge costs subscribers money, and the story lists billing for a moved box as unknown.
- Needs: a subscriber in staging with a card on file and a next box whose cutoff has not passed.
- Steps:
  1. Skip the subscriber's next box from their account.
  2. Wait until the box's original ship date has passed in staging.
  3. Look at the subscriber's charges for that date.
- Expect: no charge for the skipped box on its original ship date.
- Covers: criterion 3.

### 2. A skip moves the box to the next delivery date
- Risk: High. Why: a skip that doesn't take leaves a subscriber with a box they didn't want.
- Needs: a subscriber in staging whose next box's cutoff has not passed, and the date of their next regular delivery after it.
- Steps:
  1. Skip the subscriber's next box from their account.
  2. Open the subscriber in Stockroom as an agent.
  3. Find the box they skipped.
- Expect: the box has moved to the next regular delivery date.
- Covers: criterion 1.

### 3. No skip once the cutoff has passed
- Risk: Medium. Why: a late skip could stop a box that is already on its way, and what the page shows instead is still open.
- Needs: a subscriber in staging whose next box's cutoff, 72 hours before the ship date today, has passed.
- Steps:
  1. Sign in as the subscriber.
  2. Try to skip their next box from their account.
- Expect: they can't skip it. What the page shows instead is not settled yet.
- Covers: criterion 2.

### 4. The skip note in Stockroom
- Risk: Medium. Why: agents answer subscribers from this history, and the story assumes Stockroom needs no change to show it.
- Needs: a subscriber in staging who has just skipped their next box, and an agent login to Stockroom.
- Steps:
  1. Open the subscriber in Stockroom as an agent.
  2. Open their history.
- Expect: a note that the customer skipped the box. Its exact wording, and whether it shows the date and time, are still open (Confirm 4).
- Covers: criterion 4.

## Confirm (12)
- Should the page show the new delivery date after a skip, and how? (criterion 1)
- Which system decides the next regular delivery date, the web app or Stockroom, since they sometimes disagree? (Questions before building)
- Where does skipping sit: the account home page, the "change my box" page, or both? (Unknown)
- What exact wording should the Stockroom note use, with Dana's "Skipped by customer" as a suggestion, and should it show the date and time? (criterion 4)
- Does skipping count as a payments change under the December freeze? (Questions before building)
Not shown (7): skipping a box whose payment already failed; whether a billing fix is part of this story; skipping the box after one already skipped; the cutoff passing while the page is open; what the page shows once the cutoff has passed; undoing a skip before the cutoff; changes to the cutoff while skipping is live
