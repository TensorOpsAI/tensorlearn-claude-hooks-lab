# Protect files through every write path

A restriction blocks direct edits to approved intent, but a shell command still overwrites it. A broad repair then blocks legitimate development as well.

Here the approved intent is `/workspace/intent.md`, and the instructor tests are everything under `/workspace/tests/instructor/`. Those files are not in this repository: they exist in the grader's container, which also has `/workspace/src/app.mjs` and a symlink `/workspace/src/shortcut` pointing to `/workspace/intent.md`.

The guard is a **PreToolUse** hook. Claude Code runs a PreToolUse hook before each tool call (Edit, Write, Bash, …), passes it the call as JSON, and the hook can allow or deny the call. You write the decision as a function, `decide(event)`, which the grader calls directly with fixed events like those in `fixtures/events.json`.

**What you'll practise:** writing a Claude Code PreToolUse hook that protects files through every write path (direct edits, relative and dotted paths, symlinks, shell redirects, `cp`, `mv`, `tee` and scripts) without blocking normal work, and tests that prove it.

**In the course slides:** Chapter 1, Lesson 5 (hooks as build-time checks) and Chapter 2, Lessons 1 and 4 (protecting the check; hooks as approval gates). In the slides a gate is a script registered in `settings.json` that can allow, ask or block; here you write the decision as a JavaScript `decide()` function that allows or denies.

## Task

1. Read the guard contract (`contract.md`) and sample events (`fixtures/events.json`).
2. Implement `guard/guard.mjs` to permit normal source changes and deny protected-file mutations.
3. Add student tests for direct paths, traversal, symlinks, rename and shell redirection in `tests/student/guard/`. Replace the placeholder in `guard.test.mjs`; test files must end in `.test.mjs`.
4. Run your tests and the sample events against your guard (commands below). Check that useful work still succeeds.

Run your tests and the sample events from the repository folder:

```sh
node --test 'tests/student/guard/**/*.test.mjs'
node -e "import('./guard/guard.mjs').then(({decide})=>{for(const {id,event,expected} of require('./fixtures/events.json')){const got=decide(event).hookSpecificOutput.permissionDecision;console.log(got===expected?'ok  ':'FAIL',id,got)}})"
```

Your machine most likely has no `/workspace`, so anything that depends on the fixture files (the `src/shortcut` symlink) cannot be checked locally: the `symlink` sample event shows `FAIL` here, and tests that need it should skip when it is absent, for example (with `import fs from 'node:fs'`) `test('symlink is protected', {skip: !fs.existsSync('/workspace/src/shortcut')}, () => …)`. Your guard must still decide when a path does not exist. Make every test assert at least one `deny`, so your tests fail against a guard that allows everything. If you have Docker, you can run the tests against the same fixture files:

```sh
docker run --rm -v "$PWD":/repo:ro -w /repo node:22 sh -c 'mkdir -p /workspace/src /workspace/tests/instructor && echo approved > /workspace/intent.md && echo protected > /workspace/tests/instructor/check.mjs && echo old > /workspace/src/app.mjs && ln -s /workspace/intent.md /workspace/src/shortcut && node --test "tests/student/guard/**/*.test.mjs"'
```

Optional: watch Claude get blocked. Add this wrapper as `guard/live-hook.mjs`. It maps your project folder to `/workspace`, so `intent.md` at the repository root counts as protected:

```js
import {decide} from './guard.mjs';
let raw = '';
for await (const chunk of process.stdin) raw += chunk;
const event = JSON.parse(raw);
const root = process.env.CLAUDE_PROJECT_DIR || event.cwd;
const map = p => typeof p === 'string' && (p === root || p.startsWith(root + '/')) ? '/workspace' + p.slice(root.length) : p;
const input = {...event.tool_input};
if ('file_path' in input) input.file_path = map(input.file_path);
if (typeof input.command === 'string') input.command = input.command.replaceAll(root + '/', '/workspace/');
const result = decide({tool_name: event.tool_name, tool_input: input, cwd: map(event.cwd)});
// Print only denials: allowed calls still get Claude Code's normal permission prompts.
if (result.hookSpecificOutput.permissionDecision === 'deny') console.log(JSON.stringify(result));
```

Then create `.claude/settings.local.json` yourself (it is git-ignored; never commit it) and start a new Claude Code session in the repository folder (plain `claude` is fine), because hooks are read at startup:

```json
{"hooks": {"PreToolUse": [{"matcher": "Edit|Write|MultiEdit|Bash", "hooks": [{"type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/guard/live-hook.mjs\""}]}]}}
```

Tell Claude you are testing the hook and ask it to write to `intent.md`, then to run `printf x > intent.md`: each call should be blocked with your reason. Asking it to add a comment to `guard/guard.mjs` should go through as normal. Delete the settings file when you are done, and any stray `intent.md` the demo created: it must not be committed.

This lab often takes longer than the listed time the first time through.

## Working rules

Edit only guard code (`guard/**`) and student guard tests (`tests/student/guard/**`). The grader runs your guard in a disposable, offline container: it imports `guard/guard.mjs`, calls `decide()` with fixed events and checks that the fixture files are unchanged afterwards. A guard that throws, returns a promise or returns a malformed object gets no credit for that event. Use Node 22; there is no `package.json`.

## Acceptance targets

- Protected intent and instructor tests cannot change through accepted tool paths.
- Normal source edits are allowed.
- Invalid or ambiguous requests fail safely with an explanation.
- The submitted guard’s decisions are correct independently of the outer worker protection.

## Done when

- `node --test 'tests/student/guard/**/*.test.mjs'` passes, and fails if you temporarily make `decide` allow everything.
- The sample-events command prints `ok` for every event except `symlink`, which needs `/workspace` (all of them pass under the Docker command).
- `decide(null)` and `decide({})` return a deny with a reason instead of throwing.
- `git status` shows changes only in `guard/` and `tests/student/guard/`.

## Graded format

- `decide` is synchronous and returns exactly `{hookSpecificOutput: {hookEventName: 'PreToolUse', permissionDecision: 'allow' | 'deny', permissionDecisionReason}}`: a non-empty reason of at most 2000 characters, and no other keys.
- Malformed events (`null`, `{}`, an Edit or Write without a string `file_path`, a Bash call without `command`) are denied with a reason, without throwing.
- Relative paths resolve against the event's `cwd`.
- Writes to a protected file are denied through Edit, Write and MultiEdit, `>` and `>>` redirects, `cp`, `mv` (into or out of a protected file), `tee` (including `-a`) and `python3 -c`.
- Ordinary `src/**` edits are allowed, including look-alike names such as `src/intent.md`, and so are read-only commands such as `cat intent.md`.
- The grader runs `node --test 'tests/student/guard/**/*.test.mjs'` with your guard (it must pass) and with an allow-all guard (it must fail).

## How to submit

1. Fork this repository to your personal GitHub account. Use fictional information
   only, keep the fork public, and keep `main` as its default branch. In your fork's
   **Actions** tab, click **I understand my workflows, go ahead and enable them** if shown.
2. On the lab page, use **Connect GitHub for scoring** to install the read-only grading
   App on your fork, then **Recheck connection**.
3. Download the TensorLearn connector from the lab page and extract it outside your fork.
   From your fork folder, run the page's `--code` connection command and paste your token
   only into the hidden terminal prompt. This opens a Claude Code session connected to the lab.
4. In that session, run `/load`. Run `/load` again after your instructor launches the round.
5. Create a branch such as `hooks/first-draft` and complete the task above. Change only the
   files the task allows: any other change, including `CLAUDE.md`, `.claude/` settings or
   agents, or notes files, makes the submission invalid.
6. Commit and push your branch. Open a PR **inside your own fork**, targeting its `main`
   branch (GitHub may suggest the upstream repository: select your fork instead). Check
   that **Check hooks submission** starts in the PR's checks. Keep the PR open; no merge
   is required.
7. Run **`/submit`** in the connected Claude Code session, then `/check` (or refresh the
   lab page) to read your saved score. The Actions run is useful feedback, but it does not
   submit your work.

A change to your answer needs a new commit, push and `/submit`. Keep `main` unchanged:
the grader compares your PR with the released starter.

## What is graded

The pinned grader in `.github/workflows/grade.yml` reads your files as data and runs your
code only in an isolated, offline container. Every check is a fixed rule; no AI model
judges your work. Your score is out of 100. Your facilitator separately reviews
clarity and reasoning.

- Direct writes to protected files are denied
- Relative, dotted and doubled paths resolve to the same protected target
- A symlink to a protected file is treated as that file
- Shell redirects, cp, mv, tee and python writes to protected files are denied
- Ordinary source edits are allowed
- Read-only commands are allowed
- Look-alike names under src/ are not mistaken for protected files
- Malformed events are denied without crashing
- Every decision has the documented PreToolUse shape.
- Deciding never changes the fixture files.
- Your student tests pass, and fail against an allow-all guard.
- Allowing a write to a protected file, or allowing/denying everything, caps the score at 25/100.
