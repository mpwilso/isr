Type: Recommendation

Bottom line: 2 verified, 3 to check by hand, 7 to confirm; the thing that matters most is whether a real sandbox start failure, not just the test example, gets the hint.

Not looked at: The build itself, since ISR reads only text, and the automated reviewer did not run the tests and could not see how the web card reads the extra lines, how the card shape checks work, or whether the hint is limited to cards for tasks that stopped on an error.

Next: Ask an engineer to size and set up the three checks by hand in a test environment.

# Acceptance script: Add a doctor hint to Parallax error cards when the sandbox won't start

## Already verified (2)
- When the error mentions namespaces or bwrap, the card also points to the user-namespace step in the WSL guide, and that step now has its own heading. Verified by: the build's card test for a namespace error and a check that the WSL guide holds the heading the hint names, among the 42 of 42 tests that passed. Criterion 2.
- Automated tests cover both cases: a namespace or bwrap error shows both pointers, and another sandbox start error shows only the parallax doctor line. Verified by: the two new card tests for those cases, among the 42 of 42 tests that passed. Criterion 5.

## Check by hand (3)

### 1. Hint on a real sandbox start failure
- Risk: High. Why: the hint is the whole change, and the build recognizes a sandbox failure from wording it only saw in a test example, so a real failure worded differently may get no hint.
- Needs: an engineer, a real build in a test environment, and a task that stops because the sandbox can't start, such as on Ubuntu 24.04 with user namespaces blocked; the engineer should size this before anyone commits to it.
- Steps:
  1. Ask the engineer to make a task stop because the sandbox can't start.
  2. Run parallax show for that task.
  3. Read the card's bottom line and the lines under it.
  4. If the engineer can produce a sandbox start failure with different wording, repeat steps 2 and 3 for it.
- Expect: each card has one or two lines telling you to run parallax doctor, and the bottom line still leads with the real problem, not the hint. The exact hint wording is not settled yet (see the second Confirm item).
- Covers: criterion 1 (a sandbox start failure card shows the doctor hint without hiding the real problem).

### 2. The web card matches and is otherwise unchanged
- Risk: Medium. Why: the tests found the hint in the web card, but nobody looked at how the extra lines look there, and the automated reviewer could not see how the web card reads them.
- Needs: an engineer, a real build in a test environment, and a task that stopped because the sandbox can't start, showing in the web view; the engineer should size this before anyone commits to it.
- Steps:
  1. Open that task's card in the web view.
  2. Compare its hint with what parallax show prints for the same task.
  3. Check the question text, the decision options and the default option against today's error card.
  4. Choose to retry, and let the same error repeat.
- Expect: the web card shows the same hint as parallax show, in readable lines; the question, options and default option are the same as today; and after the repeated error the task is dropped, as it is today. Whether the web card needed its own change is not settled yet (see the fourth Confirm item).
- Covers: criterion 4 (parallax show and the web card show the same hint, and the card's existing behavior stays the same).

### 3. Other errors get no hint
- Risk: Medium. Why: the build adds the hint to any error that mentions the word "namespace", which the automated reviewer flagged could put stray hints on errors that have nothing to do with the sandbox.
- Needs: an engineer, a real build in a test environment, one task stopped on an ordinary error that is not a sandbox start failure, and one stopped on an error from another tool that mentions a namespace; the engineer should confirm how to produce the second one and size this before anyone commits to it.
- Steps:
  1. Run parallax show for the ordinary error task.
  2. Open the same task's card in the web view.
  3. Repeat steps 1 and 2 for the task whose error mentions a namespace.
- Expect: both cards are the same as today, with no parallax doctor hint and no pointer to the WSL guide. Whether the build should match more tightly is not settled yet (see the fifth Confirm item).
- Covers: criterion 3 (an error that isn't a sandbox start failure gets no hint).

## Confirm (7, 5 shown)
- The build recognizes a sandbox start failure when the error text contains "sandbox runtime" or "srt:", or mentions bwrap or namespace, as its plan records. Is that the right way to recognize it? (the story asks this first; the build decided this)
- The build's hint lines read "Run parallax doctor to find the cause." and "For the user-namespace step, see "Allow user namespaces" in docs/wsl.md." Is that the wording you want? (asked in the story; the build decided this)
- The build named the new heading in the WSL guide "Allow user namespaces". Is that the right name? (criterion 2 leaves this open; the build decided this)
- The build made no change to the web card's own code, relying on the web card picking up the hint from the parallax show text. Is that acceptable, or should the web card get its own change? (criterion 4 leaves this open; the build decided this)
- The automated reviewer noted that matching the bare word "namespace" can add hints to unrelated errors, and suggested a tighter match such as "user namespace" or "create new namespace". Should the build tighten the match before release? (raised in the build record)

Not shown (2): should tasks that already stopped on a sandbox error show the hint too; is it safe to rely on the error text alone, so the way errors are recorded doesn't change
