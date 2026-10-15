/**
 * Everything someone writes, kept on the phone in one record (lib/kv.ts). Nothing leaves the device
 * unless they send it themselves (a backup file or a PDF).
 */
import { useSyncExternalStore } from 'react';

import { getItem, setItem } from './kv';

import { MERGED, PAGES } from './content';

export type Entry = { id: string; title: string; note: string };
/** A recording (its sound is a file named by its id: lib/media.ts). */
export type VoiceNote = { id: string; title: string; seconds: number; createdAt: string };
/** A photo (a file named by its id: lib/media.ts), with a few words about it. */
export type Photo = { id: string; caption?: string };
/** `fields` holds a fields page's answers by field id (lib/content.ts). */
export type PageData = { body?: string; entries?: Entry[]; fields?: Record<string, string>; voice?: VoiceNote[]; photos?: Photo[]; updatedAt?: string };

export type Opens = { kind: 'handbook' } | { kind: 'date'; date: string } | { kind: 'moment'; moment: string };
export type Letter = { id: string; to: string; body: string; opens: Opens; voice?: VoiceNote[]; updatedAt: string };

export type Person = { id: string; name: string; relation: string };

export type Data = {
  welcomed: boolean;
  name: string;
  /** Whose handbook this is. */
  whose: 'mine' | 'helping' | 'together';
  pages: Record<string, PageData>;
  letters: Letter[];
  people: Person[];
  /** Ask for Face ID (or the phone passcode) when the app opens (components/LockGate.tsx). */
  lock: boolean;
};

const KEY = 'left-in-love';

const EMPTY: Data = { welcomed: false, name: '', whose: 'mine', pages: {}, letters: [], people: [], lock: false };

/** Moves writing from pages that were folded into another (content.ts MERGED) onto the page they became. */
function merge(pages: Record<string, PageData>) {
  const out = { ...pages };
  for (const [from, to] of Object.entries(MERGED)) {
    const old = out[from];
    if (!old) continue;
    const into = out[to] ?? {};
    const body = [into.body?.trim(), old.body?.trim()].filter(Boolean).join('\n\n');
    out[to] = {
      ...into,
      body: body || undefined,
      entries: [...(into.entries ?? []), ...(old.entries ?? [])],
      voice: [...(into.voice ?? []), ...(old.voice ?? [])],
      photos: [...(into.photos ?? []), ...(old.photos ?? [])],
      updatedAt: [into.updatedAt, old.updatedAt].filter(Boolean).sort().pop(),
    };
    delete out[from];
  }
  return out;
}

function load(): Data {
  try {
    const raw = getItem(KEY);
    if (!raw) return EMPTY;
    const saved = JSON.parse(raw) as Partial<Data>;
    return { ...EMPTY, ...saved, pages: merge(saved.pages ?? {}), letters: saved.letters ?? [], people: saved.people ?? [] };
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

/** Whether a page has anything on it yet. There's no finishing a page: something written is enough. */
export const isWritten = (page: PageData | undefined) =>
  !!(page?.body?.trim() || page?.entries?.some((entry) => entry.title.trim() || entry.note.trim()) || Object.values(page?.fields ?? {}).some((value) => value.trim()) || page?.voice?.length || page?.photos?.length);

/** How many pages have something on them, and the first page that doesn't (in handbook order). */
export function progress(current: Data) {
  const written = PAGES.filter((page) => isWritten(current.pages[page.id])).length;
  const next = PAGES.find((page) => !isWritten(current.pages[page.id]));
  return { written, total: PAGES.length, next };
}

/** A line about what a page holds, for lists: its first words ("Carol, Sam, Jean"), then "2 photos · a voice note". */
export function pageSummary(page: PageData | undefined) {
  const count = (n: number, one: string, many: string) => (n === 1 ? one : `${n} ${many}`);
  const first = (text: string) => {
    const line = text.trim().split('\n')[0] ?? '';
    return line.length > 70 ? `${line.slice(0, 68).trimEnd()}…` : line;
  };
  const entries = (page?.entries ?? []).map((entry) => entry.title.trim()).filter(Boolean);
  const fields = Object.values(page?.fields ?? {}).map((value) => value.trim()).filter(Boolean);
  const parts = [
    entries.length ? first(entries.join(', ')) : fields.length ? first(fields.join(' · ')) : page?.body?.trim() ? first(page.body) : '',
    page?.photos?.length ? count(page.photos.length, 'a photo', 'photos') : '',
    page?.voice?.length ? count(page.voice.length, 'a voice note', 'voice notes') : '',
  ];
  return parts.filter(Boolean).join(' · ');
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
  update(() => ({ ...EMPTY, ...saved, pages: merge(saved.pages ?? {}), letters: saved.letters ?? [], people: saved.people ?? [], welcomed: true }));

/** Every recording and photo the handbook uses, for backups. */
export function mediaIds(current: Data) {
  const pages = Object.values(current.pages);
  return {
    voice: [...pages.flatMap((page) => page.voice ?? []), ...current.letters.flatMap((letter) => letter.voice ?? [])].map((note) => note.id),
    photos: pages.flatMap((page) => page.photos ?? []).map((photo) => photo.id),
  };
}
