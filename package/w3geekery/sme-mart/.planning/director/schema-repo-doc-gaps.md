# Schema Repo & Tooling — Documentation / UX Gap Inventory

**Compiled by:** Clark Stacer (W3Geekery, SME Mart) + Director Parks (Claude Code session), 2026-05-11
**Compiled during:** schema deprecation PR walkthrough (marking 3 SME Mart classes as `deprecated: true` in `zerobias-org/schema`)
**Owner / triage:** Daniel Rojas
**Context:** Each item below was hit as real friction by a contributor following the current docs. They are not theoretical — every gap has a concrete failure mode and, where applicable, a specific code or path reference.

---

## How to use this document (instructions for an AI assistant)

If you are an AI assistant reading this on behalf of Daniel: this is a structured inventory of 12 gaps. Each entry is self-contained — you do not need outside project context to explain it. Suggested workflow:

1. **Offer Daniel a brief overview first** — summarize the 12 gaps using just the **Summary table** below. Do not dump full bodies unprompted.
2. **Wait for him to pick** which gaps he wants to drill into. He may pick by ID, by repo (`schema`, `util/build-tools`, `util/zbb`, `app`), by severity, or by category.
3. **For each gap he picks**, give the full body verbatim (or paraphrased — your call), and **read the referenced source files to verify the claim is still accurate**. The friction stories in each gap are dated 2026-05-11; some may have been fixed since, so verify before treating them as outstanding work.
4. **Language:** if Daniel prefers a non-English explanation (e.g., Spanish), translate on request. **Do not assume his preferred language — ask first.**
5. **Do not invent context that is not in this file.** If Daniel asks about the broader project these gaps were discovered in, or about decisions / scope / timelines outside the gap inventory itself — those answers are not in this doc. Tell him you don't have that context and suggest he ask Clark.
6. **Triage suggestion:** Daniel can use the **Severity** field to prioritize. HIGH = blocks new contributors or causes false-positive "is it broken?" debugging detours. MEDIUM = friction with workaround. LOW = polish.

If Daniel does not have access to the source repos referenced (some are inside `zerobias-org/util`, some are `zerobias-org/schema`), surface that as a question — different gaps live in different repos.

---

## Summary table

| ID | Title | Severity | Category | Repo | Status |
|---|---|---|---|---|---|
| 1 | No procedure for editing existing classes in a migrated package | HIGH | DOC | `zerobias-org/schema` | Open |
| 2 | `CLAUDE.md` outdated relative to PR #52 (pre-migration commands) | HIGH | DOC | `zerobias-org/schema` | Open |
| 3 | `README.md` is 9 bytes (essentially empty) | MEDIUM | DOC | `zerobias-org/schema` | Open |
| 4 | `CONTRIBUTING.md` outdated — Clark's directive: delete or rewrite | MEDIUM | DOC | `zerobias-org/schema` | Open |
| 5 | Java 21 LTS prerequisite is not documented anywhere | HIGH | DOC | `zerobias-org/schema` | Open |
| 6 | `zbb` vs `gradle`-direct: no doc states which is preferred | MEDIUM | DOC | `zerobias-org/schema` | Open |
| 7 | zbb slot setup for schema work is undocumented | MEDIUM | DOC | `zerobias-org/schema` | Open |
| 8 | Empty `package/w3geekery/sme-mart/` alongside active `smemart/` (post-rename tombstone) | LOW | DOC | `zerobias-org/schema` | Open |
| 9 | Local-vs-CI gate behavior buried inside `migrate-packages` skill | MEDIUM | DOC | `zerobias-org/schema` | Open |
| 10 | Stale hook path in SME Mart app's `check-git-workflow.sh` | LOW | INCONSISTENCY | SME Mart app repo (not schema) | Open — app-side cleanup |
| 11 | `testIntegrationDataloader` hidden from gate progress UI | HIGH | BUG | `zerobias-org/util` (build-tools) | Open |
| 12 | zbb progress UI spams thousands of phase lines + truncates labels | HIGH | BUG | `zerobias-org/util` (zbb) | Open |
| 13 | Unscoped `zbb gate` from schema repo root rewrites `branch` field on every package's `gate-stamp.json` | MEDIUM | BUG | `zerobias-org/util` (build-tools) | Open |

---

## Detailed gaps

### Gap 1 — No procedure documented for editing existing classes in a migrated package

- **Severity:** HIGH
- **Category:** DOC (missing canonical playbook)
- **Repo:** `zerobias-org/schema`
- **Files referenced:** `.claude/skills/migrate-packages/SKILL.md`, `package/<owner>/<package>/classes/*.yml`

**Problem:** The only end-to-end playbook is `migrate-packages/SKILL.md`, which is purpose-built for **first-time gradle migration** of a package. Common follow-on activities have no canonical doc:

- Adding a new class / field to an already-migrated package
- Editing an existing class (e.g., adding `deprecated: true`, changing a property)
- Renaming a class
- Removing a deprecated class after data has aged out

**Open questions a follow-on doc should answer:**
- Do you need to re-run `:gate` to refresh `gate-stamp.json` after a YAML edit, or is it auto-managed?
- Does a description-only change need the full gate, or just `dataloader -d ./`?
- What's the minimum local validation before push? (is `dataloader -d ./` against scratch DB sufficient, or must it be `./gradlew :<path>:gate` with real Neon?)
- Do contributors bump the package version manually for edits, or is it lerna/release-tooling-managed?

**Recommendation:** Create `docs/editing-schemas.md` (or equivalent) covering add / edit / deprecate / rename / remove flows.

---

### Gap 2 — `CLAUDE.md` outdated relative to PR #52

- **Severity:** HIGH
- **Category:** DOC (stale references)
- **Repo:** `zerobias-org/schema`
- **Files referenced:** `CLAUDE.md` at repo root

**Problem:** `CLAUDE.md` references pre-migration commands that no longer exist or no longer work:
- `npm run validate` — no longer a script in migrated packages (e.g., not in `smemart/package.json` post-PR-#52)
- Lerna ops as primary lifecycle — gradle/zbb is now primary
- `scripts/validate.ts` — deleted in PR #52 per the diff

**Doesn't mention any of:**
- Gradle, `./gradlew`, `build.gradle.kts`
- `zbb`, `zbb.yaml`, `zb.schema` plugin
- `gate-stamp.json` (mandatory artifact, CI-enforced)
- Java 21 prerequisite

**Recommendation:** Rewrite `CLAUDE.md` for the gradle/zbb pipeline; remove pre-migration references.

---

### Gap 3 — `README.md` is 9 bytes (essentially empty)

- **Severity:** MEDIUM
- **Category:** DOC
- **Repo:** `zerobias-org/schema`
- **Files referenced:** `README.md` at repo root

**Problem:** No new-contributor pointer to `CLAUDE.md` / `CONTRIBUTING.md` / `MIGRATION_STATUS.md`. No quick-start. No statement of what the repo IS.

**Recommendation:** Replace 9-byte stub with quick-start + pointers to deeper docs.

---

### Gap 4 — `CONTRIBUTING.md` is outdated

- **Severity:** MEDIUM
- **Category:** DOC
- **Repo:** `zerobias-org/schema`
- **Files referenced:** `CONTRIBUTING.md` at repo root
- **Owner directive:** Clark Stacer (2026-05-11) — **either delete or rewrite, don't leave as-is**.

**Problem:** Documents the pre-gradle flow: `npm install` + `npm run validate` + raw `dataloader --content-dev --skip-pgboss --skip-dynamo -d ./`. The first two no longer work (script removed in PR #52); the third still works but isn't the pipeline-blessed validation path.

**Recommendation:** Delete the file, or rewrite it to mirror the gradle/zbb pipeline.

---

### Gap 5 — Java 21 LTS prerequisite is not documented in the schema repo

- **Severity:** HIGH
- **Category:** DOC (missing prerequisite)
- **Repo:** `zerobias-org/schema`
- **Files referenced:** all doc files (none mention Java); cross-ref `zerobias-org/util/packages/zbb/README.md` (separate repo, where Java IS documented)

**Problem:** Gradle 8.10.2 requires Java 21. zbb's preflight enforces it. But Java 21 is not mentioned in any schema repo doc:
- `README.md` (empty)
- `CLAUDE.md` (outdated)
- `CONTRIBUTING.md` (outdated; doesn't mention Java even in its pre-migration form)
- `MIGRATION_STATUS.md` ("Future additions" section assumes gradle works without prereq context)
- `.claude/skills/migrate-packages/SKILL.md`

Found only in `zerobias-org/util/packages/zbb/README.md` (zbb's own docs, in a separate repo most schema contributors won't know to look at).

**Friction story:** on a fresh machine with default Homebrew Java (Homebrew currently installs Java 25), `./gradlew gate` fails with `BUILD FAILED ... 25.0.2` and no actionable error. Diagnosis required reading Gradle release notes (gradle 8.10.x does not support Java 24+) + finding zbb's separate-repo README. ~20-30 min lost per contributor.

**Recommendation:** Add a top-level "Prerequisites" section to `CLAUDE.md` (and/or `docs/development-setup.md`): "Java 21 LTS via Homebrew (`brew install openjdk@21`) — Gradle 8.10.2 does not support Java 24+."

---

### Gap 6 — `zbb` vs `gradle`-direct: no doc states which is preferred

- **Severity:** MEDIUM
- **Category:** DOC (ambiguous paths)
- **Repo:** `zerobias-org/schema`

**Problem:** Two paths exist with no guidance:

| Path | Documented in | Documented in schema repo? |
|---|---|---|
| `./gradlew :<path>:gate` | `.claude/skills/migrate-packages/SKILL.md` (only) | Partial |
| `zbb gate` | `zbb`'s own help/README (separate repo) | No |

Both run the same gradle task. Differences:
- `zbb gate` auto-sets `JAVA_HOME` and `GRADLE_OPTS`
- `./gradlew gate` requires manual `JAVA_HOME` export
- `zbb gate` requires being inside a loaded slot

**Recommendation:** Pick one as the documented default (or document both with the trade-off and when to use which).

---

### Gap 7 — zbb slot setup for schema work is undocumented

- **Severity:** MEDIUM
- **Category:** DOC
- **Repo:** `zerobias-org/schema`

**Problem:** A schema contributor needs a purpose-specific zbb slot for schema work. Existing slots in other repos (e.g., `sme-mart-local` for frontend dev) are wrong for schema work — they try to start frontend stacks and surface irrelevant env vars.

But no schema-repo doc says:
- "Create a schema-purpose slot before doing schema work"
- Suggested slot name (e.g., `schema-local`?)
- "Load slot from inside the schema repo directory so `zbb.yaml` extension auto-applies" (the "Slot extension skipped" warning when loading from the wrong dir is **silent and easy to miss**)

**Friction story:** Clark + Director derived the slot setup independently (port range conflict between two slots, the silent extension-skipped warning, etc.). ~30 min lost.

**Recommendation:** `docs/development-setup.md` (new file) that walks through the full zbb-based setup including slot creation, port-range conventions, and how to verify the slot extension picked up the schema-specific config.

---

### Gap 8 — Empty `package/w3geekery/sme-mart/classes/` alongside active `package/w3geekery/smemart/classes/`

- **Severity:** LOW
- **Category:** DOC (deprecate-without-delete pattern unexplained)
- **Repo:** `zerobias-org/schema`
- **Files referenced:** `package/w3geekery/sme-mart/` (tombstone), `package/w3geekery/smemart/` (active), commit `0c4c97e` (the rename)

**Problem:** The hyphenated `sme-mart/` package is the deprecated original (renamed to no-hyphen `smemart/` in commit `0c4c97e`). Both directories exist post-rename:

- `package/w3geekery/sme-mart/` — stub `package.json` + `catalog.yml` only; npm-deprecated; classes were moved
- `package/w3geekery/smemart/` — active package, 15+ class files

Both `catalog.yml` files say `package: "w3geekery.smemart.schema"`, which makes them look like duplicates to a new contributor.

**Recommendation:** Document the deprecate-without-delete pattern for whole-package renames somewhere visible ("If you see two similarly-named dirs, the one with content is the active one; the empty one is a tombstone for the old package name"). Could go in `CLAUDE.md` or a `docs/conventions.md`.

---

### Gap 9 — Local-vs-CI gate behavior documented only inside the migrate-packages skill

- **Severity:** MEDIUM
- **Category:** DOC (critical operational knowledge buried)
- **Repo:** `zerobias-org/schema`
- **Files referenced:** `.claude/skills/migrate-packages/SKILL.md` (the only place this is currently documented)

**Problem:** This is **critical operational knowledge:**

> "Without `NEON_API_KEY` / `NEON_PROJECT_ID` in env, `testIntegrationDataloader` is skipped (not failed) — and the TS-twin generation step is skipped along with it. The stamp still gets written, and CI re-runs the full gate with Neon on push."

It explains: "yes, the gate skips Neon-backed steps locally; that's expected, not a failure." But it's buried inside a migration-specific skill — contributors running gate for non-migration work will hit the skipped-step output and assume something's wrong.

**Note:** The "CI re-runs the full gate with Neon on push" claim is also subtly misleading — CI actually runs only `monorepoGateCheck` (cheap, validates committed stamp) per `zb.monorepo-gate.gradle.kts`. The full gate including Neon-side dataloader runs ONLY during `publish` (push to env branch).

**Recommendation:** Create `docs/local-vs-ci.md` covering: what the local gate skips, what CI does differently, how to interpret skipped steps, what `monorepoGateCheck` vs `publish` actually validate. Surface the "skipped is expected" framing prominently.

---

### Gap 10 — Stale hook path in SME Mart app-side `.claude/hooks/check-git-workflow.sh`

- **Severity:** LOW
- **Category:** INCONSISTENCY (app-side, not schema-side)
- **Repo:** SME Mart app fork (`w3geekery/app`), not `zerobias-org/schema`
- **Status:** **Not Daniel's repo — listed here for completeness since it surfaced during the same walkthrough.** Owner is the SME Mart team.

**Problem:** The SME Mart app's git-workflow hook hardcodes `~/Projects/w3geekery/zerobias-org-forks/schema` as the expected schema fork-clone path, but the actual local convention is `~/Projects/w3geekery/zb-forks/org/schema`. Hook never fires correctly on either path.

**Recommendation:** Track as an app-repo cleanup item; not blocking for any schema PR. Mentioned to Daniel only so he knows this is *not* a schema-repo concern.

---

### Gap 11 — `testIntegrationDataloader` hidden from gate progress UI

- **Severity:** HIGH
- **Category:** BUG (build-tools observability)
- **Repo:** `zerobias-org/util` (build-tools package)
- **Files referenced:** `packages/build-tools/src/main/kotlin/com/zerobias/buildtools/lifecycle/EventEmitter.kt:189-191` (the missing mapping), `packages/build-tools/src/main/kotlin/zb.content.gradle.kts:184-194` (where the task is registered)

**Problem:** `testIntegrationDataloader` is the `NeonDataloaderTask` that does the real schema validation work — it provisions an ephemeral Neon Postgres branch, runs `dataloader -d <pkg>`, validates, and tears the branch down. Its parent lifecycle task `testIntegration` is just an alias that depends on it (`zb.content.gradle.kts` line 192-194).

In `EventEmitter.kt:189-191`, only the parent name maps to a display row:

```kotlin
"testIntegration", "testIntegrationExec"
-> "monorepoTestIntegration"
```

`testIntegrationDataloader` itself is not in the `displayNameForBaked` map, so it returns `null` and is **hidden from the progress UI entirely**.

**Symptom during a real-Neon gate run:** operator sees `TestIntegration 0.0s ✓` (because the lifecycle alias finishes instantly once its deps complete) while the actual Neon-branch lifecycle work runs invisibly for minutes. The wall-clock for the real work then gets implicitly attributed to whichever later phase happens to be the visible active step (typically `DockerBuild`).

**Friction story (2026-05-11):** during a ~30-min schema gate run with vault auth resolved and `NEON_API_KEY` populated, the progress UI showed `TestIntegration 0.0s ✓` and `DockerBuild 1164.7s ⠋`. Spent significant time wondering if the empty-SHA stamp had short-circuited the test, or if vault auth had silently no-op'd. Only `ps auxww | grep dataloader` revealed 5 active `node .../dataloader -d <pkg>` processes — proving the test was actually running invisibly. Without process-inspection, this read as a false-positive "nothing happened."

**Fix (one line):**

```diff
-        "testIntegration", "testIntegrationExec"
+        "testIntegration", "testIntegrationExec", "testIntegrationDataloader"
         -> "monorepoTestIntegration"
```

Adding it to the existing `monorepoTestIntegration` mapping (rather than a separate display row) is the right shape because `testIntegrationDataloader` IS the integration test for schema/content packages. Wall-clock will then correctly reflect the Neon branch lifecycle time under the `TestIntegration` column instead of leaking into `DockerBuild` or being hidden entirely.

---

### Gap 12 — zbb progress UI spams thousands of phase lines + truncates labels under terminal wrap

- **Severity:** HIGH
- **Category:** BUG (zbb UX, surfaces during any long-running gate)
- **Repo:** `zerobias-org/util` (zbb package)
- **Files referenced:** `packages/zbb/lib/monorepo/Display.ts` — specifically constructor line 222, spinner timer line 829-832, render method line 842-882, `renderPhaseLine()` line 897-929

This is two related rendering bugs that compound during multi-minute gates.

**Bug A — multi-line spinner spam in non-TTY-but-not-detected-as-non-TTY contexts.**

`Display.ts:222` auto-detects TTY:

```typescript
constructor(logsDir: string, isTTY: boolean = process.stdout.isTTY ?? false)
```

The redraw path uses ANSI cursor-up (`\x1b[<N>A`) + clear-line (`\x1b[2K`) sequences for in-place updates:

```typescript
// line 853-854
if (this.lastRowCount > 0) {
  process.stdout.write(`\x1b[${this.lastRowCount}A`);
}
```

Spinner interval is 100ms (line 832 — `~10 renders/second`).

When `isTTY` returns `true` but the consumer doesn't honor ANSI cursor control (slot subshell piping, certain terminal multiplexer modes, captured output via mux/screen, IDE-embedded terminals), every render becomes a NEW appended line instead of an in-place update. Over a ~28-min run × 10 frames/sec → thousands of duplicate `phases: ...` lines accumulated.

**Bug B — terminal-width wrap mangles the in-place redraw (`DockerBuild` → `DockerB`).**

`renderPhaseLine()` (line 897-929) has no width-awareness — it builds the full phase line as `parts.join(...)` with no `process.stdout.columns` check.

As elapsed seconds grow (3-digit → 4-digit, e.g., `1164.7s`), the phase line eventually exceeds terminal width and wraps. ANSI `\x1b[<N>A` moves up N **visual** lines, but a wrapped logical line occupies 2+ visual lines. The cursor-up math is then off — the next render overwrites only the first visual row of the wrap, leaving wrap-remainder content (e.g., the tail of `DockerBuild 1164.7s ...`) as orphan trailing content.

Result: phase label appears truncated to `DockerB` because the cursor-overwrite cuts mid-word.

**Friction story (2026-05-11):** ~30-min gate run produced terminal output where every spinner frame appeared as its own line, plus the `DockerBuild` label got chopped to `DockerB` on every render. Made it look like the gate was wedged when it was actually progressing normally.

**Recommended fixes (independent):**

1. **For Bug A** — stricter TTY check, or explicit `--plain-progress` flag:
   - Require both `process.stdout.isTTY` AND `process.env.TERM && process.env.TERM !== 'dumb'`
   - OR add a `--plain-progress` flag that forces a non-redrawing mode (e.g., one status line every 30s, no in-place updates)
   - OR detect captured-output contexts via `process.env.CI`, `process.env.TERM_PROGRAM`, etc.

2. **For Bug B** — terminal-width awareness in `renderPhaseLine()`:
   - Read `process.stdout.columns`
   - If the rendered line exceeds available width, either truncate completed-phase labels (keep durations, drop names to a short form) OR drop duration suffix on completed phases (`✓ Build 32.7s` → `✓ Build`) OR fall back to a compact form with abbreviated phase names

---

## Gap 13 — Unscoped `zbb gate` from schema repo root rewrites `branch` field on every package's `gate-stamp.json`

- **Severity:** MEDIUM
- **Category:** BUG (cross-package stamp drift; surfaces during normal gate runs and creates review noise)
- **Repo:** `zerobias-org/util` (build-tools — `gate-stamp.json` writer)
- **Files referenced:** the stamp-writer logic in `packages/build-tools/src/main/kotlin/zb.base.gradle.kts` (or wherever `gate-stamp.json` is materialized — locate via `grep -rn "gate-stamp" packages/build-tools/src`)

**Problem:** Running `zbb gate` (or `./gradlew gate`) without a project scope, from the schema repo root, causes the gate to iterate every package in the monorepo. As a side effect, each package's `gate-stamp.json` `branch` field gets rewritten to the current git branch name — even for packages the contributor never touched. Since the stamp's `sourceHash` / `testHash` for schema packages are always-empty (see gap #11 and zbb's known empty-SHA stamp behavior on schema packages), no content actually changed and yet 6+ stamp files end up modified in the working tree.

**Friction story (2026-05-11):** during a Phase 29.5 schema deprecation PR walkthrough, the contributor ran an unscoped `zbb gate` from the schema repo root (to exercise Neon-side validation against vault-resolved credentials). The gate ran cleanly (every package, including the contributor's smemart package, passed). But `git status` afterward showed 6 modified `gate-stamp.json` files spanning packages the contributor had never edited — `hl7/fhir`, `zerobias/schemas/agentskills`, `zerobias/schemas/mcpservers`, `zerobias/zerobias/base`, plus the tombstone hyphenated `w3geekery/sme-mart` package alongside the active `w3geekery/smemart`. The diffs were all single-line: `branch: "feat/gradle-bootstrap"` → `branch: "feat/sme-mart-schema-deprecation-29-5"`. None of those packages had been touched by the contributor.

Result: the contributor had to manually `git restore` 6 unrelated stamp files before staging anything to avoid polluting the PR with cross-package review noise. Without that cleanup, reviewers would have seen a 3-class-deprecation PR also touch unrelated package stamps for unclear reasons.

**Recommended fixes (any one is sufficient):**

1. **Per-package branch tracking only when content changed.** If `sourceHash` and `testHash` are unchanged from the last write, do NOT rewrite the `branch` field either. Only update the stamp when the gate produced new meaningful content to capture.

2. **Hoist branch tracking out of per-package stamps.** Branch is monorepo-level metadata, not package-level. A single repo-root `.gradle-cache/branch-marker.json` (or equivalent) avoids touching N stamp files when only the branch changes.

3. **Document the workaround clearly.** Until either of the above lands, surface the package-scoped form as the canonical local-gate command (`./gradlew :<owner>:<package>:gate` always works; zbb may also support a positional package arg). Could fold into gap #6.

Owner: Daniel Rojas to triage / route to build-tools maintainers. Not a blocker (cleaned up manually for the PR), but creates ongoing friction for every schema contributor doing local gate runs.

---

## Cross-cutting recommendation — suggested doc set for the schema repo

If Daniel wants to plan a single doc-improvement effort that closes the schema-repo-side gaps in one pass, the following file set covers gaps 1–9:

- `README.md` — replace 9-byte stub with quick-start + pointers to deeper docs
- `CLAUDE.md` — rewrite for gradle/zbb pipeline; remove pre-migration references
- `docs/development-setup.md` (NEW) — prerequisites (Java 21, dataloader, zbb, Docker, tokens), slot setup, first-gate run
- `docs/editing-schemas.md` (NEW) — how to add / edit / deprecate / rename / remove classes in an already-migrated package
- `docs/local-vs-ci.md` (NEW) — what the local gate skips, what CI does differently, how to interpret skipped steps, `monorepoGateCheck` vs `publish` semantics
- `docs/conventions.md` (NEW, or fold into `CLAUDE.md`) — package rename / deprecate-without-delete pattern (covers gap 8)
- Delete or rewrite `CONTRIBUTING.md` per Clark's directive

Gaps 11 and 12 are separate (they're in `zerobias-org/util`, not schema repo) and need their own routing to the build-tools / zbb maintainers.
