---
name: fishing-ship
description: >
  Ship one GitHub issue in mookiejones/fishing_map through issue, PR
  fix, sync from main, QA, then squash-merge. Skip a stage that is
  already complete and run the next. Use when the user runs
  /fishing-ship, /fishing-ship <N>, says ship issue #<N>, or asks to
  land a fishing_map issue from code through merge.
argument-hint: <issue-number>
---

# Ship fishing_map issue

Argument is issue number `I`. If missing, ask once and stop.

Repo: `mookiejones/fishing_map`.
Clone: `/Users/charlesberman/Repo/fishing_map`.
This skill lives only in this repo (`.grok/skills/fishing-ship/`).

If cwd is not that clone, `cd` to it or `gh repo clone mookiejones/fishing_map`. Read `CLAUDE.md` there. Do not copy those rules here.

Walk stages in order: issue → pr → sync → qa → merge. Before each stage, probe. If that stage is already complete, skip it and go to the next. Stop at the first failed stage. Do not run later stages.

## Glue

Issue, pr, sync, and merge use GitHub identity `mookiejones`. qa uses `mookiejones-qa`.

After qa (run or skip), and before merge or any stop or final reply:

```bash
gh auth switch --user mookiejones
```

Find `N`: issue-stage PR link (`/pull/<N>`), else

```bash
gh pr list --repo mookiejones/fishing_map --search "<I> in:title,body" --state open --json number,url,title
```

Take the PR that closes `I`. If none, same command with `--state merged`. Open none and merged none: issue is incomplete.

After issue (run or skip), after pr if that stage pushed, and after sync if that stage updated, wait until checks finish before judging pr, sync, or qa:

```bash
gh pr checks <N> --repo mookiejones/fishing_map --watch
```

Probe when `N` is known:

```bash
gh pr view <N> --repo mookiejones/fishing_map --json state,url,mergeable,mergeStateStatus,reviewDecision,latestReviews
gh pr checks <N> --repo mookiejones/fishing_map
```

Complete (skip the stage):

- issue: a PR `N` that closes `I` exists (open or merged)
- pr: `N` is open, every check passes, `mergeStateStatus` is not `DIRTY`, latest `mookiejones-qa` review is not `CHANGES_REQUESTED`
- sync: `mergeStateStatus` is `CLEAN`
- qa: latest `mookiejones-qa` review is `APPROVED`
- merge: `N` `state` is `MERGED`

If `N` is already `MERGED`, skip remaining stages. Record merge as `merged`.

pr "nothing in-scope" is success; continue. `Still blocking` not `none`: stop.

sync `already CLEAN` or `synced` is success; continue. `not synced`: stop.

qa result is not `APPROVED`: stop. Do not merge.

Local gate (issue and pr, after code changes):

```bash
npx tsc --noEmit
npm run test:run
```

Both must pass before push.

## Auth (`mookiejones`)

```bash
gh auth status
```

If the active GitHub account is not `mookiejones`:

```bash
gh auth switch --user mookiejones
gh auth status
```

STOP only if the active account is still not `mookiejones`. Name the active account.

## issue

Identity: `mookiejones`. Dirty worktree: stop. Name the dirty files. Do not stash unless the user says to.

1. Claim: `gh issue edit <I> --repo mookiejones/fishing_map --add-assignee @me` before any other write. If already assigned to `mookiejones`, skip. If assigned only to someone else, stop and name that assignee unless the user said to take it.
2. Read the issue (`gh issue view <I> --repo mookiejones/fishing_map`) and only the files you need.
3. Make the smallest change that solves it. Follow `CLAUDE.md`.
4. Run the local gate. Fix anything you broke.
5. Branch `issue-<I>-short-name`, commit, push, open a PR that says `Closes #<I>`.

Done: PR link is enough for this stage. Continue.

## pr

Identity: `mookiejones`. Dirty worktree: stop. Name the dirty files.

```bash
gh pr checkout <N>
gh pr checks <N> --repo mookiejones/fishing_map
gh pr view <N> --repo mookiejones/fishing_map --comments
gh pr view <N> --repo mookiejones/fishing_map --json title,state,mergeable,mergeStateStatus,headRefName,baseRefName,reviewDecision,url
```

In-scope: red CI checks, review comments that ask for a change, merge conflicts with `main` (`mergeable` is `CONFLICTING` or `mergeStateStatus` is `DIRTY`). Pending checks are not red.

Nothing in-scope: continue. Do not invent work.

Fix only those failures. Conflicts: merge `origin/main` into the PR branch. Prefer merge so the branch can push without force. Rebase only when the PR already uses rebase. After a rebase, `git push --force-with-lease` to that PR branch only.

Never push to `main`. Never `--force` without lease. Never merge the PR in this stage.

Run the local gate until green. Commit on the PR branch. Push to the same branch.

If this push dismissed `mookiejones-qa` approval, re-request that review. Do not merge.

For each review comment this change answers, reply on that comment. Leave unanswered comments unanswered.

Record `nothing in-scope` | `fixed` | `still blocking`.

## sync

Identity: `mookiejones`. Do not checkout. Do not edit files. Do not rebase. Do not merge the PR.

```bash
gh pr view <N> --repo mookiejones/fishing_map --json mergeStateStatus,mergeable,headRefOid
```

STOP if `mergeable` is `CONFLICTING` or `mergeStateStatus` is `DIRTY`. Next step is pr.

If `mergeStateStatus` is `CLEAN`: already up to date. Record `already CLEAN`. Do not call `update-branch`.

STOP if `mergeStateStatus` is not `BEHIND`. Name that status.

```bash
gh pr update-branch <N> --repo mookiejones/fishing_map
```

No `--rebase`. If that command fails: record `not synced` and stop. If the error is a conflict, next step is pr.

Wait for checks. STOP unless `mergeStateStatus` is `CLEAN`. Record `synced`.

## qa

Identity: `mookiejones-qa`. Do not merge. Do not push. Do not checkout. Do not edit files.

```bash
gh auth status
```

If the active GitHub account is not `mookiejones-qa`:

```bash
gh auth switch --user mookiejones-qa
gh auth status
```

STOP only if the active account is still not `mookiejones-qa`. Name the active account.

```bash
gh pr view <N> --repo mookiejones/fishing_map
gh pr diff <N> --repo mookiejones/fishing_map
gh pr checks <N> --repo mookiejones/fishing_map
```

Read `CLAUDE.md`. Pending checks: stop. Record `PENDING`. Do not post a review.

All of these must hold:

- every check is green
- tests added or updated, and they pass
- one file per function/component; one test file per tested function
- change matches the issue; nothing unrelated

Everything passes:

```bash
gh pr review <N> --repo mookiejones/fishing_map --approve --body "QA pass: <1-line summary>"
```

Anything fails:

```bash
gh pr review <N> --repo mookiejones/fishing_map --request-changes --body "<numbered list of exactly what to fix>"
```

Record `APPROVED` | `CHANGES REQUESTED` | `PENDING`.

## merge

Identity: `mookiejones`. Do not checkout. Do not edit files.

```bash
gh pr view <N> --repo mookiejones/fishing_map --json reviewDecision,mergeStateStatus,headRefOid,latestReviews
```

STOP unless `mergeStateStatus` is `CLEAN`.

Approval holds if either is true:

- `reviewDecision` is `APPROVED`
- `reviewDecision` is empty and `latestReviews` has `state` `APPROVED` from `mookiejones-qa`

STOP if `reviewDecision` is `CHANGES_REQUESTED`, or if `mookiejones-qa`'s latest review is `CHANGES_REQUESTED`.

Keep `headRefOid`. Squash-merge:

```bash
gh pr merge <N> --repo mookiejones/fishing_map --squash --delete-branch --match-head-commit <headRefOid>
```

Push to `main` deploys GitHub Pages via `.github/workflows/deploy.yml`.

Record `merged` | `not merged`.

## Reply

One block only:

```
issue <I> PR <N>
issue: <url or fail or skipped>
pr: nothing in-scope | fixed | still blocking | skipped
sync: synced | already CLEAN | not synced | skipped
qa: APPROVED | CHANGES REQUESTED | PENDING | skipped
merge: merged | not merged | skipped
<one line why if any fail or skip>
```
