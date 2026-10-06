---
name: ship
description: Ships the current branch of the ISR repo by the flow in CLAUDE.md's Branches section. Run only when the owner types /ship.
disable-model-invocation: true
---

# Ship

The flow is the first paragraph of CLAUDE.md's Branches section, and it wins if this file says otherwise. Run one git command per step, never chained. Stop at the first failure and report it.

1. Run `git branch --show-current`. On master, stop: work happens on a branch.
2. Run `scripts/test.sh` with pipefail. Stop unless it ends with ALL PASSED.
3. If there is anything to commit, run `git branch --show-current` again, then commit on the branch.
4. Push the branch, then `gh run watch` its CI run with `--exit-status`. Stop unless it passes.
5. Switch to master, then `git merge --ff-only` the branch. Stop if it can't fast forward.
6. Push master, then watch its CI run the same way.
7. Delete the branch locally, then on GitHub, one remote branch per command.
8. Report as CLAUDE.md's Reports section says, with the commit ids and the CI links.
