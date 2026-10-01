Call: Story written
Confidence: Medium, the scope and behavior are clear, but how the web card and the card shape checks treat extra lines was not looked at.
First question: How should the code recognize a sandbox start failure, from the "sandbox runtime exited" wording or something else?

# Add a doctor hint to Parallax error cards when the sandbox won't start

## The story
As a Parallax user whose sandbox won't start, I want the error card to say to run `parallax doctor`, so that I can find the cause without guessing.

## Background
A task can stop because the sandbox never started, and the error card then gives no way to find the cause. (build request, 2026-10-01)
`parallax doctor` already checks the sandbox tools, and `docs/wsl.md` covers the unprivileged user namespaces that Ubuntu 24.04 blocks, but the card points to neither. (build request, 2026-10-01)

## Example
A task stops with the ledger reason `error: the sandbox runtime exited with code 1 (srt: bwrap: No permissions to create new namespace)`. (build request, 2026-10-01)
The card shows an "It stopped on an error" decision that leads with the first clause of that reason. (build request, 2026-10-01)

## Requirements
1. When a task stops because the sandbox can't start, its error card includes a hint to run `parallax doctor`. The hint takes one or two lines, and the bottom line still leads with the real problem.
2. If the error text mentions namespaces or bwrap, the hint also points to the user-namespace step in `docs/wsl.md`, and that step gets a findable heading or anchor. To confirm: the heading or anchor name.
3. An error that isn't a sandbox start failure gets no hint, so its card is unchanged.
4. `parallax show <task>` and the web card show the same hint. The card's options, default option, question text, retry-then-drop behavior and shape checks stay as they are. To confirm: whether the web card needs a change in `parallax/web/app.js`.
5. A test covers both cases: a namespace or bwrap error shows both pointers, and another sandbox start error shows only the `parallax doctor` line.

## Not included
- No new command line commands or flags. (build request, 2026-10-01)
- No change to the output of `parallax doctor` or to the doctor sample in the project's read-me file (README). (build request, 2026-10-01)

## Notes
- The hint's home is `parallax/decide.py` or `parallax/show.py`. That is a planning choice. (build request, 2026-10-01)
- The web card is parsed from the `parallax show` text, so it should pick up the hint without its own logic (`parallax/views.py:3`). (build request, 2026-10-01)
- The example error text and the retry-then-drop behavior appear in `tests/test_ui_browser.py:225` and `:227`. (build request, 2026-10-01)
- Files in scope: `parallax/decide.py`, `parallax/show.py`, `docs/wsl.md`, `tests/test_decide_and_redraft.py` and `tests/test_ui_browser.py`. (build request, 2026-10-01)

## Test scenarios
TEST SCENARIO: Hint on a sandbox start failure
HAPPY PATH: Namespace or bwrap error
WHEN a task stops with `error: the sandbox runtime exited with code 1 (srt: bwrap: No permissions to create new namespace)`
AND I run `parallax show` for that task
THEN the card tells me to run `parallax doctor` and points to the user-namespace step in `docs/wsl.md`, in one or two lines. To confirm: the exact wording.
UNHAPPY PATH: Sandbox start error without namespace or bwrap text
WHEN a task stops because the sandbox can't start and the error text doesn't mention namespaces or bwrap
AND I run `parallax show` for that task
THEN the card tells me to run `parallax doctor` and shows no pointer to `docs/wsl.md`

TEST SCENARIO: No hint for other errors
HAPPY PATH: Error that isn't a sandbox start failure
WHEN a task stops on an error that is not a sandbox start failure
AND I run `parallax show` for that task
THEN the card is the same as it is today, with no hint
UNHAPPY PATH: Hint must not replace the real problem
WHEN a sandbox start failure card is shown
AND I read the bottom line
THEN it leads with the real problem, not the hint

TEST SCENARIO: The web card matches
HAPPY PATH: Sandbox start failure in the web card
WHEN a task stopped because the sandbox can't start
AND I open its card in the web view
THEN it shows the same hint as `parallax show`. To confirm: whether `parallax/web/app.js` needs a change.
UNHAPPY PATH: Other error in the web card
WHEN a task stopped on an error that is not a sandbox start failure
AND I open its card in the web view
THEN it shows no hint

TEST SCENARIO: Existing card behavior is unchanged
HAPPY PATH: Options and question stay put
WHEN a sandbox start failure card is shown
THEN the question text, the decision options and the default option are the same as today
AND the card passes the shape checks in `parallax/lint.py`
UNHAPPY PATH: Repeated error
WHEN the same error repeats after a retry
THEN the task is dropped, as it is today

TEST SCENARIO: The docs pointer lands somewhere
HAPPY PATH: Following the pointer
WHEN I open `docs/wsl.md` from the card's pointer
THEN I find a heading or anchor for the user-namespace step. To confirm: the heading or anchor name.
UNHAPPY PATH: Step renamed or removed
WHEN the user-namespace step in `docs/wsl.md` loses its heading or anchor
THEN the card's pointer would name something that doesn't exist. To confirm: whether a test should catch this.

## Known
- A task can stop because the sandbox never started. The ledger reason then looks like `error: the sandbox runtime exited with code 1 (srt: bwrap: No permissions to create new namespace)`. (build request, 2026-10-01, citing `tests/test_ui_browser.py:227`)
- The card turns that reason into an "It stopped on an error" decision and leads with the first clause of the reason. (build request, 2026-10-01, citing `parallax/decide.py:154` and `parallax/show.py:167`)
- `parallax doctor` already checks the sandbox tools, and `docs/wsl.md:16` covers the unprivileged user namespaces that Ubuntu 24.04 blocks. (build request, 2026-10-01, citing `parallax/doctor.py:87`)
- `docs/wsl.md` has no heading for the user-namespace step. It is item 4 under "Make the distro". (build request, 2026-10-01)
- The message that names `parallax doctor` today is the missing-key error. (build request, 2026-10-01, citing `parallax/approvals.py:31`)

## Unknown
- How the code tells a sandbox start failure from other errors. The request gives one example reason only.
- Whether the web card renders extra detail lines as they are. The request did not look at `parallax/web/app.js`.
- How `parallax/lint.py` shapes cards, and whether one or two extra lines pass. The request did not look at it.
- Whether the existing tests already cover the `parallax show` text.
- The hint's exact wording.

## Assumed
- The ledger reason text is enough to recognize a sandbox start failure and a namespace or bwrap mention, so the ledger format doesn't change.

## Confidence
Medium
Why: The scope, files and behavior are clear, but how the web card and the card shape checks treat extra lines was not looked at.
How to raise it: Check `parallax/web/app.js` and `parallax/lint.py`, and confirm how a sandbox start failure is recognized.

## Estimate
3 to 8 hours
Basis: The request sizes the work as small but gives no hours, so this range is a guess for a developer who knows the system. No team estimating rules were given, so none are included.

## Questions before building
- How should the code recognize a sandbox start failure, from the "sandbox runtime exited" wording or something else?
- Does the web card show extra detail lines as they are, or does `parallax/web/app.js` need a change?
- Does `parallax/lint.py` allow one or two extra lines on an error card?
- What exact wording should the two hint lines use?
- Should tasks that already stopped on a sandbox error show the hint too, if the card is built when it is shown?

Before release: None.
