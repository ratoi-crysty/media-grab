import { memo } from 'react';

export interface PlatformGlyphProps {
  platform: string | null;
  size?: number;
}

export const PlatformGlyph = memo(function PlatformGlyph({
  platform,
  size = 14,
}: PlatformGlyphProps) {
  const s = size;
  if (platform === 'youtube')
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="#ff0033">
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8z" />
        <path d="M9.5 15.5l6-3.5-6-3.5v7z" fill="#fff" />
      </svg>
    );
  if (platform === 'vimeo')
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="#1ab7ea">
        <path d="M23.98 6.4c-.1 2.3-1.7 5.4-4.8 9.4-3.2 4.1-5.9 6.2-8.2 6.2-1.4 0-2.6-1.3-3.6-4-.6-2.4-1.3-4.8-1.9-7.2C5 8.1 4.3 6.8 3.6 6.8c-.2 0-.7.3-1.6.9L1 6.4c1-.9 2-1.8 3-2.7 1.3-1.1 2.3-1.8 3-1.8 1.5-.1 2.4 1 2.7 3.1.4 2.3.6 3.7.8 4.3.5 2.3 1 3.4 1.6 3.4.5 0 1.2-.8 2.1-2.3.9-1.6 1.4-2.8 1.5-3.6.2-1.5-.5-2.2-1.8-2.2-.6 0-1.3.1-2 .4 1.3-4.3 3.8-6.4 7.5-6.3 2.7.1 4 1.9 3.8 5.3z" />
      </svg>
    );
  if (platform === 'tiktok')
    return (
      <svg width={s} height={s} viewBox="0 0 24 24">
        <path
          fill="#25f4ee"
          d="M19.6 6.7a5.6 5.6 0 0 1-3.4-1.2v8.2a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v2.8a2.8 2.8 0 1 0 2 2.7V2h2.7a5.6 5.6 0 0 0 3.4 4.7z"
        />
        <path
          fill="#fe2c55"
          d="M20.6 7.7a5.6 5.6 0 0 1-3.4-1.2v8.2a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v2.8a2.8 2.8 0 1 0 2 2.7V3h2.7a5.6 5.6 0 0 0 3.4 4.7z"
          opacity=".7"
        />
      </svg>
    );
  if (platform === 'twitch')
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="#9146ff">
        <path d="M2.5 2L1 5.7v14.5h5V23h2.8l2.8-2.8H16l5-5V2H2.5zM19 14.2l-2.8 2.8h-2.8L10.6 20v-2.8H6.8V3.9H19v10.3zM13 7.4h1.8v5.3H13V7.4zM8.3 7.4H10v5.3H8.3V7.4z" />
      </svg>
    );
  if (platform === 'soundcloud')
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="#ff5500">
        <path d="M1.5 14.5c0-1 .3-2 .8-2.8.5 1 .8 2 .8 2.8s-.3 1.9-.8 2.7c-.5-.8-.8-1.7-.8-2.7zm2.5-3.7c-.5 1.1-.8 2.4-.8 3.7s.3 2.5.8 3.6c.5-1 .8-2.3.8-3.6s-.3-2.6-.8-3.7zM6 18.6c.5 0 .8-.3.8-.8V11c0-.4-.3-.8-.8-.8s-.8.4-.8.8v6.8c0 .5.3.8.8.8zm2.5-9.4c-.5 0-.8.3-.8.8v8.6c0 .4.3.8.8.8.4 0 .8-.4.8-.8V10c0-.5-.4-.8-.8-.8zm2.5-1.7c-.5 0-.8.3-.8.8v10.3c0 .4.3.8.8.8.4 0 .8-.4.8-.8V8.3c0-.5-.4-.8-.8-.8zm12 4.7c-.4-2.6-2.6-4.5-5.3-4.5-1 0-1.9.2-2.7.7l-.3.1c-.2.1-.2.2-.2.4v10.3c0 .2.1.4.4.4h8.6c1.9 0 3.5-1.6 3.5-3.5 0-1.9-1.4-3.4-3.2-3.5z" />
      </svg>
    );
  if (platform === 'twitter')
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="#fff">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  );
});
