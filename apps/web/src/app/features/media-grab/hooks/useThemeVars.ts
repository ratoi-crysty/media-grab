import { useEffect } from 'react';

export interface AccentPreset {
  name: string;
  a: string;
  b: string;
}

export const ACCENT_PRESETS: Record<string, AccentPreset> = {
  '#5b8cff': { name: 'Linear Blue', a: '#5b8cff', b: '#8b5cf6' },
  '#8b5cf6': { name: 'Electric Purple', a: '#8b5cf6', b: '#ec4899' },
  '#22d3ee': { name: 'Cyan', a: '#22d3ee', b: '#3b82f6' },
  '#f59e0b': { name: 'Amber', a: '#f59e0b', b: '#ef4444' },
  '#10b981': { name: 'Emerald', a: '#10b981', b: '#06b6d4' },
};

const DEFAULT_PRESET = ACCENT_PRESETS['#5b8cff'];

export const useThemeVars = (accent: string, dark: boolean): void => {
  useEffect(() => {
    const root = document.documentElement;
    const preset = ACCENT_PRESETS[accent] ?? DEFAULT_PRESET;
    root.style.setProperty('--accent', preset.a);
    root.style.setProperty('--accent-2', preset.b);
    root.dataset['theme'] = dark ? 'dark' : 'light';
  }, [accent, dark]);
};
