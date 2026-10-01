Invented example for ISR. Pellwick and this task are made up; no build ran. This folder has no record.md: the build never reached its ready state.

Bottom line: Let subscribers skip their next box from their account before its cutoff, and write a note to the subscriber's history so agents can see the skip.
Not looked at: I did not read the billing job, so I can't say whether a box whose date moved is left out of charging. I did not look at how Stockroom shows history notes.

kind: feature
size: small
title: letting subscribers skip their next box
scope: web/account/, web/boxes/, tests/boxes/

## Problem

Subscribers can't skip a box themselves. They contact the Helpline, and an agent moves the box to the next regular delivery date by hand. Skips were the top Helpline reason in August.

The cutoff is already stored per box and shown on the "change my box" page, in `web/boxes/cutoff.py`. Agents write history notes through `web/boxes/history.py`, which the web app can also call.

## Outcome

1. asked: Before the next box's cutoff, a subscriber can skip it from their account, and it moves to the next regular delivery date.
2. asked: After the next box's cutoff has passed, the account offers no way to skip it.
3. asked: A skip writes a note to the subscriber's history saying the customer skipped the box.
4. inferred: After a skip, the page says "Your next box is skipped" and shows the new delivery date.
5. inferred: Tests in `tests/boxes/` cover each outcome above. The full test suite passes.

## Constraints

- Do not change the billing job. The story lists billing for a moved box as unknown, and payments changes are frozen from 1 December.
- Do not change Stockroom. The story assumes the web app can write the note on its own.
- Skip only the next box.
