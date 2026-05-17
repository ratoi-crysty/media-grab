# Handoff — Media Grab download API

## Where to start

- Repo: `git@github.com:ratoi-crysty/media-grab.git`, branch `feat/download-api` (5 commits ahead of `main`, pushed)
- Read in this order before touching code:
  1. `CONTEXT.md` — domain glossary (Download, Queue, Worker slot, Preview)
  2. `docs/adr/0001-two-step-preview-before-download.md`
  3. `docs/adr/0002-file-layout-per-platform-subdir.md`
  4. `docs/adr/0003-no-auth-guard-v1.md`
  5. `CLAUDE.md` (links the skills + agent docs)
  6. Commits on `feat/download-api` from oldest to newest — each has the rationale per phase

## What's done

GitHub issues #1–#5 are implemented (closes in commit messages). Branch builds and boots, end-to-end smoke test passes (file downloads to disk).

- #1 — `feat(api): Phase 0 — scaffolding, deps, env config`
- #2 — `feat(api): Phase 1 — Download entity + repository`
- #3 — `feat(api): Phase 2 — yt-dlp wrapper + /api/health`
- #4 — `feat(api): Phase 3 — GET /api/download/preview`
- #5 — `feat(api): Phase 4 — queue + download lifecycle endpoints`

## What's next (the actual work)

Three GitHub issues, in dependency order. Each has a complete spec; do not redesign:

- **#6 — Phase 5: SSE live stream** — depends on #5 (done). `GET /api/download/stream` emits full `Download` snapshots on every state transition + throttled (~4Hz) progress ticks. NestJS `@Sse()` over an rxjs `Subject<Download>`. Progress lives in memory; never written to SQLite (Q16).
- **#7 — Phase 6: Boot reconciliation** — depends on #5. `onApplicationBootstrap` in DownloadModule (or a small Boot service): for every `downloading` row → set `failed` + `error: 'Interrupted by restart'` + delete partial file, then enqueue all `queued` rows and call `tryDrain()`. The repository helper `markInterruptedOnBoot` is already written and unit-tested.
- **#8 — Phase 7: Frontend wiring** — depends on #4 + #6. Large. Two-step preview UX in `UrlInput`, types renamed `DownloadItem → Download` (use shared `@media-grab/common` types instead of local types.ts duplicates), SSE consumed via `EventSource` in `useDownloads()`, deprecated UI bits (pause/resume/start/open/play) moved (NOT deleted) under `apps/web/src/app/features/media-grab/deprecated/`.

## Implementation plan + slicing

The phase breakdown lives in this conversation summary; the issue bodies (`gh issue view 6/7/8`) are the canonical source.

## Conventions you must follow

- **Singular API URLs**: `/api/download`, not `/api/downloads`. (Memory: `feedback-api-url-singular`.)
- **No annotations on trivial literal constants**: skip `: string`/`: number` when RHS is a literal; keep annotations for function signatures, returns, and non-trivial destructures. (Memory: `feedback-trivial-literal-annotations`.)
- **C-hybrid skill posture**: TypeORM, Swagger decorators, shared model interfaces in `@media-grab/common`, BUT no `AuthGuard` in v1 (ADR-0003). No `@nestjsx/crud` — custom controllers since lifecycle endpoints (preview/cancel/retry) dominate.
- Frontend lives in `apps/web` but Phase 7 is the only piece that touches it. The `apps/web/src/app/shared/api/api.hooks.ts` and `apps/web/src/app/shared/store/store.utils.ts` are pre-existing scaffolding (kept uncommitted on purpose) — flesh them out, don't replace.

## Skills to load in the next session

- `skills:nestjs` — controllers, modules, Swagger, TypeORM (always)
- `skills:typescript-standards` — applies to all .ts (note the trivial-literal exception above)
- `skills:react-components` — only for Phase 7
- `grill-with-docs` — if redesign comes up (don't redesign unless user asks)
- `to-issues` / `triage` — not needed; issues already exist

## Gotchas the previous session hit

These cost real time. Don't re-discover them.

1. **NX zombies.** `pnpm nx serve api` background tasks pile up across runs; subsequent `serve` reports "Waiting for @media-grab/api:serve:development in another nx process" even when no process is bound to port 3000. Fix: before each serve, `pkill -9 -f "media-grab/api\|nx serve api\|run-executor"` and `rm -rf .nx/workspace-data`. Use `NX_DAEMON=false` to avoid the daemon entirely.
2. **NX TS project refs.** When the api imports from `@media-grab/common` for the first time, `pnpm nx sync` is required to add the project ref into `apps/api/tsconfig.app.json`. Without it serve fails with "workspace out of sync."
3. **`better-sqlite3` + `ytdlp-nodejs` native builds.** pnpm ignores their postinstall by default. The `pnpm.onlyBuiltDependencies` array in root `package.json` is what enables them — keep it.
4. **`ytdlp-nodejs@3.4.4` `getVersionAsync()` is broken** (it requires a URL arg). `YtdlpService.detectYtdlpVersion` direct-spawns `<binary> --version` via `spawnSync` and reads stdout. Don't switch back to the lib method.
5. **yt-dlp binary auto-download.** On first boot, `YtdlpService.ensureYtdlpBinary()` calls `helpers.downloadYtDlp()` to fetch the binary into `node_modules/.pnpm/ytdlp-nodejs@3.4.4/node_modules/ytdlp-nodejs/bin/`. Allow ~5–10s on first boot. Subsequent boots find the existing binary.
6. **Filepath capture.** yt-dlp emits the final path via `--print after_move:[MEDIA-GRAB-FILEPATH]%(filepath)s`; the spawn handler greps stdout for that marker. Don't rely on `Destination:` log lines.
7. **`size` and `downloaded` may be 0 for very short downloads.** yt-dlp doesn't emit progress lines if the download finishes in one chunk. Acceptable for v1; SSE in Phase 5 won't help here either.

## Git workflow

User wants one commit per phase, all on the same branch. Pattern (already established):

```
feat(api): Phase N — <summary> (closes #<issue>)

<bullets>

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

Push after each commit. Do NOT open a PR or merge to main — user does that.

## Auth / quota

Anthropic plan with finite quota. Before starting a phase, ask the user for current usage (`/usage`) and decide whether to attempt. Previous session: Phase 0 cost 12%; Phases 1–4 cost ~37% total; expect Phase 5 ~6–8%, Phase 6 ~4–5%, Phase 7 ~11–14%.

## Memory state worth knowing

Stored at `~/.claude/projects/-media-storage-workspace-media-grab/memory/`:

- `feedback_api_url_singular.md`
- `feedback_trivial_literal_annotations.md`

If you have access to memory, these will already be loaded.
