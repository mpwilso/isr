# Limits

What ISR has and has not shown, from the runs in [the run log](run-log.md). The README keeps the ones a visitor needs most.

- Checks by hand have been run on one change, e3108e. They found a regression, but not every check could be finished: one would have stopped at an earlier screen, and half of another had nothing real to test against: [the story-first run](run-log.md#the-first-story-first-run-on-a-real-parallax-change-e3108e-2026-10-05).
- Tested in Claude Code, nowhere else.
- Loupe bug reports have no criteria section, so ISR calls them not ready.
- The runner's mapper can keep most criteria out of Already verified when a plan names broad risks. On 40171b it blocked 4 of 5, and a review of each link found the blocking earned: [judging the mapper's links](run-log.md#judging-the-mappers-links-on-40171b-2026-10-05). It has not been judged on any other story.
- The review, results and lesson files (steps 5 to 7) have been tried on invented examples, not yet with a real person, and no live model run has written one. The tests check their shapes and the links between them, not whether ISR writes them well.
  - A live check, not yet run: a person reviews a real script, runs its checks by hand and tells ISR what they did and saw; ISR writes the review, the results and a lesson for any check that did not match; then the person picks a class without seeing ISR's, and the two are compared.
- The checker can't tell whether a script changed after its review, or whether evidence exists and shows what the tester says. It checks that evidence reads as links or file paths.
- The ledger section (tool calls the agents made through Polarizer) has been tried on Polarizer's conformance ledgers, copied at Polarizer commit 700498a, and on invented ledgers. No real Parallax run through Polarizer has been read yet, and no live model run has written a script with the section.
  - ISR's verifier matches Polarizer's status, line and seq on every version 1 conformance ledger. It does not read version 0, Parallax's own ledger format, and does not check a checkpoint, so a ledger cut short together with its head file still reads as intact.
  - The ledger names paths and hosts in the reasons for held calls, and nowhere else. For a call that ran without a hold, it keeps a commitment to the arguments, and ISR does not open the argument files, which can hold secrets. So "where to look" is partial for calls that ran freely.
  - ISR names every call in the ledger it is given. It can't tell which calls belong to this change, so the ledger should be the run's own.
  - Paths and hosts are read from hold reasons by fixed patterns from Polarizer's specs at 700498a. A path that itself holds one of those phrases may be cut short, and a later change to the wording would be read wrongly or not at all.
  - Holds Polarizer revealed as planted test calls are left out. One with no reveal yet is counted as one that may be planted.
  - The runner does not pass a ledger yet; the skill and the checker take one.
- Not shown yet: use by a team, or a time saving. Those need real users.
