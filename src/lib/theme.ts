/**
 * The "Editorial" look (canvas: "L · Editorial with glass"): an off-white page like a magazine,
 * near-black ink, thin rules, a rust accent, and earthy person colors. Headlines, names and times
 * are set in Instrument Serif (often italic); everything else in Instrument Sans. Buttons and the
 * menu bar float over the page as glass (components/Glass.tsx).
 *
 * There's a light and a dark set of colors. Screens read the current set with `useTheme()`; the
 * choice (System, Light or Dark) is in Settings and applied by components/ThemeProvider.tsx.
 */
import { createContext, useContext } from 'react';

const light = {
  /** Page background: off-white paper. */
  background: '#FAF8F3',
  /** Text boxes and boxed cards: white. */
  card: '#FFFFFF',
  border: '#D9D4C8',
  ink: '#141414',
  muted: '#6B665D',
  /** Chevrons, placeholders, dotted leaders. */
  faint: '#A39E93',
  /** Thin rules between rows. */
  track: '#E6E1D6',
  /** Small tags and the track behind segmented choices. */
  chip: '#EFEBE3',
  chipText: '#3F3B35',
  /** Main actions: rust. */
  accent: '#B23A10',
  accentText: '#A3350E',
  /** Text on an accent-colored button. */
  onAccent: '#FFFFFF',
  /** Marks someone with an allergy or warning. */
  ring: '#B3321E',
  /** Allergies and other warnings. */
  alert: '#F8E0D8',
  alertText: '#93301B',
  alertInk: '#5C1F12',
  /** A medicine or step that's been done. */
  done: '#5B7B4C',
  danger: '#B3321E',
  /** Glass where Apple's Liquid Glass isn't available (components/Glass.tsx). */
  glass: 'rgba(255, 255, 255, 0.92)',
  glassEdge: 'rgba(20, 20, 20, 0.12)',
  shadow: '#141414',
  /** The current tab in the menu bar. */
  selected: 'rgba(20, 20, 20, 0.07)',
  /** Behind a sheet that slides up. */
  backdrop: 'rgba(20, 20, 20, 0.36)',
};

export type Palette = typeof light;

/** The same page at night: warm near-black paper, cream ink, a lighter rust. */
const dark: Palette = {
  background: '#151412',
  card: '#1F1D1A',
  border: '#3B3833',
  ink: '#F1EDE5',
  muted: '#A8A196',
  faint: '#6E6960',
  track: '#2B2925',
  chip: '#2B2925',
  chipText: '#D9D3C7',
  accent: '#E07A4F',
  accentText: '#E8875C',
  onAccent: '#1A0E08',
  ring: '#E06A50',
  alert: '#3A211A',
  alertText: '#F2A389',
  alertInk: '#F6DCD2',
  done: '#8DB07A',
  danger: '#E66A55',
  glass: 'rgba(42, 40, 36, 0.92)',
  glassEdge: 'rgba(255, 255, 255, 0.12)',
  shadow: '#000000',
  selected: 'rgba(255, 255, 255, 0.1)',
  backdrop: 'rgba(0, 0, 0, 0.55)',
};

/** The dark emergency card, the same in light and dark mode. */
export const emergency = {
  background: '#1F1714',
  card: '#33261F',
  call: '#C8402F',
  label: '#E2C2B2',
  heading: '#FFB49E',
  text: '#EADBD2',
  footnote: '#B9A79C',
};

type PersonShades = { soft: string; strong: string; tint: string; ink: string };

/** A color for each person: a soft fill, a strong shade for text and rings, a paler tint. */
const lightPeople = {
  peach: { soft: '#EBCDB7', strong: '#86472A', tint: '#F7EBE1', ink: '#5C3420' },
  sky: { soft: '#CFDCE3', strong: '#355A70', tint: '#EAF0F3', ink: '#2A4555' },
  butter: { soft: '#E9DDB4', strong: '#6E5313', tint: '#F4ECD4', ink: '#4A3808' },
  sage: { soft: '#D3DEC8', strong: '#4E6B3A', tint: '#ECF1E6', ink: '#2F4423' },
  lavender: { soft: '#E2D3DD', strong: '#6E3F5C', tint: '#F3EBF0', ink: '#45263A' },
  rose: { soft: '#EFCFCB', strong: '#8E3B34', tint: '#F8EAE8', ink: '#5A221D' },
} satisfies Record<string, PersonShades>;

/** At night the fills go deep and the strong shades go light. */
const darkPeople: Record<PersonColor, PersonShades> = {
  peach: { soft: '#4A3326', strong: '#E3A783', tint: '#2A211B', ink: '#F0CDB6' },
  sky: { soft: '#2C3B44', strong: '#9DBCD0', tint: '#1D2428', ink: '#CFE0EA' },
  butter: { soft: '#463C22', strong: '#D8BE73', tint: '#27231A', ink: '#EBDDB0' },
  sage: { soft: '#33402B', strong: '#A9C495', tint: '#1F251B', ink: '#D3E2C7' },
  lavender: { soft: '#3F2D39', strong: '#D2A6C3', tint: '#261E24', ink: '#E9D2E1' },
  rose: { soft: '#472B28', strong: '#E6A39C', tint: '#2A1E1D', ink: '#F2D0CC' },
};

export type PersonColor = keyof typeof lightPeople;
export const PERSON_COLORS = Object.keys(lightPeople) as PersonColor[];

/** Names saved by earlier versions of the app. */
const OLD_NAMES: Record<string, PersonColor> = {
  blue: 'sky',
  teal: 'sage',
  purple: 'lavender',
  orange: 'peach',
  green: 'sage',
  pink: 'rose',
};

/** Whether two saved color names are the same color (an old name and its new one). */
export function sameColor(a: string, b: string) {
  return (OLD_NAMES[a] ?? a) === (OLD_NAMES[b] ?? b);
}

export type Scheme = 'light' | 'dark';

export type Theme = {
  scheme: Scheme;
  colors: Palette;
  /** A person's shades, from the color name saved for them. */
  person: (name: string) => PersonShades;
};

export function makeTheme(scheme: Scheme): Theme {
  const people = scheme === 'dark' ? darkPeople : lightPeople;
  return {
    scheme,
    colors: scheme === 'dark' ? dark : light,
    person: (name) => people[(OLD_NAMES[name] ?? name) as PersonColor] ?? people.peach,
  };
}

export const ThemeContext = createContext<Theme>(makeTheme('light'));

/** The colors for light or dark mode, whichever is showing. */
export function useTheme() {
  return useContext(ThemeContext);
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
