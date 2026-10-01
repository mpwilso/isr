Call: Story written
Confidence: Medium, the pause itself is clear, but what agents see is not.
First question: What should an agent see in Stockroom when a subscriber has paused reminders?

# Let subscribers pause reminder emails

## The story
As a subscriber, I want to pause reminder emails from my account, so that I only hear from Pellwick when a box ships.

## Acceptance criteria
- Given I have reminder emails on, when I pause them from my account, then I get no reminder emails until I turn them back on.
- Given I paused reminders, when my next box ships, then I still get the shipping email.
- Given a subscriber paused reminders, when an agent opens them in Stockroom, then the agent can tell. To confirm: what the agent sees, and where.

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
