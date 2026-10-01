Invented example for ISR. Pellwick, this task and its ledger ids are made up; no build ran.

Bottom line: Give boxes that ship from 1 December to 4 January a cutoff of 96 hours before the ship date, and 72 hours again from 5 January, switching on its own.
Not looked at: I did not read Stockroom. I did not check how staging gets boxes with December or January ship dates.

kind: change
size: small
title: moving the box cutoff to 96 hours over the holidays
scope: config/, web/boxes/, tests/boxes/

## Problem

Each box gets its cutoff from one setting, 72 hours, when the box is created, in `web/boxes/cutoff.py`. The warehouse needs 96 hours over the holidays.

## Outcome

1. asked: A box that ships from 1 December to 4 January has a cutoff of 96 hours before its ship date, and the "change my box" page shows it.
2. asked: A change to a box inside its cutoff is blocked.
3. asked: A box that ships on or after 5 January has a cutoff of 72 hours again.
4. inferred: "From 1 December" means boxes that ship from 1 December, not changes made from that date.
5. inferred: A box created before 1 December that ships after it gets 96 hours, because the cutoff is now worked out from the ship date when the page opens.
6. inferred: The switch to 96 hours and back happens on its own, from a date range in the config. No one switches it by hand.
7. inferred: Tests in `tests/boxes/` cover each outcome above, with a stand-in clock.

## Constraints

- Do not change Stockroom. The story assumes it reads the same subscription data.
- Do not touch checkout or payments.
