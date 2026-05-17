---
status: accepted
---

# Two-step preview before creating a Download

Adding a media URL is a two-step flow: the client first calls `GET /api/download/preview?url=...` to fetch `{title, uploader, duration, thumbnailUrl}`, the user reviews it, and only then `POST /api/download` creates a `Download` row. The optimistic-add alternative (POST immediately with a placeholder row that resolves async via SSE) was rejected so that bad URLs surface as a clean preview failure (`4xx`) rather than a failed-row in the queue, and so the user sees the *actual* video before committing — preventing committed-then-wrong-video downloads.

## Consequences

- The UI gains a confirm step that the mocked design does not have today; `UrlInput` and the optimistic-row code path in `MediaGrab` will need to be reshaped.
- Bad-URL feedback is synchronous (HTTP error on preview) instead of asynchronous (failed row), which is more aligned with how users naturally retry-on-mistake.
- Preview is a one-shot, non-persisted lookup. It is not a `Download` and has no row in SQLite.
