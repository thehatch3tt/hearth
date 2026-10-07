/**
 * The "Soft garden" look (row 2 of the design canvas): a pale sage page, round white cards, deep
 * green ink, Nunito, and a soft pastel for each person.
 */

export const colors = {
  /** Page background. */
  background: '#E8EEE4',
  card: '#FFFFFF',
  border: '#D5DFD2',
  ink: '#1F3B2D',
  muted: '#4D6B58',
  /** Chevrons, placeholders, the dashed "Add" circle. */
  faint: '#8AA592',
  /** Small tags and pills ("Wed, Oct 7"). */
  chip: '#E8EEE4',
  chipText: '#2F4A3A',
  /** Main actions: a garden green, dark enough for white text (not black). */
  accent: '#2F5A43',
  accentText: '#2F5A43',
  /** The ring around someone with an allergy or warning. */
  ring: '#D9542B',
  /** Allergies and other warnings. */
  alert: '#FBE3DD',
  alertText: '#8E2414',
  alertInk: '#7A1D10',
  /** A medicine that has been given. */
  done: '#2F7A4F',
  danger: '#B3261E',
};

/** The dark emergency card. */
export const emergency = {
  background: '#1A0F0E',
  card: '#33211F',
  call: '#D93025',
  label: '#E2B8B1',
  heading: '#FF9D8F',
  text: '#E8D6D2',
  footnote: '#B8A4A0',
};

/** A pastel for each person, with a deep shade of it for text, and a paler tint for tags. */
export const personColors = {
  peach: { soft: '#F6C9A8', strong: '#7A3A12', tint: '#FCEBDD', ink: '#5A2E10' },
  sky: { soft: '#BFDCEB', strong: '#1D4E66', tint: '#E3F0F7', ink: '#1D3F52' },
  lavender: { soft: '#E2D3F0', strong: '#4E2E78', tint: '#F1EAF8', ink: '#3E2A5C' },
  sage: { soft: '#C9DFC8', strong: '#2F5A43', tint: '#E6F0E5', ink: '#264535' },
  rose: { soft: '#F4CFD6', strong: '#8A2F45', tint: '#FAE8EC', ink: '#5E2534' },
  butter: { soft: '#F3E2A4', strong: '#6B5410', tint: '#F9F1D3', ink: '#4F3F10' },
} as const;

export type PersonColor = keyof typeof personColors;
export const PERSON_COLORS = Object.keys(personColors) as PersonColor[];

/** Names saved by the first version of the app, before the garden colors. */
const OLD_NAMES: Record<string, PersonColor> = {
  blue: 'sky',
  teal: 'sage',
  purple: 'lavender',
  orange: 'peach',
  green: 'sage',
  pink: 'rose',
};

export function personColor(name: string) {
  return personColors[(OLD_NAMES[name] ?? name) as PersonColor] ?? personColors.peach;
}

/** Nunito, one font file per weight (React Native can't make weights from a single file). */
export const fonts = {
  400: 'Nunito_400Regular',
  500: 'Nunito_500Medium',
  600: 'Nunito_600SemiBold',
  700: 'Nunito_700Bold',
  800: 'Nunito_800ExtraBold',
  900: 'Nunito_900Black',
} as const;

export type Weight = keyof typeof fonts;

export const radius = { card: 24, big: 28, small: 14 };
