Call: Story written
Confidence: Medium, who, what, where and the cutoff are clear, but billing for a moved box is untested.
First question: Does skipping count as a payments change under the December freeze, since it affects charging?

# Let subscribers skip their next box from their account

## The story
As a subscriber, I want to skip my next box from my account, so that I don't pay for refills I don't need yet or wait on support.

## Acceptance criteria
- Given my next box's cutoff, 72 hours before the ship date today, has not passed, when I skip it, then it moves to the next regular delivery date. To confirm: whether and how the page shows the new date.
- Given my next box's cutoff has passed, when I open my account, then I can't skip it. To confirm: what the page shows instead.
- Given I skipped my next box, when its original ship date passes, then I am not charged for it.
- Given a subscriber skipped a box, when an agent opens them in Stockroom, then the history shows a note that the customer skipped it. To confirm: the exact wording (Dana suggested "Skipped by customer") and whether it shows the date and time.

## Not included
- Skipping any box other than the next one. Priya decided on the next box only for now. (meeting 2026-09-22)

## Known
- Skips were the top Helpline reason in August: 610 of 4,100 tickets, about three minutes of agent time each. Customers who cancel to avoid a box are lost about half the time. (Dana, meeting 2026-09-22)
- No box can change within 72 hours of its ship date. The cutoff is stored per box and already shown on the "change my box" page. (Theo and Sam, meeting 2026-09-22)
- Scope is the next box only. A skip moves it to the next regular delivery date, the same as agents do today. (Priya and Dana, meeting 2026-09-22)
- Subscribers are charged on the ship date. (Sam, meeting 2026-09-22)
- This must ship before the December freeze: no risky changes to checkout or payments from 1 December to 5 January. (Priya, meeting 2026-09-22; dates from the planning email, Priya Raman, 2026-09-18, via the Priorities context file)

## Unknown
- Whether the billing job leaves out a box whose date moved. Sam has not checked yet.
- What happens if the box's cutoff passes while the subscriber has the page open.
- Whether a subscriber can also skip the box after one they already skipped.
- Where skipping sits: the account home page, the "change my box" page, or both.
- Whether a subscriber can skip a box whose payment has already failed.

## Assumed
- The web app can write the "Skipped by customer" note, so Stockroom needs no code change.

## Confidence
Medium
Why: Who, what, where and the cutoff are clear, but billing for a moved box is untested.
How to raise it: Sam skips a box in staging and confirms the billing job does not charge it.

## Estimate
12 to 20 hours
Basis: Sam said "a couple of days if billing behaves" in the meeting on 2026-09-22, read here as two working days. It assumes billing needs no change, and it does not include undo. Stockroom 50% not included, since Stockroom is assumed unchanged.

## Questions before building
- Does skipping count as a payments change under the December freeze, since it affects charging?
- Can a subscriber undo a skip before the cutoff? Dana wants it, Sam says it adds work, and no one decided.
- If billing does charge a skipped box, is fixing that part of this story or a separate one?
- Which system decides the "next regular delivery date"? The web app and Stockroom sometimes disagree. (Priorities context file)
- Is any change to the box's cutoff, 72 hours today, planned while skipping is live?
More open questions than fit here. Consider a spike first.

Before release: Tell support that subscribers can skip online and how skips show in Stockroom.
