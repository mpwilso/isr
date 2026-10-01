Type: Decision needed
Bottom line: 1 verified, 2 to check by hand, 2 to confirm; what agents see for a paused subscriber is not defined yet.
Not looked at: the build itself, since ISR read only the story and the build record.
Next: Decide what agents should see for a paused subscriber, then give check 1 to a tester.

# Acceptance script: Let subscribers pause reminder emails

## Already verified (1)
- A subscriber who pauses reminders gets no reminder emails until they turn them back on. Verified by: the build's automated tests, 6 of 6 passing. Criterion 1.

## Check by hand (2)

### 1. Shipping emails still arrive
- Risk: Low. Why: a subscriber who misses a shipping email contacts the Helpline, and no automated check covered it.
- Needs: a subscriber in staging with reminders paused and a box about to ship.
- Steps:
  1. Let the subscriber's next box ship in staging.
  2. Open the subscriber's inbox.
- Expect: the shipping email arrives.
- Covers: criterion 2.

### 2. What agents see
- Risk: High. Why: agents answer subscribers from Stockroom.
- Needs: a subscriber in staging with reminders paused.
- Steps:
  1. Open the subscriber in Stockroom as an agent.
- Expect: the agent can tell reminders are paused.
- Covers: criterion 3.

## Confirm (2)
- What should an agent see in Stockroom when a subscriber has paused reminders, and where? (First question; criterion 3; Questions before building)
- Should a pause end on its own after a set time? (Unknown)
