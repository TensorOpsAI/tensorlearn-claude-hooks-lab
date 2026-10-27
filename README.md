# Protect files through every write path

A restriction blocks direct edits to approved intent, but a shell command still overwrites it. A broad repair then blocks legitimate development as well.

## Task

1. Read the guard contract and sample events.
2. Implement `guard/guard.mjs` to permit normal source changes and deny protected-file mutations.
3. Add student tests for direct paths, traversal, symlinks, rename and shell redirection.
4. Run the fixed event and effect probes. Check that useful work still succeeds.

## Working rules

Edit only guard code and student guard tests. Hooks run in a disposable worker without network, host files or credentials. The trusted controller forwards bounded events; arbitrary candidate hooks never execute beside the model credentials. A broken guard blocked by the outer runtime receives no correctness credit.

## Acceptance targets

- Protected intent and instructor tests cannot change through accepted tool paths.
- Normal source edits are allowed.
- Invalid or ambiguous requests fail safely with an explanation.
- The submitted guard’s decisions are correct independently of the outer worker protection.

## How to submit

1. Fork this repository to your personal GitHub account. Use fictional information
   only, keep the fork public, and keep `main` as its default branch.
2. Clone your fork and enable GitHub Actions in its **Actions** tab. Use **Connect
   GitHub for scoring** on the lab page to install the read-only grading App on your
   fork. Return to the lab and use **Recheck connection** if needed.
3. Download the TensorLearn client from the lab page and extract it outside your fork.
   Follow the page's connection command from your fork folder. Paste your learner
   token only into the hidden terminal prompt. Run `/load` from your fork folder to
   connect the repository. Run `/load` again after the facilitator launches the round.
4. Create a branch such as `hooks/first-draft` and complete the task above. Change
   only the files the task allows; any other change makes the submission invalid.
5. Commit and push your branch. Open a PR **inside your own fork**, targeting its
   `main` branch. GitHub may suggest the upstream repository: select your fork instead.
   Opening or updating this PR starts the checks automatically.
6. Keep the PR open. When ready, run **`/submit`** in the connected Claude Code session
   to submit that exact pushed revision for the current round. **No merge is required.**
7. Use `/check` or refresh the lab page to read the saved result. The Actions run and
   `lab-score/score.json` are useful feedback, but an Actions check alone does not
   submit your work or prove that the server saved a score.

A change to your answer requires a new commit, push, and explicit `/submit`. Keep
`main` unchanged: the grader compares your PR with the released starter.

## What is graded

The pinned grader in `.github/workflows/grade.yml` reads your files as data and runs
your code only in an isolated, offline container. Every check is a fixed rule; no AI
model judges your work. Your facilitator separately reviews clarity and reasoning.

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
