# ISR: direction

ISR is reconnaissance before and after release. Before release, it turns what the story asked and what the build already proved into a short acceptance script, so the people accepting a change check only what a person needs to. After release, it traces failures back to the story and says whether the code, the requirement or an assumption was wrong.

ISR here means intelligence, surveillance and reconnaissance, not Incremental Static Regeneration.

It is not a test management tool, a test runner or an incident tool. Teams keep theirs. ISR's script is plain Markdown that can be pasted into whatever they already use.

## Who it's for

Product owners and the business people who accept changes. Engineering leads read its failure analysis. Anyone should get the gist of a report in 30 seconds.

## Version 1: acceptance readiness

ISR is a skill that runs in Claude Code. It writes a script and nothing more; it does not drive a browser or touch any environment.

1. Reads the story, as a Markdown file or pasted text. It looks for the acceptance criteria, what is known, unknown and assumed, what is not included, the open questions, and any detail the story marks as needing confirmation. If a story lacks one of these, the script says so. If the story is too thin to build from, ISR says that and writes no script.
2. Reads the build's record (what changed, what automated checks verified, and what nothing checked) from a task folder, or from pasted text. With no record, everything counts as not checked, and the script says so.
3. Writes one acceptance script in plain business language:
   - Already verified automatically: listed, not repeated.
   - Check by hand: only what no automated check covered, ranked by risk, each with what the tester needs in place, a few short steps and the expected result.
   - Confirm: guessed details, unknowns and assumptions from the story, and anything the build inferred that the story never stated.
4. Every acceptance criterion in the story appears exactly once: verified, by hand, or named as not covered. When a list runs past five items, the script shows the top five and names the rest.
5. A person reviews the script before anyone uses it.
6. Records each result with evidence, traced to the story.
7. Classifies a failed check as a build mistake, a requirements gap or a wrong assumption, and says where the lesson should go: a new eval case for the build tool, or the story tool's team context.

It prepares acceptance. It never passes it; a person always makes that call.

## Later: after release

Take a production failure, with its root cause from the team's incident tools, trace it to the change and the story, and classify it the same three ways. Blameless, and facts kept apart from inferences and unknowns. Not designed yet; it needs real failures to design against.

## The report, always in this shape

Type, Bottom line, Not looked at, Next; then what was verified, what to check by hand, what to confirm, and what was found. At most five items in any list. Plain words. No em dashes.

## Never

- Pass acceptance on anyone's behalf.
- Touch production. Read-only, lower environments for anything it runs.
- Blame a person. Findings describe conditions and gaps.
- State a guess as a fact. Unknowns stay unknown.
- Keep secrets, credentials or customer data.

## How we'll know it works

- Time a product owner spends on acceptance per change, before and after.
- Acceptance checks that pass the first time.
- Failures found after acceptance that the script should have covered. The goal is zero.
- How often the story's assumptions held.

## Milestones

M1 The acceptance script, from a story and a build record, with the report shape and a checker.
M2 Recording results with evidence, and classifying failures.
M3 Feeding lessons back to the story tool and the build tool.
M4 After-release failure analysis.
M5 Suite-wide measures.
