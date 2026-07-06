# Source Code Paths

> **Canonical zb/ repo paths live in `~/.claude/docs/projects.md`** (bucketed `com` / `org` / `auditlogic`; tracks the in-flight `~/Projects/zb/` re-home). This doc keeps only **SME-Mart-specific orientation** — fork paths, the SDK dependency chain, npm scopes/registries, Hub-module doc pointers, and sub-app "primary reference" annotations. When you just need "where does zb/ repo X live," defer to that registry instead of duplicating the path here (it only goes stale on the next re-home).

## SME Mart (W3Geekery)

| Name | Path | Notes |
|------|------|-------|
| **SME Mart** (this project) | `~/Projects/w3geekery/zb-forks/org/app/package/w3geekery/sme-mart` | Angular 21 — active |
| **SME Mart Next.js** (deprecated) | `~/Projects/w3geekery/zb-forks/org/app/package/w3geekery/sme-mart-nextjs-deprecated` | Archived, gitignored, on disk for reference |
| **SME Mart Hub Module** | `~/Projects/w3geekery/zb-forks/org/module/package/w3geekery/sme-mart` | Custom Hub Module (may not be needed if Generic SQL suffices). Fork: `origin` w3geekery/module, `upstream` zerobias-org/module |
| **SME Mart Login** | `~/Projects/w3geekery/zb-forks/org/login/package/w3geekery` | **3PO custom login screens (ours)** — fork `origin` w3geekery/login; deploys uat/qa/prod (not ci). NOT `zb-forks/com/login`: that's the ZB **platform** login (ci/uat/qa/prod), a separate repo forked as `w3geekery/login-1` (GitHub name-collision suffix — both forks wanted "login") |
| **SME Mart GQL Schema** | `~/Projects/w3geekery/zb-forks/org/schema/package/w3geekery/smemart` | AuditgraphDB schema in the w3geekery fork of `zerobias-org/schema`. `origin` = w3geekery fork, `upstream` = zerobias-org canonical. **See [SCHEMA_CHANGE_PROCESS.md](SCHEMA_CHANGE_PROCESS.md) before any changes** |

## ZeroBias Platform UI

| Name | Path | Notes |
|------|------|-------|
| **UI Workspace** | `~/Projects/zb/com/ui` | Angular 21 multi-project workspace — **primary reference** for patterns |
| **Portal App** | `~/Projects/zb/com/ui/projects/portal` | Main shell app (bootstrap, routing, iframe host) |
| **Catalog App** | `~/Projects/zb/com/ui/projects/catalog-app` | Good small-app reference for providers/config |
| **neverfail-lib** | `~/Projects/zb/com/ui/projects/neverfail-lib` | Shared component library (services, components, base classes) |
| **ngx-library** (source) | see registry (`org/ngx-library`) | `@zerobias-org/ngx-library` source — check commit log for changes between versions |
| **Theme** | `~/Projects/zb/com/ui/projects/theme` | M3 theme SCSS (`$theme`, `$altTheme`, CSS custom props) |
| **Governance App** | `~/Projects/zb/com/ui/projects/governance-app` | Boundary/task patterns |
| **Boundary Manager** | `~/Projects/zb/com/ui/projects/boundary-manager-app` | Boundary CRUD patterns |
| **Learning Center** | `~/Projects/zb/com/ui/projects/learning-center-app` | Content/catalog patterns |

## ZeroBias Client SDKs

Canonical repo path: **`~/.claude/docs/projects.md`** (`com/clients`). Paths below are **relative to that clients repo** — kept because the package/scope breakdown is sme-mart orientation the registry's single `clients` row doesn't carry.

| Name | Path (under clients repo) | npm Package |
|------|------|-------------|
| **Angular Client** | `packages/angular-client` | `@zerobias-com/zerobias-angular-client` |
| **Client (framework-agnostic)** | `packages/client` | `@zerobias-com/zerobias-client` |
| **SDK (unified entry-point)** | `packages/sdk` | `@zerobias-com/zerobias-sdk` |
| **MCP Server** | `packages/mcp` | MCP tool definitions for ZeroBias |

### Individual Service SDKs (`packages/sdks/`)

| SDK | Path | Scope |
|-----|------|-------|
| `dana` | `sdks/dana` | Auth, users, orgs, PKV, sessions |
| `platform` | `sdks/platform` | Catalog, tags, boundaries, tasks |
| `portal` | `sdks/portal` | Products, navigation, apps |
| `hub` | `sdks/hub` | Connections, modules, scopes |
| `store` | `sdks/store` | Key-value store |
| `graphql` | `sdks/graphql` | GraphQL queries |
| `cardservice` | `sdks/cardservice` | Card service |
| `fileservice` | `sdks/fileservice` | File uploads/downloads |
| `scim` | `sdks/scim` | SCIM provisioning |
| `dataloader` | `sdks/dataloader` | Data loading |
| `hub-events` | `sdks/hub-events` | Hub event streams |
| `platform-events` | `sdks/platform-events` | Platform event streams |
| `fileservice-events` | `sdks/fileservice-events` | File service event streams |

## Hub Module Documentation (Authoritative)

Docs 1-8 live in the **meta-repo** (registry: `com/zerobias`); `Architecture.md` is in the **hub** repo (registry: `com/hub`). Paths below are doc names relative to those repos — base repo path deferred to `~/.claude/docs/projects.md` so this survives re-homes (both already moved: `zerobias` -> `com/zerobias`, `hub` -> `com/hub`).

| Doc | Repo / file | What it covers |
|-----|------|-----------------|
| **HubModules.md** | meta-repo `/HubModules.md` | **Primary authoritative doc** — Connector vs Agent modules, TypeScript vs Docker implementations, consumption patterns, deployment API |
| **Modules.md** | meta-repo `/Modules.md` | Cross-cutting module concepts (Hub + Platform-Service) |
| **ModuleSDKs.md** | meta-repo `/ModuleSDKs.md` | Auto-generated SDKs — consumption patterns, naming (`@auditmation/sdk-<vendor>-<product>`) |
| **ModuleTooling.md** | meta-repo `/ModuleTooling.md` | Code-generation toolchain (OpenAPI → TypeScript) |
| **ModuleNaming.md** | meta-repo `/ModuleNaming.md` | Naming conventions across NPM, Maven, PyPI, Go registries |
| **ModuleAgents.md** | meta-repo `/ModuleAgents.md` | Agent modules (on-node system management, RMM) |
| **PlatformServiceModules.md** | meta-repo `/PlatformServiceModules.md` | Platform-service-flavored modules |
| **LocalDevelopment.md** | meta-repo `/LocalDevelopment.md` | **Cross-package npm link workflow** — essential before local Hub Module iteration |
| **Hub Architecture** | hub repo `/Architecture.md` | (reference) Hub-server internals, Node implementation details |

> **Freshness note (2026-04-17):** Meta-repo docs are from initial commit 2026-01-24. Re-verify against source code in the **hub** repo (registry: `com/hub`) and our **module fork** `~/Projects/w3geekery/zb-forks/org/module/` (we work from the fork, not a canonical `zerobias-org/module` clone — none is kept locally) before committing to implementation decisions — docs may lag code.

## ZeroBias Backend Services

Backend service repo paths (hub, dana, platform, login, devops, util, hydra, fileservice, zerobias) are **deferred to the canonical registry** — see `~/.claude/docs/projects.md`. Duplicating them here just went stale on the `com`/`org` re-home (e.g. `hydra` -> `com/hydra`); the registry tracks each repo's current bucket + move status.

## SDK Dependency Chain

```
@zerobias-com/zerobias-angular-client  →  Angular 21 DI wrappers
  └── @zerobias-com/zerobias-client    →  RxJS observables + framework-agnostic API
       └── @zerobias-com/zerobias-sdk  →  Unified entry-point (re-exports all service SDKs)
            ├── dana-sdk, hub-sdk, platform-sdk, portal-sdk, store-sdk, ...
            └── @zerobias-org/types-core-js

@zerobias-org/ngx-library              →  UI component library (independent of SDK chain)
```

## Private Registries

| Scope | Registry | Auth Env Var |
|-------|----------|-------------|
| `@zerobias-org/*` | `https://pkg.zerobias.org` | `ZB_TOKEN` |
| `@zerobias-com/*` | `https://npm.pkg.github.com` | `GITHUB_TOKEN` |
| `@auditmation/*` | `https://npm.pkg.github.com` | `GITHUB_TOKEN` |
