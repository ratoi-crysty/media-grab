# Deprecated UI

Code in this folder is kept for reference and a possible future scope expansion, but is not wired into the current app.

- `useDownloadSimulation.ts` — original mocked progress loop. Replaced by `useDownloads()` + the SSE stream from the API.
- `samples.ts` — seed `DownloadItem[]` for the mocked demo. Replaced by `GET /api/download` on mount.
- `DeprecatedActions.tsx` — the `pause | resume | start | open | play` action buttons. Removed from v1 per the interview (Q5). Kept here so the JSX can be revived quickly if/when pause/resume support lands.

Do not import from this folder in production code paths.
