Type: Decision needed
Bottom line: 1 verified, 1 to check by hand, 8 to confirm, 1 not covered; the build gave boxes created before 1 December the 96 hour cutoff, which the story left open, so that needs a decision first.
Not looked at: the build itself, since ISR read only the story and the build record; the record admits its tests set the date with a stand-in clock, skipped the 2 tests that read staging's own clock, and never looked at Stockroom.
Next: Ask Theo and Sam whether a box created before 1 December keeps 72 hours, then have an engineer run check 1 in staging.

# Acceptance script: Move the box cutoff to 96 hours over the holidays, so the warehouse can keep up

## Already verified (1)
- During the holiday period, a change to a box that ships within 96 hours is blocked. Verified by: the build's automated tests, 9 passed and 2 skipped, and a blind code review. Criterion 2.

## Check by hand (1)

### 1. The page shows 96 hours over the holidays and 72 after
- Risk: High. Why: a wrong cutoff lets subscribers change boxes the warehouse has already packed, and the build's tests used a stand-in clock, so nothing checked the page against real dates.
- Needs: an engineer, and two subscribers in staging: one whose box on the "change my box" page ships between 1 December and 4 January, and one whose box ships on or after 5 January. The story and record do not say how staging gets boxes with those ship dates, so the engineer should confirm how first. The holiday dates come with the build, so nothing needs setting. It needs the build in staging and boxes with holiday ship dates, so the engineer should size it before anyone commits to it.
- Steps:
  1. Open the first subscriber's "change my box" page.
  2. Read the cutoff it shows.
  3. Open the second subscriber's "change my box" page.
  4. Read the cutoff it shows.
- Expect: the first page shows a cutoff of 96 hours before the ship date, and the second shows 72 hours. Which boxes count as "from 1 December" is not settled yet (Confirm 2).
- Covers: criteria 1 and 4.

## Confirm (8)
- Both switches fall inside the December freeze dates. Does the freeze cover this change? (First question; Questions before building)
- The build reads "from 1 December" as boxes that ship from 1 December, not changes made from that date, as its intent records. Is that right? (Unknown; inferred by the build)
- The build switches to 96 hours and back on its own, from a date range in its configuration, as its plan records. Should it, or should someone switch it by hand? (Questions before building; inferred by the build)
- The build gives a box created before 1 December that ships after it the 96 hour cutoff, as its intent records. Is that right, or should it keep 72 hours? (criterion 3; Unknown; inferred by the build)
- The build's plan has not decided whether to keep updating the cutoff stored on each box, so an agent in Stockroom may see 72 hours where the page shows 96. Should agents see the same cutoff as subscribers? (the build's plan; the build record; Assumed)
Not shown (3): the page open when the cutoff switches; the time of day and time zone of each switch; who tells agents about the 96 hour cutoff

## Not covered (1)
- Criterion 3: moved to Confirm, since the story does not say whether a box created before 1 December keeps 72 hours or moves to 96.
