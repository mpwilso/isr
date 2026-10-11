# Security

If you find a security problem in ISR, please report it privately, not in a public issue. On GitHub, open the repository's **Security** tab and choose **Report a vulnerability**. Only the maintainer can see the report.

Please say what you found, how to reproduce it, and what it affects. You'll get a reply, and a fix if one is needed.

## What counts

ISR reads a story and a build record, and writes one script. Reports about these are in scope:

- **The runner's gate.** In `runner/`, a hook rules on every tool call the writer makes: reads inside the run's folder, writes only to the script, and the checker as the one command. A way to read, write or run anything else is a bug.
- **The checker.** `skill/src/check.js` reads the files it is given and prints problems. A file that makes it run code, read a file it was not given, or hang is a bug.
- **The story and the record.** Both are data. A story or record whose text gets the runner's writer to read, write or run anything outside its folder is a bug. So is a record folder whose links lead a read out of the run's folder.

Problems in Claude Code, the Claude Agent SDK or the model belong with Anthropic. A run in Claude Code without the runner has only Claude Code's own permissions around it.

This is a personal project. There is no bug bounty.
