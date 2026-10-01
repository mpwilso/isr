Invented example for ISR. Pellwick and this task are made up; no build ran. This folder has no record.md: the build never reached its ready state.

Bottom line: Add a skip action for the next box to the account page, block it once the box's cutoff passes, move the box to the next regular delivery date, and write the history note through the existing helper.
Not looked at: I did not read the billing job or Stockroom. I did not check which system decides the next regular delivery date when the web app and Stockroom disagree.

## Steps
1. `web/boxes/skip.py`: add `skip_next_box(subscriber)`. It refuses once `cutoff_passed(box)` is true, and otherwise moves the box to `next_regular_date(subscriber)`.
2. `web/account/views.py`: add the skip button for the next box, hidden once the cutoff has passed. After a skip, show "Your next box is skipped" and the new delivery date.
3. `web/boxes/history.py`: call `add_note(subscriber, "Skipped by customer")` after a skip.
4. `tests/boxes/`: add the tests below.

## Tests
- `test_skip_moves_the_next_box_to_the_next_regular_date`
- `test_no_skip_once_the_cutoff_has_passed`
- `test_a_skip_writes_a_history_note`
- `test_the_page_confirms_the_skip_and_shows_the_new_date`
Then the full suite.

## Risks
- The web app and Stockroom sometimes disagree on the next regular delivery date. The skip uses the web app's date.
- The note is written through the same helper agents use, but nothing here reads it back in Stockroom.

```toml
files = ["web/boxes/skip.py", "web/account/views.py", "web/boxes/history.py", "tests/boxes/test_skip.py", "tests/boxes/test_history_note.py"]
tests = ["tests/boxes/test_skip.py", "tests/boxes/test_history_note.py"]
lines_changed = 140
domains = []
outside_reads = []
binaries = []
symlinks = []
dependencies = []
review_tightening = ""
estimated_cost_usd = 2.20
budget_cap_usd = 5.00
covers = { "1" = ["tests/boxes/test_skip.py"], "2" = ["tests/boxes/test_skip.py"], "3" = ["tests/boxes/test_history_note.py"], "4" = ["tests/boxes/test_skip.py"], "5" = ["tests/boxes/test_skip.py", "tests/boxes/test_history_note.py"] }
user_flows = []
```
