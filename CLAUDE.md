# ISR: rules for agents working in this repo

ISR is a skill that prepares the people who accept a software change. Read docs/direction.md first.

## Rules

- Clean room. ISR is a personal project and original work. Bring nothing in from another organization's tools or internal material: no names, code, prompts, structure or wording. Design every feature from scratch in ISR's own terms. If you are unsure whether something resembles another organization's tool or material, stop and ask the owner, Matt Wilson.
- [Loupe](https://github.com/mpwilso/loupe) writes the stories ISR reads, and [Parallax](https://github.com/mpwilso/parallax) runs the build agents and keeps the records ISR reads; both are separate repos. Never edit, commit to or check out branches in them. Read them only, at master, with git show and git ls-tree. For anything else from them, ask the owner.
- No em dashes, en dashes or double hyphens used as dashes, anywhere. Plain, human wording.
- Less is more, in docs, output, README and code. A reader should get the gist in 30 seconds. If something can be cut, cut it.
- The report shape is law. Every script ISR produces has the same shape every time. The shape lives in the skill's shape file as data, and the template and checker follow it.
- ISR prepares acceptance and never passes it. No verdicts, no sign-off, no touching any environment.
- Never state a guess as a fact. Unknowns stay unknown and are labeled.
- Do not overclaim. No "only", "first" or "best". Say what was measured and what was not. Example data is labeled as invented.
- Tests never call a model or the network.
- scripts/test.sh is the single test entry, locally and in CI. Commit only when it passes, and run it with pipefail so a piped command cannot hide a failure.
- Never claim a fix without a reproduction that failed and then passed.
- No secrets, credentials or customer data in the repo, ever.
- In Markdown, angle-bracket placeholders render invisibly on GitHub. Use code spans.

## Branches

Work on a branch. Push it, wait for CI green, then fast-forward merge into master, push, and delete the branch locally and on GitHub (remote branches one at a time).

## Reports

Start with Type (Decision needed, Recommendation or FYI), Bottom line (one sentence), Not looked at, Next. Then Found, Recommended, Details as needed. Always state the test command, exact counts and skips, commit ids and the CI link.
