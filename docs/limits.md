# Limits

What ISR has and has not shown, from the runs in [the run log](run-log.md). The README keeps the ones a visitor needs most.

- Checks by hand have been run on one change, e3108e. They found a regression, but not every check could be finished: one would have stopped at an earlier screen, and half of another had nothing real to test against: [the story-first run](run-log.md#the-first-story-first-run-on-a-real-parallax-change-e3108e-2026-10-05).
- Tested in Claude Code, nowhere else.
- Loupe bug reports have no criteria section, so ISR calls them not ready.
- The runner's mapper can keep most criteria out of Already verified when a plan names broad risks. On 40171b it blocked 4 of 5, and a review of each link found the blocking earned: [judging the mapper's links](run-log.md#judging-the-mappers-links-on-40171b-2026-10-05). It has not been judged on any other story.
- The review, results and lesson files (steps 5 to 7) have been tried on invented examples, not yet with a real person, and no live model run has written one. The tests check their shapes and the links between them, not whether ISR writes them well.
  - A live check, not yet run: a person reviews a real script, runs its checks by hand and tells ISR what they did and saw; ISR writes the review, the results and a lesson for any check that did not match; then the person picks a class without seeing ISR's, and the two are compared.
- The checker can't tell whether a script changed after its review, or whether evidence exists and shows what the tester says. It checks that evidence reads as links or file paths.
- Not shown yet: use by a team, or a time saving. Those need real users.
