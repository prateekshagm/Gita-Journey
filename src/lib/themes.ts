import type { ThemeId } from '../shared/progression.ts';

export interface ThemeTokensPreview {
  bg: string;
  surface: string;
  surfaceSubtle: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentText: string;
  gold: string;
}

export interface ThemeSpec {
  id: ThemeId;
  name: string;
  subtitle: string;
  description: string;
  swatches: [string, string, string, string];
  tokens: ThemeTokensPreview;
}

export const THEME_SPECS: ThemeSpec[] = [
  {
    id: 'krishna',
    name: 'Krishna',
    subtitle: 'Yamuna Indigo & Silver',
    description: 'Deep Yamuna indigo, tranquil sky-blue accents, warm ivory surfaces, and antique gold.',
    swatches: ['#1B436B', '#8D6B1E', '#E9EFF7', '#F3F6FA'],
    tokens: {
      bg: '#f3f6fa',
      surface: '#ffffff',
      surfaceSubtle: '#e9eff7',
      border: '#cedbe9',
      text: '#122136',
      textMuted: '#495d75',
      accent: '#1b436b',
      accentText: '#ffffff',
      gold: '#8d6b1e',
    },
  },
  {
    id: 'radha_shyamasundara',
    name: 'Rādhā-Śyāmasundara',
    subtitle: 'Royal Blue & Temple Gold',
    description: 'Royal indigo-blue, warm sandstone ivory, and muted antique temple gold.',
    swatches: ['#1F3A82', '#9B6C16', '#F1EBE0', '#F9F6F0'],
    tokens: {
      bg: '#f9f6f0',
      surface: '#ffffff',
      surfaceSubtle: '#f1ebe0',
      border: '#ded2be',
      text: '#17233d',
      textMuted: '#52596b',
      accent: '#1f3a82',
      accentText: '#ffffff',
      gold: '#9b6c16',
    },
  },
  {
    id: 'gauranga',
    name: 'Gaurāṅga',
    subtitle: 'Navadvīpa Saffron & Ivory',
    description: 'Warm saffron-amber, luminous ivory paper, and burnished gold accents.',
    swatches: ['#A64B0A', '#9A5B08', '#F6EDE0', '#FCF9F2'],
    tokens: {
      bg: '#fcf9f2',
      surface: '#ffffff',
      surfaceSubtle: '#f6ede0',
      border: '#e6d5b8',
      text: '#2a1e10',
      textMuted: '#66523d',
      accent: '#a64b0a',
      accentText: '#ffffff',
      gold: '#9a5b08',
    },
  },
];

export function getThemeSpec(theme: ThemeId): ThemeSpec {
  return THEME_SPECS.find((t) => t.id === theme) ?? THEME_SPECS[0];
}
