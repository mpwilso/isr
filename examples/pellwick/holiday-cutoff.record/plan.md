Invented example for ISR. Pellwick, this task and its ledger ids are made up; no build ran.

Bottom line: Work out each box's cutoff from its ship date, 96 hours inside a holiday date range set in the config and 72 hours otherwise, so the switch happens on its own.
Not looked at: I did not read Stockroom. I did not check how staging gets boxes with December or January ship dates.

## Steps
1. `config/cutoff.toml`: add the holiday range, 1 December to 4 January, at 96 hours. The range ships with this change, so nobody sets or switches it by hand.
2. `web/boxes/cutoff.py`: add `cutoff_for(box)`. It returns 96 hours when the box ships inside the range, and 72 hours otherwise. It is worked out when the page opens, so a box created before 1 December that ships after it gets 96 hours.
3. `web/boxes/change_page.py`: show `cutoff_for(box)` and block changes inside it.
4. `tests/boxes/test_holiday_cutoff.py`: add the tests below, with a stand-in clock.

## Tests
- `test_cutoff_is_96_hours_for_a_box_shipping_in_december`
- `test_change_is_blocked_inside_96_hours`
- `test_a_box_created_in_november_that_ships_in_december_gets_96_hours`
- `test_cutoff_is_72_hours_from_5_january`
- `test_the_page_shows_the_cutoff`
- Two tests that read staging's own clock. They are skipped in the sandbox.
Then the full suite.

## Risks
- Stockroom reads the cutoff stored on each box, which this change no longer updates, so an agent may see 72 hours where the page shows 96. I haven't decided whether to keep writing the stored value as well.

```toml
files = ["config/cutoff.toml", "web/boxes/cutoff.py", "web/boxes/change_page.py", "tests/boxes/test_holiday_cutoff.py"]
tests = ["tests/boxes/test_holiday_cutoff.py"]
lines_changed = 90
domains = []
outside_reads = []
binaries = []
symlinks = []
dependencies = []
review_tightening = ""
estimated_cost_usd = 1.80
budget_cap_usd = 5.00
covers = { "1" = ["tests/boxes/test_holiday_cutoff.py"], "2" = ["tests/boxes/test_holiday_cutoff.py"], "3" = ["tests/boxes/test_holiday_cutoff.py"], "4" = ["tests/boxes/test_holiday_cutoff.py"], "5" = ["tests/boxes/test_holiday_cutoff.py"], "6" = ["tests/boxes/test_holiday_cutoff.py"], "7" = ["tests/boxes/test_holiday_cutoff.py"] }
user_flows = []
```
