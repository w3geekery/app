# App Repo Move Plan — `zerobias-org-forks/app` -> `zb-forks/org/app`

**Authored:** 2026-07-03 (Director Parks), in response to ui-gsd's channel ask.
**Status:** PLAN ONLY — not executed. Execute when no sme-mart Claude session is live (see Timing).

## Goal

Move the last unmigrated fork out of the retiring `zerobias-org-forks/` container into the `zb-forks/{com,org}/` convention (bucket = upstream GH org). `app`'s upstream is `zerobias-org/app`, so:

```
~/Projects/w3geekery/zerobias-org-forks/app   ->   ~/Projects/w3geekery/zb-forks/org/app
```

Target dir is **free** (verified). After the move, `zerobias-org-forks/` holds only stray files (see Open Decisions) and can be retired. Git remotes are URLs (origin=w3geekery/app, upstream=zerobias-org/app) — nothing git-side breaks; the whole complexity is **absolute-path references** that must be re-pointed.

## The move (once, atomic)

```bash
mv ~/Projects/w3geekery/zerobias-org-forks/app ~/Projects/w3geekery/zb-forks/org/app
```

`mv` of the whole dir preserves `.git` + working tree (incl. uncommitted `.planning` pile) — no commit required first, though a known git state is cleaner.

## Verified fixup list (exact locations)

### 1. zbb `sme-mart-local` slot — 3 stack `source:` paths (HIGH — breaks local stack)
Each `source:` line points into the app tree; re-point to `zb-forks/org/app` (or `zbb` re-add the stacks):
- `~/.zbb/slots/sme-mart-local/stacks/cloudfront-sim/stack.yaml:4`
- `~/.zbb/slots/sme-mart-local/stacks/sme-mart-login/stack.yaml:4`
- `~/.zbb/slots/sme-mart-local/stacks/sme-mart-spa/stack.yaml:4`

  `source: /Users/cstacer/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart/zbb-stacks/<x>`
  -> `source: /Users/cstacer/Projects/w3geekery/zb-forks/org/app/package/w3geekery/sme-mart/zbb-stacks/<x>`

  **Incidental (NOT this move):** the `minio` stack in the same slot points at `~/Projects/zb/zerobias-org/util/packages/zbb/stacks/minio` — already stale from the earlier `zb/` reorg (`zerobias-org` container renamed). Flag to ui-gsd separately; out of scope here.

### 2. `~/.claude/settings.json:279` — schema-guard hook registration (HIGH — guard goes dark)
```
"command": "bash /Users/cstacer/Projects/w3geekery/zerobias-org-forks/app/.claude/hooks/check-git-workflow.sh"
```
-> swap to `zb-forks/org/app/...`. **OUTSIDE my repo (global settings)** — ui-gsd offered to take this piece; or do via the `update-config` skill. Until updated, the git-workflow guard does not fire.

### 3. Four Claude project-config dirs keyed to the old absolute path (HIGH — memory loss risk)
Claude Code hashes the cwd into `~/.claude/projects/<path-with-slashes-as-dashes>/`. On move, new hashes are computed and the old dirs orphan (session history, `settings.local`, and **memory**):
- `-Users-cstacer-Projects-w3geekery-zerobias-org-forks`
- `-Users-cstacer-Projects-w3geekery-zerobias-org-forks-app`
- `-Users-cstacer-Projects-w3geekery-zerobias-org-forks-app-package-w3geekery-sme-mart`  ← **holds Director Parks `memory/` (MEMORY.md + memory files)**
- `-Users-cstacer-Projects-w3geekery-zerobias-org-forks-app-package-w3geekery-sme-mart-src-app`

  For each, rename/copy the old dir to its new-path hash (`...-zb-forks-org-app-...`). **The sme-mart one's `memory/` MUST migrate** or Director Parks loses persistent memory. Safest: `cp -a` old -> new (preserve), verify, then remove old.

### 4. Doc/config path sweep (MEDIUM — ~8 files + in-repo)
Absolute `zerobias-org-forks/app` references outside the repo (verified counts): `~/.claude/docs` (2, incl. `projects.md` registry), memex (4), `~/.zbb` (the 3 above). Plus in-repo:
- `.planning/docs/SOURCE_PATHS.md` SME Mart section — the `app` + `sme-mart-nextjs-deprecated` rows still on `zerobias-org-forks/app` (the last stale fork paths in that doc).
- App-root + sme-mart `CLAUDE.md` any absolute self-refs (relative are fine).
- `~/.claude/docs/projects.md` registry — add `app` under `zb-forks/org/app`, mark moved (mirrors how the other forks are tracked).

  In-repo **relative** paths need no change (they move with the tree). Only **absolute** `/Users/.../zerobias-org-forks/app/...` refs get swept.

### 5. `.planning/director/` apparatus (LOW — relative, but timing-sensitive)
This channel, RESUME, DECISIONS, GSD channels move WITH the repo (relative paths hold). Only risk is a **live session rooted here** breaking mid-move — hence Timing.

## Ordering

1. **Pre-flight:** confirm no live sme-mart Claude session (incl. Director Parks — this session cannot move its own cwd out from under itself). Note current git HEAD.
2. **Move:** the `mv` above.
3. **Fixups:** (1) zbb 3 source lines -> (2) settings.json hook -> (3) Claude project dirs incl. memory -> (4) doc/config sweep + registry entry.
4. **Retire container:** handle stray files (Open Decisions), then remove empty `zerobias-org-forks/`.
5. **Verify:** `cd` new path; `git status` matches pre-move; `npm run dev` builds; make a trivial schema-dir test to confirm the hook fires post-re-registration; `zbb` resolves the sme-mart-local slot.

## Timing / coordination

Do it in an **idle window** — no sme-mart session live, and ideally right after a `parkit` so the RESUME is current. Director Parks (this session) must be paused/ended first, since its cwd is inside the tree. Cleanest sequence: parkit -> end this session -> run the move + fixups from a shell (or a session rooted elsewhere) -> reopen Director Parks from the new path (which also forces the new Claude project-hash dir into existence for step 3 verification).

## Recommended staged execution (restart-in-new-location)

The cleanest way around "this session's cwd is inside the tree being moved" is to do the structural move while idle, then finish from a fresh session rooted in the new location. Prefer **`mv`** (instant, preserves `.git` + node_modules + uncommitted `.planning` pile, no duplication) over a file-by-file copy.

**Stage A — structural (Clark, from a shell; Director Parks NOT running):**
```bash
# 0. parkit first so RESUME is current, then quit the Director Parks session.
# 1. Move the repo (run from a cwd OUTSIDE the tree, e.g. ~):
mkdir -p ~/Projects/w3geekery/zb-forks/org
mv ~/Projects/w3geekery/zerobias-org-forks/app ~/Projects/w3geekery/zb-forks/org/app

# 2. Migrate the Claude project dir so Director Parks resumes WITH memory + history.
#    (session resume is keyed by cwd-hash; the new location = a new hash dir.)
OLD=~/.claude/projects/-Users-cstacer-Projects-w3geekery-zerobias-org-forks-app-package-w3geekery-sme-mart
NEW=~/.claude/projects/-Users-cstacer-Projects-w3geekery-zb-forks-org-app-package-w3geekery-sme-mart
cp -a "$OLD" "$NEW"          # copy-verify-delete; don't mv (rollback safety)
# (the other 3 orphaned hash dirs — -forks, -app, -src-app — are low-value; migrate only if you want their history)
```

**Stage B — reopen + finish (new Director Parks session in the new location):**
```bash
cd ~/Projects/w3geekery/zb-forks/org/app/package/w3geekery/sme-mart
claude --resume "Director Parks"     # resumes with memory because of the cp -a above
```
Then the new session executes the remaining fixups from this plan (they benefit from running in the real new tree):
- zbb: re-point the 3 `source:` lines (§1).
- doc/config sweep: `SOURCE_PATHS.md` app/nextjs rows, `projects.md` registry entry, memex refs (§4).
- verify: `git status` matches, `npm run dev` builds, schema-guard hook fires, `zbb` resolves the slot.
- once verified: delete `"$OLD"` project dir + retire empty `zerobias-org-forks/`.

**ui-gsd (parallel, outside my repo):** `~/.claude/settings.json:279` hook re-registration (§2). Do this before the first commit from the new location or the guard stays dark.

**Why not "create structure + copy files" (Clark's first phrasing):** a partial copy risks missing dotfiles / git state / uncommitted work, and a full `cp -a` of the tree duplicates node_modules (~heavy, slow, symlink-fragile). `mv` after quitting the session is simpler and lossless. The one thing that genuinely IS a copy is the Claude project dir (Stage A step 2) — small, and copy-not-move gives a rollback net.

## Open decisions (need Clark)

- **Stray files in `zerobias-org-forks/` container** (not part of `app`): `CLAUDE.md` (the "ZeroBias-Org Forks" workspace doc), `package-lock.json`, `zerobias-org-forks.code-workspace`, `bug-report-dana-createTag-apikey-auth.md`. Move to `zb-forks/`? Retire? The `.code-workspace` has embedded paths that break regardless.
- **Who takes `~/.claude/settings.json`** (item 2) — ui-gsd offered; it's outside my repo.
- **Memory migration method** — `cp -a` then verify then delete (recommended) vs `mv`. Recommend copy-verify-delete to avoid losing memory on a fat-finger.
