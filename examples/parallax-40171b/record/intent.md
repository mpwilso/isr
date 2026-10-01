Bottom line: When a task stops because the sandbox can't start, its error card will add one or two lines that say to run `parallax doctor` and, for namespace or bwrap errors, to see the user-namespace step in `docs/wsl.md`.
Not looked at: how the web card renders extra detail lines in `parallax/web/app.js`, how `parallax/lint.py` shapes cards, and whether the existing tests cover the `parallax show` text; the hint's exact home (`parallax/decide.py` or `parallax/show.py`) is a planning choice.

kind: feature
size: small
title: adding a doctor hint to sandbox-start error cards
scope: parallax/decide.py, parallax/show.py, docs/wsl.md, tests/test_decide_and_redraft.py, tests/test_ui_browser.py

## Problem
A task can stop because the sandbox never started. The ledger reason then reads like `error: the sandbox runtime exited with code 1 (srt: bwrap: No permissions to create new namespace)`, as in `tests/test_ui_browser.py:227`. The card turns that into an "It stopped on an error" decision (`parallax/decide.py:154`) and leads with the first clause of the reason (`parallax/show.py:167`). Nothing on the card says how to find the cause. `parallax doctor` already checks the sandbox tools (`parallax/doctor.py:87`), and `docs/wsl.md:16` covers the unprivileged user namespaces that Ubuntu 24.04 blocks. The card doesn't point to either. The message that does name `parallax doctor` today is the missing-key error (`parallax/approvals.py:31`).

`docs/wsl.md` has no heading for the user-namespace step. It is item 4 under "Make the distro".

## Outcome
1. asked: When a task fails because the sandbox can't start, its error card includes a hint to run `parallax doctor`.
2. asked: If the error text mentions namespaces or bwrap, the hint also points to the user-namespace step in `docs/wsl.md`.
3. asked: The hint takes one or two lines on the card.
4. inferred: An error that isn't a sandbox start failure gets no hint, so the card is unchanged for it.
5. inferred: The same hint shows in `parallax show <task>` and in the web card, since the web card is parsed from the `parallax show` text (`parallax/views.py:3`).
6. inferred: `docs/wsl.md` has a findable anchor or heading for the user-namespace step, so the card's pointer names something that exists.
7. inferred: A test covers both cases: a namespace or bwrap error shows both pointers, and another sandbox start error shows only the `parallax doctor` line.

## Constraints
- The decision options, the default option, and the question text for the error card stay as they are (`parallax/decide.py:154`).
- The card's bottom line keeps leading with the real problem, not with the hint (`parallax/show.py:185`).
- The retry-then-drop behavior after a repeated error is unchanged (`tests/test_ui_browser.py:225`).
- `parallax doctor`'s output and the README's doctor sample don't change.
- No new CLI commands or flags.
- Card output still passes the existing shape checks in `parallax/lint.py`.
