# Writing rules

The checker catches some of these, not all.

## Where each criterion goes

Every acceptance criterion appears exactly once:

- **Already verified:** an automated check in the record covers it and passed. Write the outcome in business words, then "Verified by:" and what checked it, then "Criterion N."
- **Check by hand:** no automated check covered it, or covered only part of it. One check can cover several criteria; two checks never cover the same one.
- **Not covered:** neither, with the reason, like "Criterion 5: moved to Confirm, since the story does not say what should happen."

A check whose expected result the story does not define can't be run by hand. Ask it under Confirm instead, list the criterion under Not covered with "moved to Confirm", and set Type to Decision needed.

## Ranking checks

Rank by what goes wrong for customers or money if the behavior is wrong, then by whether any automated check touched it, then by how many unknowns attach to it. Risk is High, Medium or Low, highest first. No scores.

## Writing a check

- **Title:** a few words on what is checked.
- **Risk:** the level, then "Why:" and one clause.
- **Needs:** the account or data state the tester needs in place. When the check needs someone who can see billing, logs or staging data, Needs says "an engineer".
- **Steps:** at most five, numbered, one short sentence each.
- **Expect:** what the tester should see, as the story states it. When the story leaves a detail to confirm, say it is not settled yet and point to the Confirm item.
- **Covers:** the criterion numbers.

Use the story's own words for pages, systems and people. No file names, ticket ids, function names or code formatting. Use the test environment the story or record names, such as staging; if neither names one, write "a test environment".

## Confirm

Draw from "To confirm" details in the criteria, Unknown, Assumed, Questions before building, and outcomes the build inferred that the story never stated. Each item is a question for the business, ending with its source in parentheses.

- The same thing found in two places is one line that names both sources.
- An unknown that a check by hand will answer goes in that check's Why, not in Confirm.
- When the story has a First question line, the first Confirm item is that question, with "First question" in its source, like "(First question; Questions before building)". It uses one of the five slots.
- Then order the rest: questions that change what a check by hand should expect, then questions that only matter if a check fails, then everything else.

## Lists and counts

- Show at most five items in any list. Name the rest in one line under it: `Not shown (N): title; title`. In Already verified, Check by hand and Not covered, each hidden title names its criterion, like "skipping from the home page (criterion 6)".
- A heading's count includes hidden items. An empty list says "None." with a count of (0). Leave out Not covered when nothing lands there.
- The Bottom line gives the counts: "N verified, N to check by hand, N to confirm", plus ", N not covered" when that section is there.

## The four top lines

- **Type:** Recommendation, unless a check moved to Confirm or the build is not verified. Then Decision needed.
- **Bottom line:** one sentence, with the counts and the one thing that matters most.
- **Not looked at:** one sentence on what ISR could not see. Always the build itself, since ISR reads only text. Add a missing record, missing story sections, and gaps the record admits.
- **Next:** one action for the product owner. Name a person only if the story names them.

## Words

Plain words a product owner would use. No em dashes, en dashes or double hyphens used as dashes. No verdict fields: no pass, fail, status, result, checkbox or sign-off.
