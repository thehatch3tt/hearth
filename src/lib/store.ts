/**
 * Everything someone writes, kept on the phone in one record (lib/kv.ts). Nothing leaves the device;
 * sharing with family comes later.
 */
import { useSyncExternalStore } from 'react';

import { getItem, setItem } from './kv';

import { PAGES } from './content';

export type Entry = { id: string; title: string; note: string };
/** A recording (its sound is a file named by its id: lib/media.ts). */
export type VoiceNote = { id: string; title: string; seconds: number; createdAt: string };
/** A photo (a file named by its id: lib/media.ts), with a few words about it. */
export type Photo = { id: string; caption?: string };
export type PageData = { body?: string; entries?: Entry[]; voice?: VoiceNote[]; photos?: Photo[]; done?: boolean; updatedAt?: string };

export type Opens = { kind: 'handbook' } | { kind: 'date'; date: string } | { kind: 'moment'; moment: string };
export type Letter = { id: string; to: string; body: string; opens: Opens; voice?: VoiceNote[]; updatedAt: string };

export type Person = { id: string; name: string; relation: string; access: 'now' | 'later' };

export type Data = {
  welcomed: boolean;
  name: string;
  /** Whose handbook this is. */
  whose: 'mine' | 'helping' | 'together';
  pages: Record<string, PageData>;
  letters: Letter[];
  people: Person[];
  /** How many days to wait, after someone asks to open the handbook, before it opens. */
  waitDays: 3 | 7 | 14;
  /** Ask for Face ID (or the phone passcode) when the app opens (components/LockGate.tsx). */
  lock: boolean;
};

const KEY = 'left-in-love';

const EMPTY: Data = { welcomed: false, name: '', whose: 'mine', pages: {}, letters: [], people: [], waitDays: 7, lock: false };

function load(): Data {
  try {
    const raw = getItem(KEY);
    if (!raw) return EMPTY;
    const saved = JSON.parse(raw) as Partial<Data>;
    return { ...EMPTY, ...saved, pages: saved.pages ?? {}, letters: saved.letters ?? [], people: saved.people ?? [] };
  } catch {
    return EMPTY;
  }
}

let data: Data | null = null;
const listeners = new Set<() => void>();

export function getData(): Data {
  data ??= load();
  return data;
}

export function update(change: (current: Data) => Data) {
  data = change(getData());
  try {
    setItem(KEY, JSON.stringify(data));
  } catch {
    // Saving failed (storage full?): keep going with what's in memory.
  }
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useData = () => useSyncExternalStore(subscribe, getData, getData);

export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function updatePage(id: string, change: (page: PageData) => PageData) {
  update((current) => ({
    ...current,
    pages: { ...current.pages, [id]: { ...change(current.pages[id] ?? {}), updatedAt: new Date().toISOString() } },
  }));
}

/** Whether a page has anything written on it, and whether it's been marked done. */
export function pageState(page: PageData | undefined): 'done' | 'started' | 'empty' {
  if (page?.done) return 'done';
  if (page?.body?.trim() || page?.entries?.length || page?.voice?.length || page?.photos?.length) return 'started';
  return 'empty';
}

/** How far along the handbook is, and the page to suggest next (the first started, else the first empty). */
export function progress(current: Data) {
  const states = PAGES.map((page) => ({ page, state: pageState(current.pages[page.id]) }));
  const done = states.filter((item) => item.state === 'done').length;
  const next = states.find((item) => item.state === 'started') ?? states.find((item) => item.state === 'empty');
  return { done, total: PAGES.length, next: next?.page };
}

export function saveLetter(letter: Letter) {
  update((current) => {
    const exists = current.letters.some((item) => item.id === letter.id);
    const saved = { ...letter, updatedAt: new Date().toISOString() };
    return { ...current, letters: exists ? current.letters.map((item) => (item.id === letter.id ? saved : item)) : [...current.letters, saved] };
  });
}

/** How a letter's opening reads ("Opens: Their wedding day", "Opens on June 14, 2030"; the date is written as the person likes). */
export function opensText(opens: Opens) {
  if (opens.kind === 'handbook') return 'Opens with the handbook';
  if (opens.kind === 'date') return opens.date.trim() ? `Opens on ${opens.date.trim()}` : 'Opens on a date you choose';
  return `Opens: ${opens.moment}`;
}

export const startOver = () => update(() => EMPTY);

/** Puts back everything from a backup (lib/backup.ts), keeping the welcome done. */
export const restore = (saved: Partial<Data>) =>
  update(() => ({ ...EMPTY, ...saved, pages: saved.pages ?? {}, letters: saved.letters ?? [], people: saved.people ?? [], welcomed: true }));

/** Every recording and photo the handbook uses, for backups. */
export function mediaIds(current: Data) {
  const pages = Object.values(current.pages);
  return {
    voice: [...pages.flatMap((page) => page.voice ?? []), ...current.letters.flatMap((letter) => letter.voice ?? [])].map((note) => note.id),
    photos: pages.flatMap((page) => page.photos ?? []).map((photo) => photo.id),
  };
}
