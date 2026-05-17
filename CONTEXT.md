# Media Grab

A local single-user tool for downloading media (video/audio) from public URLs via `yt-dlp`. NestJS API + React web UI run on the user's machine; files land in a local folder.

## Language

**Download**:
A single media-download request — one URL, one resulting file. Has a lifecycle: `queued → downloading → completed | failed`.
_Avoid_: Job, DownloadItem, Item, Task.

**Queue**:
The ordered list of `Download`s in state `queued`, awaiting a free worker slot.

**Worker slot**:
A concurrency unit. The API runs up to `MAX_PARALLEL` downloads simultaneously; each running `Download` occupies one slot.

**Preview**:
A lightweight metadata lookup (`title`, `uploader`, `duration`, `thumbnailUrl`) performed before a `Download` is created. The user reviews the preview and then confirms, which is what actually creates the `Download`. `thumbnailUrl` is the origin's thumbnail URL (e.g. YouTube CDN); the UI hotlinks it directly — the API does not proxy or cache thumbnail bytes.

## Relationships

- A **Download** occupies one **Worker slot** while in state `downloading`.
- A **Download** in `queued` is in the **Queue**; once a **Worker slot** frees, the next **Download** transitions to `downloading`.
- A **Preview** is a one-shot lookup; it is not persisted and does not become a **Download** until the user confirms.

## File layout

Files land in `DOWNLOAD_DIR` (env var, defaults to `~/Downloads/MediaGrab`), bucketed into a subdirectory per source platform. yt-dlp output template:

```
%(extractor)s/%(uploader)s - %(title)s [%(id)s].%(ext)s
```

Example: `~/Downloads/MediaGrab/youtube/MKBHD - iPhone Review [abc123].mp4`

The trailing `[%(id)s]` is the platform-native video id; it exists solely to avoid filename collisions when the same uploader has two same-titled videos.

## Example dialogue

> **Dev:** "If the API restarts mid-**Download**, what happens to that **Download**?"
> **User:** "Mark it `failed` with reason 'interrupted'. No auto-resume — user can retry."

> **Dev:** "What does pausing a **Download** mean?"
> **User:** "It doesn't. v1 has no pause — only cancel + retry."
