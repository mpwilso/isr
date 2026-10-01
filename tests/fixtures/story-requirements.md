Call: Story written
Confidence: Medium, the pause itself is clear, but what agents see is not.
First question: What should an agent see in Stockroom when a subscriber has paused reminders?

# Let subscribers pause reminder emails

## The story
As a subscriber, I want to pause reminder emails from my account, so that I only hear from Pellwick when a box ships.

## Requirements
1. A subscriber can pause reminder emails from their account, and gets none until they turn them back on.
2. A subscriber who paused reminders still gets the shipping email when their next box ships.
3. An agent who opens a paused subscriber in Stockroom can tell. To confirm: what the agent sees, and where.

## Not included
- Pausing shipping emails. Priya decided they always go out. (invented test data)

## Known
- Reminder emails go out three days before each box ships. (invented test data)

## Unknown
- Whether a pause should end on its own after a set time.

## Assumed
- Stockroom can read the pause from the web app.

## Confidence
Medium
Why: The pause itself is clear, but what agents see is not.
How to raise it: Dana says what agents need to see.

## Estimate
4 to 8 hours
Basis: Invented test data.

## Questions before building
- What should an agent see in Stockroom when a subscriber has paused reminders?

Before release: None.
