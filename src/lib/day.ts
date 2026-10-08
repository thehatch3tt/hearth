/**
 * Today's list, shared by the Today tab and the whole-day page: every timed medicine and every
 * routine step, in time order, each marked done or not, and the way to tick one off.
 */
import { type SQLiteDatabase, useSQLiteContext } from 'expo-sqlite';
import { Alert as Confirm } from 'react-native';

import { deleteRow, insertRow, type Person, useQuery, useSettings } from '@/lib/db';
import { formatTime, minutesUntil, todayKey } from '@/lib/time';

/** One thing to do today: a timed medicine or a routine step. */
export type DayItem = {
  key: string;
  kind: 'medicine' | 'step';
  id: number;
  personId: number;
  /** "HH:MM", or empty for a step with no time. */
  time: string;
  title: string;
  note: string;
  /** The dose or check that marks it done today, if it's done. */
  doneId: number | null;
};

/** Marks an item done now. Outside the component because it reads the clock. */
function markDone(db: SQLiteDatabase, item: DayItem, by: string) {
  if (item.kind === 'medicine') {
    return insertRow(db, 'doses', { medicine_id: item.id, day: todayKey(), given_at: Date.now(), given_by: by });
  }
  return insertRow(db, 'step_checks', { step_id: item.id, day: todayKey(), done_at: Date.now(), done_by: by });
}

function markNotDone(db: SQLiteDatabase, item: DayItem) {
  if (item.doneId === null) return;
  return deleteRow(db, item.kind === 'medicine' ? 'doses' : 'step_checks', item.doneId);
}

/** "in 25 minutes", "now", "was due 8:00 am", "at 5:30 pm" */
export function whenText(time: string) {
  const minutes = minutesUntil(time);
  if (minutes > 90) return `at ${formatTime(time)}`;
  if (minutes > 1) return `in ${minutes} minutes`;
  if (minutes >= -5) return 'now';
  return `was due ${formatTime(time)}`;
}

/** Which part of the day a time falls in, for the whole-day page. */
export function partOfDay(time: string) {
  if (!time) return 'Any time';
  const hour = Number(time.slice(0, 2));
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

export function useDay() {
  const db = useSQLiteContext();
  const settings = useSettings();
  const today = todayKey();

  const people = useQuery<Person>('SELECT * FROM people ORDER BY sort, id');
  const medicines = useQuery<{ id: number; person_id: number; name: string; time: string; note: string; dose_id: number | null }>(
    `SELECT id, person_id, name, time, note,
       (SELECT d.id FROM doses d WHERE d.medicine_id = m.id AND d.day = ? LIMIT 1) AS dose_id
     FROM medicines m WHERE time != '' AND name != ''`,
    [today],
  );
  const steps = useQuery<{ id: number; person_id: number; time: string; text: string; note: string; check_id: number | null }>(
    `SELECT s.id, s.person_id, s.time, s.text, s.note,
       (SELECT c.id FROM step_checks c WHERE c.step_id = s.id AND c.day = ? LIMIT 1) AS check_id
     FROM routine_steps s JOIN routines r ON r.id = s.routine_id WHERE s.text != ''`,
    [today],
  );

  const byId = new Map(people?.map((p) => [p.id, p]));
  const items: DayItem[] = [
    ...(medicines ?? []).map((m) => ({
      key: `m${m.id}`,
      kind: 'medicine' as const,
      id: m.id,
      personId: m.person_id,
      time: m.time,
      title: m.name,
      note: m.note,
      doneId: m.dose_id,
    })),
    ...(steps ?? []).map((s) => ({
      key: `s${s.id}`,
      kind: 'step' as const,
      id: s.id,
      personId: s.person_id,
      time: s.time,
      title: s.text,
      note: s.note,
      doneId: s.check_id,
    })),
  ]
    .filter((item) => byId.has(item.personId))
    // In time order, untimed steps last; medicine first when the times match.
    .sort((a, b) => (a.time || '99').localeCompare(b.time || '99') || (a.kind === 'medicine' ? -1 : 1));

  const open = items.filter((item) => item.doneId === null);
  const done = items.filter((item) => item.doneId !== null);
  const next = open.find((item) => item.time) ?? open[0];
  const me = settings.my_name?.trim() ?? '';

  /** Ticks an item off, or (after asking, for a medicine) unticks it. */
  function toggle(item: DayItem) {
    if (item.doneId === null) return markDone(db, item, me);
    if (item.kind === 'step') return markNotDone(db, item);
    Confirm.alert(`Undo ${item.title}?`, 'This marks it as not given today.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Not given', style: 'destructive', onPress: () => markNotDone(db, item) },
    ]);
  }

  return { people, byId, items, open, done, next, toggle, settings };
}
