Type: Decision needed

Bottom line: Dana reported that check 2, the skip note in Stockroom, did not match what the script expects; ISR proposes a wrong assumption, so the lesson would go to the story tool's team context.

Not looked at: the build itself and Stockroom, since ISR read only the story, the script, the build record and the results.

Next: Priya picks the class, then carries the entry below into Loupe's team context by hand.

# Lesson: The skip note in Stockroom

- Results: skip-a-box.results.md, check 2.
- Covers: criterion 4 (a skip note in Stockroom).
- Tester saw: the history showed no note about the skip, though the web app's own notes page for that subscriber listed "Skipped by customer".
- Class proposed by ISR: wrong assumption. This is a proposal, not a finding.
- Class picked by a person: not picked yet.
- Lesson goes to: the story tool's team context (Loupe's learned.md).

## Why ISR proposes this (3)
- The story takes it that the web app can write the note, so Stockroom needs no change. (the story assumes this)
- The build wrote the note through the helper agents use, and its plan says nothing read it back in Stockroom. (the build decided this)
- The note was on the web app's notes page but not in Stockroom's history. (the tester reported this)

## Carry over by hand
```
- A note the web app writes to a subscriber's history does not show in Stockroom, so agents can't see it without a Stockroom change.
  kind: fact
  source: Dana Ruiz, hand check on skip-a-box, 2026-10-09
```
