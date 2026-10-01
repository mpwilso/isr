Type: Recommendation
Bottom line: 2 verified, 2 to check by hand, 12 to confirm; nothing has checked that a skipped box is not charged, so check 1 matters most.
Not looked at: the build itself, since ISR read only the story and the build record and takes the record's word on what its tests cover.
Next: Ask Sam to run check 1 in staging, then give check 2 to a tester.

# Acceptance script: Let subscribers skip their next box from their account

## Already verified (2)
- Before the cutoff, a subscriber can skip their next box, and it moves to the next regular delivery date. Verified by: the build's automated tests, 14 of 14 passing, and a blind code review. Criterion 1.
- Once the cutoff has passed, the account offers no way to skip the next box. Verified by: the build's automated tests, 14 of 14 passing, and a blind code review. Criterion 2.

## Check by hand (2)

### 1. No charge for a skipped box
- Risk: High. Why: a wrong charge costs subscribers money, no automated check looked at billing, and the story lists billing for a moved box as unknown.
- Needs: a subscriber in staging whose next box's cutoff has not passed, and an engineer who can see billing in staging. This takes more than a few minutes, since the engineer has to make a ship date pass in staging and read billing; likely under an hour, a guess.
- Steps:
  1. Skip the subscriber's next box from their account.
  2. Ask the engineer to make the box's original ship date pass in staging; the story does not say how.
  3. Ask the engineer for the subscriber's charges on that date.
- Expect: no charge for the skipped box on its original ship date.
- Covers: criterion 3.

### 2. The skip note in Stockroom
- Risk: Medium. Why: agents answer subscribers from this history, and the build checked that the note is written but nobody looked at it in Stockroom.
- Needs: a subscriber in staging who has just skipped their next box, and an agent login to Stockroom.
- Steps:
  1. Open the subscriber in Stockroom as an agent.
  2. Open their history.
- Expect: a note that the customer skipped the box. Its exact wording, and whether it shows the date and time, are still open (Confirm 2).
- Covers: criterion 4.

## Confirm (12)
- Does skipping count as a payments change under the December freeze, since it affects charging? (First question; Questions before building)
- What exact wording should the Stockroom note use, with Dana's "Skipped by customer" as a suggestion, and should it show the date and time? (criterion 4)
- If billing does charge a skipped box, is fixing that part of this story or a separate one? (Questions before building)
- After a skip, the build shows "Your next box is skipped" and the new delivery date, but the story left how the page shows the date to confirm. Is that what the page should say? (inferred by the build; criterion 1)
- The build takes the next regular delivery date from the web app, as its plan records, though the web app and Stockroom sometimes disagree. Is the web app the right source? (Questions before building; inferred by the build)
Not shown (7): where skipping sits, which the build put on the account page; skipping a box whose payment already failed; skipping the box after one already skipped; the cutoff passing while the page is open; what the page shows once the cutoff has passed; undoing a skip before the cutoff; changes to the cutoff while skipping is live
