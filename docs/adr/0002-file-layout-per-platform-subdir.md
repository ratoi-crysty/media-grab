---
status: accepted
---

# Files are organized into per-platform subdirectories

Downloads land in `DOWNLOAD_DIR/<platform>/<uploader> - <title> [<id>].<ext>` via the yt-dlp output template `%(extractor)s/%(uploader)s - %(title)s [%(id)s].%(ext)s`. The `[<id>]` suffix is the platform-native video id and exists solely to prevent collisions between same-titled videos. Flat layout was rejected because the folder becomes unmanageable as the library grows; per-uploader layout was rejected because most users have many one-off downloads from many uploaders, leaving the folder full of single-file directories.

## Consequences

- Changing the layout later requires either a migration script or accepting that pre-change files stay where they are. Users may organize on top of this layout (e.g. symlinks), so the contract is observable.
- yt-dlp's `extractor` value (lowercase `youtube`, `vimeo`, etc.) becomes part of the contract; if a future yt-dlp rename happens, files for the renamed extractor will land in a new subdir.
- The frontend `Download` row should expose the resolved on-disk path (or at least the directory) so the user can find files even after the row is removed.
