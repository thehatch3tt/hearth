/**
 * The "Editorial" look (canvas: "L · Editorial with glass"): an off-white page like a magazine,
 * near-black ink, thin rules, a rust accent, and earthy person colors. Headlines, names and times
 * are set in Instrument Serif (often italic); everything else in Instrument Sans. Buttons and the
 * menu bar float over the page as glass (components/Glass.tsx).
 */

export const colors = {
  /** Page background: off-white paper. */
  background: '#FAF8F3',
  /** Cards and tiles: white. */
  card: '#FFFFFF',
  border: '#D9D4C8',
  ink: '#141414',
  muted: '#6B665D',
  /** Chevrons, placeholders, dotted leaders. */
  faint: '#A39E93',
  /** Thin rules between rows, and the empty part of progress bars. */
  track: '#E6E1D6',
  /** Small tags and unselected choices. */
  chip: '#EFEBE3',
  chipText: '#3F3B35',
  /** Main actions: rust, dark enough for white text. */
  accent: '#B23A10',
  accentText: '#A3350E',
  /** Marks someone with an allergy or warning. */
  ring: '#B3321E',
  /** Allergies and other warnings. */
  alert: '#F8E0D8',
  alertText: '#93301B',
  alertInk: '#5C1F12',
  /** A medicine or step that's been done. */
  done: '#5B7B4C',
  danger: '#B3321E',
};

/** The dark emergency card. */
export const emergency = {
  background: '#1F1714',
  card: '#33261F',
  call: '#C8402F',
  label: '#E2C2B2',
  heading: '#FFB49E',
  text: '#EADBD2',
  footnote: '#B9A79C',
};

/** A color for each person: a soft fill, a strong shade for text and rings, a paler tint. */
export const personColors = {
  peach: { soft: '#EBCDB7', strong: '#86472A', tint: '#F7EBE1', ink: '#5C3420' },
  sky: { soft: '#CFDCE3', strong: '#355A70', tint: '#EAF0F3', ink: '#2A4555' },
  butter: { soft: '#E9DDB4', strong: '#6E5313', tint: '#F4ECD4', ink: '#4A3808' },
  sage: { soft: '#D3DEC8', strong: '#4E6B3A', tint: '#ECF1E6', ink: '#2F4423' },
  lavender: { soft: '#E2D3DD', strong: '#6E3F5C', tint: '#F3EBF0', ink: '#45263A' },
  rose: { soft: '#EFCFCB', strong: '#8E3B34', tint: '#F8EAE8', ink: '#5A221D' },
} as const;

export type PersonColor = keyof typeof personColors;
export const PERSON_COLORS = Object.keys(personColors) as PersonColor[];

/** Names saved by earlier versions of the app. */
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

/**
 * Instrument Sans, one font file per weight (React Native can't make weights from a single file).
 * It stops at bold, so the heavier weights screens ask for are set in bold.
 */
export const fonts = {
  400: 'InstrumentSans_400Regular',
  500: 'InstrumentSans_500Medium',
  600: 'InstrumentSans_600SemiBold',
  700: 'InstrumentSans_700Bold',
  800: 'InstrumentSans_700Bold',
  900: 'InstrumentSans_700Bold',
} as const;

/** Instrument Serif, for headlines, names and times. It has one weight, upright and italic. */
export const serif = { regular: 'InstrumentSerif_400Regular', italic: 'InstrumentSerif_400Regular_Italic' } as const;

export type Weight = keyof typeof fonts;

export const radius = { card: 24, big: 28, small: 14 };

/** The floating menu bar at the bottom of the tab screens (components/TabBar.tsx). */
export const tabBar = { height: 64, gap: 10 };

/** Room to leave under a tab screen's content so the end can scroll clear of the menu bar. */
export const TAB_BAR_SPACE = tabBar.height + 24;
