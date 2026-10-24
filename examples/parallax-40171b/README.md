# The README example: Parallax task 40171b

The story, [story.md](story.md), was written by Loupe from the task's build request. The record is the task's `intent.md`, `plan.md` and `record.md`, in [record/](record/); the original is public in the Parallax repo at [docs/tasks/40171b/](https://github.com/mpwilso/parallax/tree/master/docs/tasks/40171b). The script ISR wrote is [script.md](script.md). Those three files are copied byte for byte from the run, except the blank lines added after the script's four top lines. This page is a guide to them and is not part of the record.

The story's requirements, shortened, and numbered as the script uses them:

1. When the sandbox can't start, the error card adds a one or two line hint to run `parallax doctor`, under the real problem.
2. If the error mentions namespaces or bwrap, the hint also points to the user-namespace step in the WSL guide, which gets a findable heading.
3. An error that isn't a sandbox start failure gets no hint.
4. `parallax show` and the web card show the same hint, and the card's options, question and retry behavior stay as they are.
5. A test covers both cases: a namespace or bwrap error shows both pointers, and another sandbox start error shows only the `parallax doctor` line.
