Bottom line: A sandbox-start error card gets one or two hint lines, one naming `parallax doctor` and, for namespace or bwrap errors, one pointing to a new heading in `docs/wsl.md`.
Not looked at: how the web card renders extra detail lines in `parallax/web/app.js`, how `parallax/lint.py` shapes cards (the new lines may need a citation to pass its checks), what text other sandbox start failures produce (the wording `sandbox runtime exited` is not in the source, so it likely comes from the agent runtime), and whether existing tests cover the `parallax show` text.

## Steps
1. `parallax/decide.py`: add `sandbox_hint(why: str) -> list[str]`, next to `decision`.
   - It returns `[]` unless the lowercased reason contains `sandbox runtime` or `srt:`, or mentions `bwrap` or `namespace`.
   - Otherwise line one is `Run parallax doctor to find the cause.`
   - If the reason mentions `namespace` or `bwrap`, it adds a second line: `For the user-namespace step, see "Allow user namespaces" in docs/wsl.md.`
   - `decision()`, its options, its default and its question text stay as they are.
2. `parallax/show.py`: in `_decision`, when `dec.kind == "error"` and `dec.item` is set, insert `decide.sandbox_hint(why)` into `found` right after the reason line.
   - Each hint line carries the same `(ledger id)` cite as the reason line, in case `lint` needs one.
   - `bottom` is untouched, so it still leads with `lead(why)`.
   - `show.py` already imports `decide`, so there is no new import.
3. `docs/wsl.md`: give the user-namespace step a findable anchor.
   - Item 4 under "Make the distro" is a run-on step. Split the namespace sentence into a short item named "Allow user namespaces", or add a `### Allow user namespaces` heading below the list.
   - The text says what Ubuntu 24.04 blocks and points to the README's step 1 `sysctl` line.
   - The doctor and README samples stay unchanged.
4. `tests/test_decide_and_redraft.py`: add the new tests listed below.
5. `tests/test_ui_browser.py`: extend the sandbox error case near line 227 to assert the hint shows in `#card`, and that the bottom line is unchanged. Keep the retry-then-drop assertions.

## Tests
New, in `tests/test_decide_and_redraft.py`:
- `test_sandbox_error_card_points_to_doctor_and_the_namespace_step`:
  - Raise a `stuck.raised` with `error: the sandbox runtime exited with code 1 (srt: bwrap: No permissions to create new namespace)` and `data error=True`.
  - Assert the card holds both hints and passes `lints`.
  - Assert the decision kind, options, recommend and question are unchanged, and that the bottom line starts `Needs you: The sandbox runtime exited`.
- `test_other_sandbox_start_error_gets_only_the_doctor_line`: a reason such as `error: the sandbox runtime exited with code 2 (srt: not found)` shows the doctor line and no `docs/wsl.md` line.
- `test_unrelated_error_card_has_no_hint`: a reason such as `error: the agent crashed` gives a card with no `parallax doctor` text.
- A check that `docs/wsl.md` contains the heading the hint names.

Existing, which must still pass:
- `test_every_kind_of_decision_is_one_lint_clean_question`.
- `tests/test_ui_browser.py` (the extended case), for the web card.
- The lint and README doctor-sample tests.

## Risks
- Detection works on free text, so a sandbox start failure worded differently gets no hint. Matching too loosely could hint on unrelated errors.
- `lint.shaped` may reject or reword the extra lines. If so, I'll adjust the line shape rather than the lint rules.
- The web card may render the added lines oddly. `app.js` was not read.
- Changing item 4 in `docs/wsl.md` could break a test or link that points at it.

```toml
files = ["parallax/decide.py", "parallax/show.py", "docs/wsl.md", "tests/test_decide_and_redraft.py", "tests/test_ui_browser.py"]
tests = ["tests/test_decide_and_redraft.py", "tests/test_ui_browser.py"]
lines_changed = 70
domains = []
outside_reads = []
binaries = []
symlinks = []
dependencies = []
review_tightening = ""
estimated_cost_usd = 1.00
budget_cap_usd = 2.80
covers = { "1" = ["tests/test_decide_and_redraft.py"], "2" = ["tests/test_decide_and_redraft.py"], "3" = ["tests/test_decide_and_redraft.py"], "4" = ["tests/test_decide_and_redraft.py"], "5" = ["tests/test_ui_browser.py", "tests/test_decide_and_redraft.py"], "6" = ["tests/test_decide_and_redraft.py"], "7" = ["tests/test_decide_and_redraft.py"] }
user_flows = []
```
