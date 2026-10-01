Type: Recommendation
Bottom line: 1 verified, 3 to check by hand, 8 to confirm; the most important thing is that the build spots a sandbox start failure only by key words in the error text, and the automated reviewer found that any error mentioning "namespace" also gets the hint.
Not looked at: ISR did not see the build itself, the record says the automated reviewer did not run the tests or see how the web card reads the extra lines or how the card shape checks treat them, and nobody looked at what wording real sandbox start failures produce beyond the one example.
Next: Answer the first Confirm question on how a sandbox start failure should be recognized, then ask an engineer to size the three checks by hand.

# Acceptance script: Add a doctor hint to Parallax error cards when the sandbox won't start

## Already verified (1)
- Automated tests cover both cases: a namespace or bwrap error shows both pointers, and another sandbox start error shows only the parallax doctor line. Verified by: the build's automated tests, 42 of 42 passed. Criterion 5.

## Check by hand (3)

### 1. A real sandbox start failure shows the hint
- Risk: Medium. Why: the tests used a typed copy of the example error, so it is not known whether real sandbox start failures use wording the build recognizes.
- Needs: an engineer, and a test machine where the sandbox can't start because user namespaces are blocked, as the WSL guide describes for Ubuntu 24.04; the engineer should confirm how to set this up and size it before anyone commits to it.
- Steps:
  1. Ask the engineer to run a task on that machine so it stops because the sandbox won't start.
  2. Run parallax show for that task.
  3. Read the card's bottom line and the lines under the error.
  4. Follow the pointer to the WSL guide in the docs.
- Expect: the bottom line still leads with the real problem, and the card adds one or two lines: one says to run parallax doctor, and for a namespace or bwrap error one points to the user-namespace step, which has a heading you can find in the guide. The heading name and the exact wording are not settled yet; see the second and fourth Confirm items.
- Covers: criterion 1 (a sandbox start failure gets a one or two line doctor hint under the real problem) and criterion 2 (namespace or bwrap errors also point to a findable user-namespace step in the guide).

### 2. Other errors get no hint
- Risk: Medium. Why: a test showed one unrelated error gets no hint, but the automated reviewer found that any error mentioning "namespace", even from another tool, would get one.
- Needs: an engineer who can make a task stop on an error that is not a sandbox start failure; the engineer should confirm how and size it before anyone commits to it.
- Steps:
  1. Ask the engineer to make a task stop on an ordinary error unrelated to the sandbox.
  2. Run parallax show for that task and read the card.
  3. Ask the engineer to make a task stop on an unrelated error whose text mentions a namespace.
  4. Run parallax show for that task and read the card.
- Expect: both cards look as they do today, with no parallax doctor line and no pointer to the guide. If the second card shows a hint, see the fifth Confirm item.
- Covers: criterion 3 (errors that are not sandbox start failures get no hint).

### 3. The web card matches and the card's behavior is unchanged
- Risk: Low. Why: a browser test checked that the hint appears in the web card, but nobody looked at how the web view lays out the extra lines, and the automated reviewer could not confirm how it reads them.
- Needs: the task from check 1, stopped because the sandbox won't start, and access to the web view.
- Steps:
  1. Run parallax show for the task and note the hint lines.
  2. Open the same task's card in the web view.
  3. Compare the hint, question, options and default option with parallax show and with a card from before this change.
  4. Retry the task so the same error repeats.
- Expect: the web card shows the same hint as parallax show, laid out cleanly; the question, options and default option are the same as today; and the task is dropped after the repeated error, as it is today. Whether the web card needed its own change is not settled yet; see the third Confirm item.
- Covers: criterion 4 (parallax show and the web card show the same hint, and the card's options, question and retry behavior stay as they are).

## Confirm (8, 5 shown)
- The build treats an error as a sandbox start failure when its text contains "sandbox runtime", "srt:", "bwrap" or "namespace", so a failure worded any other way gets no hint; is that the right way to recognize it? (the story asks this first; the build decided this)
- The build named the new heading in the WSL guide "Allow user namespaces"; is that the name you want? (criterion 2 leaves this open; the build decided this)
- The build relies on the web card picking up the hint from the parallax show text and made no change to the web view itself; is that right, or does the web card need its own change? (criterion 4 leaves this open; the build decided this)
- The build's hint reads "Run parallax doctor to find the cause." and, for namespace or bwrap errors, "For the user-namespace step, see "Allow user namespaces" in docs/wsl.md."; is that the wording you want? (asked in the story; the build decided this)
- The automated reviewer suggested matching only "user namespace" or "create new namespace" so unrelated errors that mention a namespace get no hint; should the match be tightened before release? (raised in the build record)

Not shown (3): links that pointed at the old user-namespace step in the guide; whether tasks that stopped before this change show the hint; whether the error text alone is enough to spot a sandbox failure without changing what is logged
