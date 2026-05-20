import type { KnownPlatform } from '../types';

export interface PlatformMeta {
  name: string;
  color: string;
}

export const PLATFORMS: Record<KnownPlatform, PlatformMeta> = {
  youtube: { name: 'YouTube', color: '#ff0033' },
  vimeo: { name: 'Vimeo', color: '#1ab7ea' },
  tiktok: { name: 'TikTok', color: '#fe2c55' },
  twitch: { name: 'Twitch', color: '#9146ff' },
  soundcloud: { name: 'SoundCloud', color: '#ff5500' },
  twitter: { name: 'X / Twitter', color: '#ffffff' },
};

const FALLBACK_META: PlatformMeta = { name: 'Web', color: '#888888' };

export const platformMeta = (platform: string): PlatformMeta =>
  PLATFORMS[platform as KnownPlatform] ?? FALLBACK_META;

export const detectPlatform = (url: string): KnownPlatform | null => {
  if (!url) return null;
  const u: string = url.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('vimeo.com')) return 'vimeo';
  if (u.includes('tiktok.com')) return 'tiktok';
  if (u.includes('twitch.tv')) return 'twitch';
  if (u.includes('soundcloud.com')) return 'soundcloud';
  if (u.includes('twitter.com') || u.includes('x.com')) return 'twitter';
  return null;
};

export const isValidUrl = (s: string): boolean => {
  try {
    new URL(s.trim());
    return true;
  } catch {
    return false;
  }
};
