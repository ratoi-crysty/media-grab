// MediaGrab — yt-dlp UI prototype
const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ─────────────────────────────────────────────────────────────────────────────
// Icons (Lucide-style inline SVG)
// ─────────────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, stroke = 2, fill = "none", style, children, viewBox = "0 0 24 24" }) => (
  <svg width={size} height={size} viewBox={viewBox} fill={fill} stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
       style={{ display: "inline-block", flexShrink: 0, ...style }}>
    {d ? <path d={d} /> : children}
  </svg>
);

const Icons = {
  Download: (p) => <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Icon>,
  Pause: (p) => <Icon {...p}><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></Icon>,
  Play: (p) => <Icon {...p} fill="currentColor" stroke="none"><polygon points="6 4 20 12 6 20 6 4"/></Icon>,
  X: (p) => <Icon {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Icon>,
  Folder: (p) => <Icon {...p}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></Icon>,
  Settings: (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></Icon>,
  Sun: (p) => <Icon {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></Icon>,
  Moon: (p) => <Icon {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></Icon>,
  RotateCw: (p) => <Icon {...p}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></Icon>,
  ExternalLink: (p) => <Icon {...p}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></Icon>,
  Trash: (p) => <Icon {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></Icon>,
  AlertCircle: (p) => <Icon {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></Icon>,
  Check: (p) => <Icon {...p}><polyline points="20 6 9 17 4 12"/></Icon>,
  CheckCircle: (p) => <Icon {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></Icon>,
  ChevronDown: (p) => <Icon {...p}><polyline points="6 9 12 15 18 9"/></Icon>,
  Link: (p) => <Icon {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></Icon>,
  Plus: (p) => <Icon {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Icon>,
  Music: (p) => <Icon {...p}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></Icon>,
  Search: (p) => <Icon {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Icon>,
  Subtitles: (p) => <Icon {...p}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h4M15 15h2M7 11h2M13 11h4"/></Icon>,
  Sparkles: (p) => <Icon {...p}><path d="M12 3l1.9 4.6L18.5 9.5 14 11.4 12 16l-2-4.6L5.5 9.5l4.6-1.9L12 3z"/><path d="M19 14l.7 1.7L21.5 16.5l-1.8.8L19 19l-.7-1.7L16.5 16.5l1.8-.8L19 14z"/></Icon>,
  Cpu: (p) => <Icon {...p}><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></Icon>,
  Inbox: (p) => <Icon {...p}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></Icon>,
  Command: (p) => <Icon {...p}><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></Icon>,
  Globe: (p) => <Icon {...p}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></Icon>,
};

// Platform icons (brand-shaped)
const PlatformGlyph = ({ platform, size = 14 }) => {
  const s = size;
  if (platform === "youtube") return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="#ff0033"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8z"/><path d="M9.5 15.5l6-3.5-6-3.5v7z" fill="#fff"/></svg>
  );
  if (platform === "vimeo") return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="#1ab7ea"><path d="M23.98 6.4c-.1 2.3-1.7 5.4-4.8 9.4-3.2 4.1-5.9 6.2-8.2 6.2-1.4 0-2.6-1.3-3.6-4-.6-2.4-1.3-4.8-1.9-7.2C5 8.1 4.3 6.8 3.6 6.8c-.2 0-.7.3-1.6.9L1 6.4c1-.9 2-1.8 3-2.7 1.3-1.1 2.3-1.8 3-1.8 1.5-.1 2.4 1 2.7 3.1.4 2.3.6 3.7.8 4.3.5 2.3 1 3.4 1.6 3.4.5 0 1.2-.8 2.1-2.3.9-1.6 1.4-2.8 1.5-3.6.2-1.5-.5-2.2-1.8-2.2-.6 0-1.3.1-2 .4 1.3-4.3 3.8-6.4 7.5-6.3 2.7.1 4 1.9 3.8 5.3z"/></svg>
  );
  if (platform === "tiktok") return (
    <svg width={s} height={s} viewBox="0 0 24 24"><path fill="#25f4ee" d="M19.6 6.7a5.6 5.6 0 0 1-3.4-1.2v8.2a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v2.8a2.8 2.8 0 1 0 2 2.7V2h2.7a5.6 5.6 0 0 0 3.4 4.7z"/><path fill="#fe2c55" d="M20.6 7.7a5.6 5.6 0 0 1-3.4-1.2v8.2a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v2.8a2.8 2.8 0 1 0 2 2.7V3h2.7a5.6 5.6 0 0 0 3.4 4.7z" opacity=".7"/></svg>
  );
  if (platform === "twitch") return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="#9146ff"><path d="M2.5 2L1 5.7v14.5h5V23h2.8l2.8-2.8H16l5-5V2H2.5zM19 14.2l-2.8 2.8h-2.8L10.6 20v-2.8H6.8V3.9H19v10.3zM13 7.4h1.8v5.3H13V7.4zM8.3 7.4H10v5.3H8.3V7.4z"/></svg>
  );
  if (platform === "soundcloud") return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="#ff5500"><path d="M1.5 14.5c0-1 .3-2 .8-2.8.5 1 .8 2 .8 2.8s-.3 1.9-.8 2.7c-.5-.8-.8-1.7-.8-2.7zm2.5-3.7c-.5 1.1-.8 2.4-.8 3.7s.3 2.5.8 3.6c.5-1 .8-2.3.8-3.6s-.3-2.6-.8-3.7zM6 18.6c.5 0 .8-.3.8-.8V11c0-.4-.3-.8-.8-.8s-.8.4-.8.8v6.8c0 .5.3.8.8.8zm2.5-9.4c-.5 0-.8.3-.8.8v8.6c0 .4.3.8.8.8.4 0 .8-.4.8-.8V10c0-.5-.4-.8-.8-.8zm2.5-1.7c-.5 0-.8.3-.8.8v10.3c0 .4.3.8.8.8.4 0 .8-.4.8-.8V8.3c0-.5-.4-.8-.8-.8zm12 4.7c-.4-2.6-2.6-4.5-5.3-4.5-1 0-1.9.2-2.7.7l-.3.1c-.2.1-.2.2-.2.4v10.3c0 .2.1.4.4.4h8.6c1.9 0 3.5-1.6 3.5-3.5 0-1.9-1.4-3.4-3.2-3.5z"/></svg>
  );
  if (platform === "twitter") return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="#fff"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  );
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sample data
// ─────────────────────────────────────────────────────────────────────────────
const PLATFORMS = {
  youtube: { name: "YouTube", color: "#ff0033" },
  vimeo: { name: "Vimeo", color: "#1ab7ea" },
  tiktok: { name: "TikTok", color: "#fe2c55" },
  twitch: { name: "Twitch", color: "#9146ff" },
  soundcloud: { name: "SoundCloud", color: "#ff5500" },
  twitter: { name: "X / Twitter", color: "#ffffff" },
};

const detectPlatform = (url) => {
  if (!url) return null;
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("vimeo.com")) return "vimeo";
  if (u.includes("tiktok.com")) return "tiktok";
  if (u.includes("twitch.tv")) return "twitch";
  if (u.includes("soundcloud.com")) return "soundcloud";
  if (u.includes("twitter.com") || u.includes("x.com")) return "twitter";
  return null;
};

const isValidUrl = (s) => {
  try { new URL(s.trim()); return true; } catch { return false; }
};

// Generate a placeholder thumbnail via canvas-y SVG with gradient + title text
const thumbSvg = (title, hue) => {
  const safe = (title || "").replace(/[<>&]/g, "");
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180">
       <defs>
         <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
           <stop offset="0" stop-color="hsl(${hue}, 70%, 32%)"/>
           <stop offset="1" stop-color="hsl(${(hue+40)%360}, 70%, 18%)"/>
         </linearGradient>
       </defs>
       <rect width="320" height="180" fill="url(#g)"/>
       <circle cx="55" cy="135" r="60" fill="hsl(${(hue+20)%360}, 80%, 50%)" opacity=".35"/>
       <circle cx="270" cy="40" r="38" fill="hsl(${(hue+90)%360}, 80%, 55%)" opacity=".35"/>
     </svg>`
  )}`;
};

const initialItemsMixed = () => [
  {
    id: "i1", platform: "youtube",
    title: "Building a Type System from Scratch — Compiler Series Ep. 04",
    uploader: "Low Level Academy", duration: "47:12",
    format: "MP4", quality: "1080p", size: 184_300_000,
    status: "downloading", downloaded: 78_400_000, speed: 4_200_000, hue: 210,
    url: "https://youtu.be/build-type-system",
  },
  {
    id: "i2", platform: "vimeo",
    title: "Kinfolk — A Quiet Sunday Morning in Copenhagen",
    uploader: "Kinfolk Studio", duration: "08:34",
    format: "MP4", quality: "1080p", size: 412_000_000,
    status: "queued", downloaded: 0, speed: 0, hue: 30,
    url: "https://vimeo.com/345678",
  },
  {
    id: "i3", platform: "youtube",
    title: "lo-fi hip hop radio — beats to relax/study to",
    uploader: "Lofi Girl", duration: "∞ live",
    format: "MP3", quality: "320kbps", size: 12_400_000,
    status: "completed", downloaded: 12_400_000, speed: 0, hue: 285,
    url: "https://youtu.be/lofi-radio",
    completedAt: Date.now() - 1000 * 60 * 8,
  },
  {
    id: "i4", platform: "tiktok",
    title: "POV: when the espresso machine finally arrives 😤☕",
    uploader: "@cafe.minimo", duration: "0:23",
    format: "MP4", quality: "1080p", size: 8_200_000,
    status: "completed", downloaded: 8_200_000, speed: 0, hue: 340,
    url: "https://tiktok.com/@cafe.minimo/video/123",
    completedAt: Date.now() - 1000 * 60 * 22,
  },
  {
    id: "i5", platform: "twitch",
    title: "VOD: Speedrunning Hollow Knight — Any% Glitchless WR Attempts",
    uploader: "fireb0rn", duration: "3:42:08",
    format: "MP4", quality: "720p", size: 2_400_000_000,
    status: "failed", downloaded: 320_000_000, speed: 0, hue: 270,
    url: "https://twitch.tv/videos/9988776",
    error: "HTTP 403 — VOD is subscriber-only. Try logging in via cookies file.",
  },
  {
    id: "i6", platform: "soundcloud",
    title: "Floating Points — Crush (Live at Printworks, 2024)",
    uploader: "Floating Points", duration: "52:18",
    format: "MP3", quality: "320kbps", size: 124_800_000,
    status: "downloading", downloaded: 41_200_000, speed: 1_800_000, hue: 18,
    url: "https://soundcloud.com/fp/crush-live",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Formatters
// ─────────────────────────────────────────────────────────────────────────────
const fmtBytes = (b) => {
  if (b == null) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

const fmtSpeed = (bps) => bps ? `${fmtBytes(bps)}/s` : "—";

const fmtEta = (sec) => {
  if (!isFinite(sec) || sec <= 0) return "—";
  if (sec < 60) return `${Math.round(sec)}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
  return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`;
};

const fmtRelative = (ts) => {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

Object.assign(window, { Icons, PlatformGlyph, PLATFORMS, detectPlatform, isValidUrl, thumbSvg, initialItemsMixed, fmtBytes, fmtSpeed, fmtEta, fmtRelative });
