Type: Recommendation
Bottom line: 0 verified, 4 to check by hand, 12 to confirm; with no build record, every criterion needs a person to check it.
Not looked at: no build record was given, so nothing counts as verified, and ISR did not look at the build itself.
Next: Ask Sam to run check 1 in staging, then give checks 2 to 4 to a tester.

# Acceptance script: Let subscribers skip their next box from their account

## Already verified (0)
None. No build record was given.

## Check by hand (4)

### 1. No charge for a skipped box
- Risk: High. Why: a wrong charge costs subscribers money, and the story lists billing for a moved box as unknown.
- Needs: a subscriber in staging whose next box's cutoff has not passed, and an engineer who can see billing in staging. It needs the engineer to make a ship date pass in staging and read billing, so the engineer should size it before anyone commits to it.
- Steps:
  1. Skip the subscriber's next box from their account.
  2. Ask the engineer to make the box's original ship date pass in staging; the story does not say how.
  3. Ask the engineer for the subscriber's charges on that date.
- Expect: no charge for the skipped box on its original ship date.
- Covers: criterion 3 (no charge for a skipped box).

### 2. A skip moves the box to the next delivery date
- Risk: High. Why: a skip that doesn't take leaves a subscriber with a box they didn't want.
- Needs: a subscriber in staging whose next box's cutoff has not passed, the date of their next regular delivery after it, and an agent login to Stockroom.
- Steps:
  1. Skip the subscriber's next box from their account.
  2. Open the subscriber in Stockroom as an agent.
  3. Find the box they skipped.
- Expect: the box has moved to the next regular delivery date.
- Covers: criterion 1 (a skip moves the box to the next delivery date).

### 3. No skip once the cutoff has passed
- Risk: Medium. Why: a late skip could stop a box that is already on its way, and what the page shows instead is still open.
- Needs: a subscriber in staging whose next box's cutoff, 72 hours before the ship date today, has passed.
- Steps:
  1. Sign in as the subscriber.
  2. Try to skip their next box from their account.
- Expect: they can't skip it. What the page shows instead is not settled yet (Confirm 5).
- Covers: criterion 2 (no skip once the cutoff has passed).

### 4. The skip note in Stockroom
- Risk: Medium. Why: agents answer subscribers from this history, and the story assumes Stockroom needs no change to show it.
- Needs: a subscriber in staging who has just skipped their next box, and an agent login to Stockroom.
- Steps:
  1. Open the subscriber in Stockroom as an agent.
  2. Open their history.
- Expect: a note that the customer skipped the box. Its exact wording, and whether it shows the date and time, are still open (Confirm 4).
- Covers: criterion 4 (a skip note in Stockroom).

## Confirm (12, 5 shown)
- Does skipping count as a payments change under the December freeze, since it affects charging? (the story asks this first; asked in the story)
- Should the page show the new delivery date after a skip, and how? (criterion 1 leaves this open)
- Which system decides the next regular delivery date, the web app or Stockroom, since they sometimes disagree? (asked in the story)
- What exact wording should the Stockroom note use, with Dana's "Skipped by customer" as a suggestion, and should it show the date and time? (criterion 4 leaves this open)
- What should the page show once the cutoff has passed? (criterion 2 leaves this open)
Not shown (7): whether a billing fix is part of this story; where skipping sits on the account; skipping a box whose payment already failed; skipping the box after one already skipped; the cutoff passing while the page is open; undoing a skip before the cutoff; changes to the cutoff while skipping is live
