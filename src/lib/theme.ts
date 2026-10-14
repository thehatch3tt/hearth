/**
 * Left in Love's look ("Evening", chosen 2026-10-14): a deep charcoal with a hint of plum, slightly
 * lighter cards, and one soft champagne accent for icons, progress and the current tab. Outfit, kept
 * light. Mockups: claude.ai/artifact/6s3NrRVxUBF7AWWLLAMBob
 */
export const colors = {
  background: '#15141B',
  card: '#201E29',
  raised: '#2A2735',
  selected: '#34313F',
  line: '#2A2735',
  outline: '#4A4656',
  ink: '#F2EFF5',
  soft: '#DAD6E1',
  muted: '#ABA6B8',
  faint: '#8F8A9C',
  accent: '#D6B77E',
  onAccent: '#1E1810',
  sheet: '#1D1B25',
  bar: '#1A1922',
};

/** Outfit at the weights used (loaded in app/_layout.tsx). */
export const fonts = {
  200: 'Outfit_200ExtraLight',
  300: 'Outfit_300Light',
  400: 'Outfit_400Regular',
  500: 'Outfit_500Medium',
} as const;

export type Weight = keyof typeof fonts;
