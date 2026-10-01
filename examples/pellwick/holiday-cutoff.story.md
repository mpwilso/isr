Call: Story written
Confidence: Low, no one knows if boxes that already exist pick up the new cutoff.
First question: Both switches fall inside the December freeze dates. Does the freeze cover this change?

# Move the box cutoff to 96 hours over the holidays, so the warehouse can keep up

## The story
Change: Move the box cutoff from 72 to 96 hours before the ship date, from 1 December. Go back to 72 hours on 5 January.
Reason: December volume nearly doubles, and the warehouse can't pick and pack everything inside 72 hours.
Asked for by: Theo Park, warehouse operations, by email on 2026-09-26.
Done when:
- The cutoff is 96 hours before the ship date from 1 December, and 72 hours again from 5 January.
- Subscribers see the cutoff on the "change my box" page, the same way as today.

## Acceptance criteria
- Given it is between 1 December and 5 January, when a subscriber opens the "change my box" page, then it shows a cutoff of 96 hours before the ship date.
- Given a box ships within 96 hours during that period, when the subscriber tries to change it, then the change is blocked.
- Given a box was created before 1 December and ships after it, when the subscriber opens the "change my box" page, then it shows that box's cutoff. To confirm: whether it keeps 72 hours or moves to 96.
- Given it is 5 January or later, when a subscriber opens the "change my box" page, then the cutoff is back to 72 hours.

## Not included
None.

## Known
- Last December, 140 boxes were changed after they were packed, and each one was unpacked by hand. (Theo, email 2026-09-26)
- The cutoff is 72 hours today. It is stored per box and shown on the "change my box" page. (Theo and Sam, meeting 2026-09-22)
- Each box gets its cutoff from one setting in the web app when the box is created. (Sam, in Theo's email 2026-09-26)

## Unknown
- Whether boxes created before 1 December keep the old 72-hour cutoff. Sam isn't sure.
- Whether "from 1 December" means boxes that ship from that date, or changes made from that date.

## Assumed
- Stockroom needs no code change, since it reads the same subscription data as the web app.

## Confidence
Low
Why: The change, the reason and the dates are clear, but no one knows if boxes that already exist pick up the new cutoff. If not, updating them is extra work.
How to raise it: Sam changes the setting in staging and checks the cutoff on a box created before the change.

## Estimate
4 to 12 hours
Basis: No one has sized it, so the range is wide. The range covers changing one setting twice and testing both switches in staging. It does not cover updating boxes that already exist. Stockroom 50% not included, since Stockroom is assumed unchanged.

## Questions before building
- Both switches fall inside the December freeze dates. Does the freeze cover this change?
- Should the switch on 1 December and back on 5 January happen on its own, or does someone do it by hand? Sam asked.
- At what time of day, and in which time zone, does each switch happen?
- If a subscriber has the "change my box" page open when the cutoff switches, which cutoff applies to their change?
- Support must be told about any change they will see. Who tells agents about the 96-hour cutoff before 1 December? (Conventions context file)

Before release: Tell support about the 96-hour holiday cutoff.
