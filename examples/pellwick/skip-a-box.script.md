Type: Recommendation
Bottom line: 2 verified, 2 to check by hand, 12 to confirm; nothing has checked that a skipped box is not charged, so check 1 matters most.
Not looked at: the build itself, since ISR read only the story and the build record and takes the record's word on what its tests cover.
Next: Give the two checks to a tester in staging, check 1 first.

# Acceptance script: Let subscribers skip their next box from their account

## Already verified (2)
- Before the cutoff, a subscriber can skip their next box, and it moves to the next regular delivery date. Verified by: the build's automated tests, 14 of 14 passing, and a blind code review. Criterion 1.
- Once the cutoff has passed, the account offers no way to skip the next box. Verified by: the build's automated tests, 14 of 14 passing, and a blind code review. Criterion 2.

## Check by hand (2)

### 1. No charge for a skipped box
- Risk: High. Why: a wrong charge costs subscribers money, no automated check looked at billing, and the story lists billing for a moved box as unknown.
- Needs: a subscriber in staging with a card on file and a next box whose cutoff has not passed.
- Steps:
  1. Skip the subscriber's next box from their account.
  2. Wait until the box's original ship date has passed in staging.
  3. Look at the subscriber's charges for that date.
- Expect: no charge for the skipped box on its original ship date.
- Covers: criterion 3.

### 2. The skip note in Stockroom
- Risk: Medium. Why: agents answer subscribers from this history, and the build checked that the note is written but nobody looked at it in Stockroom.
- Needs: a subscriber in staging who has just skipped their next box, and an agent login to Stockroom.
- Steps:
  1. Open the subscriber in Stockroom as an agent.
  2. Open their history.
- Expect: a note that the customer skipped the box. Its exact wording, and whether it shows the date and time, are still open (Confirm 4).
- Covers: criterion 4.

## Confirm (12)
- After a skip, the build shows "Your next box is skipped" and the new delivery date, but the story left how the page shows the date to confirm. Is that what the page should say? (inferred by the build; criterion 1)
- Which system decides the next regular delivery date, the web app or Stockroom, since they sometimes disagree? (Questions before building; the build's review raised it too)
- Where does skipping sit: the account home page, the "change my box" page, or both? (Unknown)
- What exact wording should the Stockroom note use, with Dana's "Skipped by customer" as a suggestion, and should it show the date and time? (criterion 4)
- Does skipping count as a payments change under the December freeze? (Questions before building)
Not shown (7): skipping a box whose payment already failed; whether a billing fix is part of this story; skipping the box after one already skipped; the cutoff passing while the page is open; what the page shows once the cutoff has passed; undoing a skip before the cutoff; changes to the cutoff while skipping is live
