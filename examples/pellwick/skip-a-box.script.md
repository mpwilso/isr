Type: Recommendation
Bottom line: 2 verified, 2 to check by hand, 12 to confirm; nothing has checked that a skipped box is not charged, so check 1 matters most.
Not looked at: the build itself, since ISR read only the story and the build record and takes the record's word on what its tests cover.
Next: Ask Sam to run check 1 in staging, then give check 2 to a tester.

# Acceptance script: Let subscribers skip their next box from their account

## Already verified (2)
- Before the cutoff, a subscriber can skip their next box, and it moves to the next regular delivery date. Verified by: the build's automated tests, 14 of 14 passing, and the automated reviewer. Criterion 1.
- Once the cutoff has passed, the account offers no way to skip the next box. Verified by: the build's automated tests, 14 of 14 passing, and the automated reviewer. Criterion 2.

## Check by hand (2)

### 1. No charge for a skipped box
- Risk: High. Why: a wrong charge costs subscribers money, no automated check looked at billing, and the story lists billing for a moved box as unknown.
- Needs: a subscriber in staging whose next box's cutoff has not passed, and an engineer who can see billing in staging. It needs the engineer to make a ship date pass in staging and read billing, so the engineer should size it before anyone commits to it.
- Steps:
  1. Skip the subscriber's next box from their account.
  2. Ask the engineer to make the box's original ship date pass in staging; the story does not say how.
  3. Ask the engineer for the subscriber's charges on that date.
- Expect: no charge for the skipped box on its original ship date.
- Covers: criterion 3 (no charge for a skipped box).

### 2. The skip note in Stockroom
- Risk: Medium. Why: agents answer subscribers from this history, and the build checked that the note is written but nobody looked at it in Stockroom.
- Needs: a subscriber in staging who has just skipped their next box, and an agent login to Stockroom.
- Steps:
  1. Open the subscriber in Stockroom as an agent.
  2. Open their history.
- Expect: a note that the customer skipped the box. Its exact wording, and whether it shows the date and time, are still open (Confirm 2).
- Covers: criterion 4 (a skip note in Stockroom).

## Confirm (12, 5 shown)
- Does skipping count as a payments change under the December freeze, since it affects charging? (the story asks this first; asked in the story)
- What exact wording should the Stockroom note use, with Dana's "Skipped by customer" as a suggestion, and should it show the date and time? (criterion 4 leaves this open)
- If billing does charge a skipped box, is fixing that part of this story or a separate one? (asked in the story)
- After a skip, the build shows "Your next box is skipped" and the new delivery date, but the story left how the page shows the date to confirm. Is that what the page should say? (the build decided this; criterion 1 leaves this open)
- The build takes the next regular delivery date from the web app, as its plan records, though the web app and Stockroom sometimes disagree. Is the web app the right source? (asked in the story; the build decided this)
Not shown (7): where skipping sits, which the build put on the account page; skipping a box whose payment already failed; skipping the box after one already skipped; the cutoff passing while the page is open; what the page shows once the cutoff has passed (criterion 2 leaves this open); undoing a skip before the cutoff; changes to the cutoff while skipping is live
