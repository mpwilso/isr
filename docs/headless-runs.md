# Headless runs

A run with `claude -p` can't answer a permission prompt, so a denied step ends the run. The first headless run did that: it was denied the skill files and `mktemp`, and returned a script marked "Not checked" (run log, "Plain words for readers"). These flags give ISR what its steps use and nothing more.

From the project folder that holds the story, the record and the skill at `.claude/skills/isr`:

```
claude -p "Here is a story (story.md) and the build record (the record folder). What should the product owner check by hand?" \
  --permission-mode acceptEdits \
  --add-dir /tmp \
  --allowedTools "Bash(mktemp *),Bash(node *),Bash(ls *)" \
  --output-format json > run.json
```

- `--add-dir /tmp`: the temporary folder `mktemp` makes, where ISR saves the script and the checker reads it.
- `Bash(mktemp *)`, `Bash(node *)`, `Bash(ls *)`: making that folder, running the checker, and listing a task folder. `Bash(node *)` allows any Node command, so run it in a copy you can throw away.
- `--permission-mode acceptEdits`: saving the script without a prompt.
- If the skill folder is a link, add `--add-dir` with the folder it points to, or the skill files are denied.
- `--output-format json`: the reply comes with the run's cost, for the run log.

These are the flags the later runs in the run log used, written out here; the exact command lines of those runs were not kept. To compare several runs, see `scripts/compare-runs.js` in the README.
