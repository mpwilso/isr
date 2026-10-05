Type: Decision needed

Bottom line: 1 verified, 1 to check by hand, 2 to confirm, 1 not covered; what agents see for a paused subscriber is not defined yet.

Not looked at: the build itself, since ISR read only the story and the build record, which shows only the plan's tests, not the full suite.

Next: Decide what agents should see for a paused subscriber, then give check 1 to a tester.

# Acceptance script: Let subscribers pause reminder emails

## Already verified (1)
- A subscriber who pauses reminders gets no reminder emails until they turn them back on. Verified by: the build's automated tests, 6 of 6 passing. Criterion 1.

## Check by hand (1)

### 1. Shipping emails still arrive
- Risk: Medium. Why: a subscriber who misses a shipping email contacts the Helpline, and no automated check covered it.
- Needs: a subscriber in staging with reminders paused and a box about to ship.
- Steps:
  1. Let the subscriber's next box ship in staging.
  2. Open the subscriber's inbox.
  3. Find the email.
  4. Open it.
  5. Read it.
  6. Close it.
- Expect: the shipping email arrives.
- Covers: criterion 2 (shipping emails still arrive).

## Confirm (2)
- What should an agent see in Stockroom when a subscriber has paused reminders, and where? (the story asks this first; criterion 3 leaves this open)
- Should a pause end on its own after a set time? (open in the story)

## Not covered (1)
- Criterion 3: moved to Confirm, since the story does not say what an agent should see.
