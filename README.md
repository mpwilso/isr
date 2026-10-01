# ISR

ISR: tells you what's left to test by hand, and why anything that fails failed.

ISR here means intelligence, surveillance and reconnaissance, not Incremental Static Regeneration.

ISR is a skill for Claude Code. It reads a user story and the record of what the build already verified, then writes one short acceptance script in plain business language: what is already verified, what a person still needs to check by hand, and what the business needs to confirm. It is for product owners and business testers who accept software changes, and it never passes acceptance for them.

## What's here

- `skill/`: the skill, self-contained. Copy it to `.claude/skills/isr/` in a project to install it.
- `skill/spec/script-shape.json`: the script's shape, as data. `skill/src/check.js` enforces it.
- `examples/pellwick/`: an invented story, build records, and the scripts ISR should write for them.
- `scripts/test.sh`: every test. No test calls a model or the network.

Status: Early. Milestone 1 works on invented example data and has not been tried on a real change.

MIT license: [LICENSE](LICENSE).
