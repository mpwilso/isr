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
5. Report as CLAUDE.md's Reports section says, with the commit ids and the CI link. The owner merges with ~/merge-branch.sh and deletes the branch; never switch to master, merge, or push master.
