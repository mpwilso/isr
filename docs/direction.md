# ISR: direction

ISR prepares acceptance. From the story and what the build already proved, it writes a short acceptance script, so the people accepting a change check only what a person needs to. Tracing failures back to the story after release is a later idea and is not built.

It is not a test management tool, a test runner or an incident tool. Teams keep theirs. ISR's script is plain Markdown that can be pasted into whatever they already use.

## Who it's for

Product owners and the business people who accept changes. Engineering leads read its failure analysis. Anyone should get the gist of a report in 30 seconds.

## Version 1: acceptance readiness

ISR is a skill that runs in Claude Code. It writes a script, and the review, results and lesson files that follow it, and nothing more; it does not drive a browser or touch any environment.

1. Reads the story, as a Markdown file or pasted text. It looks for the acceptance criteria, what is known, unknown and assumed, what is not included, the open questions, and any detail the story marks as needing confirmation. If a story lacks one of these, the script says so. If the story is too thin to build from, ISR says that and writes no script.
2. Reads the build's record (what changed, what automated checks verified, and what nothing checked) from a task folder, or from pasted text. With no record, everything counts as not checked, and the script says so. Built since: with a Polarizer ledger from the run, ISR verifies its hash chain and names the tool calls the agents made through Polarizer, which ran and which were held, denied or refused, and the paths and hosts it names, so the person accepting knows where to look. Tried on Polarizer's test ledgers, not yet on a real run.
3. Writes one acceptance script in plain business language:
   - Already verified automatically: listed, not repeated.
   - Check by hand: only what no automated check covered, ranked by risk, each with what the tester needs in place, a few short steps and the expected result.
   - Confirm: guessed details, unknowns and assumptions from the story, and anything the build inferred that the story never stated.
4. Every acceptance criterion in the story appears exactly once: verified, by hand, or named as not covered. When a list runs past five items, the script shows the top five and names the rest.
5. A person reviews the script before anyone uses it. Built: a review file beside the script says who reviewed it, when, what they changed and whether they approved it for use. It is about the script, never the change, and the script's shape is unchanged.
6. Records each result with evidence, traced to the story. Built: a results file holds, for each check by hand, who ran it and when, what they did, what they saw, evidence links or file paths, and what the tester says, in one of four fixed phrases. Every criterion in the story is accounted for. ISR writes down what the person reports and never decides pass or fail.
7. Classifies a failed check as a build mistake, a requirements gap or a wrong assumption, and says where the lesson should go: a new eval case for the build tool, or the story tool's team context. Built: a lesson file for each check the tester said did not match. ISR proposes the class with its reasons and labels it a proposal; a person picks. It holds one entry in the format of Parallax's eval cases or Loupe's learned file, which the person carries over by hand.

Steps 5 to 7 have their shapes in `skill/spec/` and the same checker, and have been tried on invented examples, not yet with a real person.

It prepares acceptance. It never passes it; a person always makes that call.

## Later: after release (not built)

Take a production failure, with its root cause from the team's incident tools, trace it to the change and the story, and classify it the same three ways. Blameless, and facts kept apart from inferences and unknowns. Not designed yet; it needs real failures to design against.

## The report, always in this shape

Type, Bottom line, Not looked at, Next; then what was verified, what to check by hand, what to confirm, and what was found; with a ledger, the tool calls in it. At most five items in any list. Plain words. No em dashes.

## Never

- Pass acceptance on anyone's behalf.
- Run tests, start an app, open a browser or touch any environment, production included.
- Blame a person. Findings describe conditions and gaps.
- State a guess as a fact. Unknowns stay unknown.
- Keep secrets, credentials or customer data.

## How we'll know it works

- Time a product owner spends on acceptance per change, before and after.
- Acceptance checks that pass the first time.
- Failures found after acceptance that the script should have covered. The goal is zero.
- How often the story's assumptions held.

## Milestones

M1 and M2 are built; M2 has not yet been tried with a real person. M3 to M5 are not built: a lesson is carried over by hand. The README's Limits say what has been shown so far and what has not.

M1 The acceptance script, from a story and a build record, with the report shape and a checker.
M2 Recording results with evidence, and classifying failures.
M3 Feeding lessons back to the story tool and the build tool.
M4 After-release failure analysis.
M5 Suite-wide measures.
