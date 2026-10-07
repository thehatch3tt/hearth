/**
 * The handbook lives in one SQLite database on the phone (expo-sqlite). Nothing here leaves the
 * device; sharing comes later and will sync only the pages someone chooses to share.
 */
import { type SQLiteBindValue, type SQLiteDatabase, useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState, useSyncExternalStore } from 'react';

export const DATABASE_NAME = 'hearth.db';

export type PersonKind = 'child' | 'adult';

export type Person = {
  id: number;
  name: string;
  kind: PersonKind;
  color: string;
  /** Free text, e.g. "6" or "81". */
  age: string;
  /** Free text, e.g. "1st grade · 45 lb" or "Lives at home · Uses a walker". */
  about: string;
  /** No longer used: from before a person could have several routines (see `routines`). */
  routine_name: string;
  sort: number;
};

/** Allergies and other things a helper must know. Also shown on the emergency card. */
export type Alert = { id: number; person_id: number; title: string; details: string; sort: number };

/** A daily dose at a set time ("HH:MM"), or as needed when `time` is empty. */
export type Medicine = {
  id: number;
  person_id: number;
  name: string;
  time: string;
  note: string;
  sort: number;
};

/** A record that a medicine was given on a day ("YYYY-MM-DD"). */
export type Dose = {
  id: number;
  medicine_id: number;
  day: string;
  /** Milliseconds since 1970. */
  given_at: number;
  given_by: string;
};

/** One of a person's routines ("Morning routine", "Bedtime routine"). */
export type Routine = { id: number; person_id: number; name: string; sort: number };

/** `text` is the activity ("Bath"); `note` is optional detail ("she likes bubbles"). */
export type RoutineStep = {
  id: number;
  person_id: number;
  routine_id: number;
  time: string;
  text: string;
  note: string;
  sort: number;
};

/** A routine step checked off on a day ("YYYY-MM-DD"). Checks start fresh each day. */
export type StepCheck = {
  id: number;
  step_id: number;
  day: string;
  /** Milliseconds since 1970. */
  done_at: number;
  done_by: string;
};

/** A short labeled note ("Comfort", "Food", "Latest note"). */
export type Note = { id: number; person_id: number; label: string; text: string; sort: number };

/** The words a child uses and what they mean. */
export type Word = { id: number; person_id: number; word: string; meaning: string; sort: number };

export type Appointment = {
  id: number;
  person_id: number;
  /** "YYYY-MM-DD" */
  day: string;
  /** "HH:MM", or empty. */
  time: string;
  title: string;
  /** Who's driving, or empty. */
  driver: string;
  sort: number;
};

/** A phone number on the emergency card. */
export type Contact = { id: number; label: string; name: string; phone: string; sort: number };

/** Wi-Fi, alarm code, where things are. */
export type HouseItem = {
  id: number;
  label: string;
  /** Shown as is: the network name, where something is. */
  value: string;
  /** A password or code: always shown as dots until someone taps it. */
  secret: string;
  sort: number;
};

/** Words in a label that mean what's saved is probably a password or code. */
const SECRET_WORDS = ['wi-fi', 'wifi', 'password', 'code', 'alarm', 'pin', 'lock', 'gate', 'garage', 'safe', 'key pad', 'keypad'];

/** Whether a house item's label sounds like a password or code. */
function looksSecret(label: string) {
  const text = label.toLowerCase();
  return SECRET_WORDS.some((word) => new RegExp(`\\b${word}\\b`).test(text));
}

type Tables = {
  people: Person;
  alerts: Alert;
  medicines: Medicine;
  doses: Dose;
  routines: Routine;
  routine_steps: RoutineStep;
  step_checks: StepCheck;
  notes: Note;
  words: Word;
  appointments: Appointment;
  contacts: Contact;
  house_items: HouseItem;
};

export type Table = keyof Tables;

/** Settings saved as key/value text. */
export type Settings = {
  /** "Carter" shows as "The Carter family". */
  family_name?: string;
  /** Saved as "given by" when you mark a medicine given. */
  my_name?: string;
  address?: string;
  /** Cross street, what the house looks like. */
  address_note?: string;
  /** The line at the bottom of the emergency card, e.g. where the first aid kit is. */
  emergency_note?: string;
};

// Never change a step once it may have run on a phone (even in testing): add a new step instead.
const DATABASE_VERSION = 4;

/** Runs every time the database opens: turns on foreign keys and brings the tables up to date. */
export async function setUpDatabase(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA foreign_keys = ON');
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = result?.user_version ?? 0;
  if (version >= DATABASE_VERSION) return;

  if (version === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      CREATE TABLE settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
      CREATE TABLE people (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'child',
        color TEXT NOT NULL DEFAULT 'blue',
        age TEXT NOT NULL DEFAULT '',
        about TEXT NOT NULL DEFAULT '',
        routine_name TEXT NOT NULL DEFAULT '',
        sort INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE alerts (
        id INTEGER PRIMARY KEY NOT NULL,
        person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        title TEXT NOT NULL DEFAULT '',
        details TEXT NOT NULL DEFAULT '',
        sort INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE medicines (
        id INTEGER PRIMARY KEY NOT NULL,
        person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        name TEXT NOT NULL DEFAULT '',
        time TEXT NOT NULL DEFAULT '',
        note TEXT NOT NULL DEFAULT '',
        sort INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE doses (
        id INTEGER PRIMARY KEY NOT NULL,
        medicine_id INTEGER NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
        day TEXT NOT NULL,
        given_at INTEGER NOT NULL,
        given_by TEXT NOT NULL DEFAULT ''
      );
      CREATE INDEX doses_by_day ON doses (day, medicine_id);
      CREATE TABLE routine_steps (
        id INTEGER PRIMARY KEY NOT NULL,
        person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        time TEXT NOT NULL DEFAULT '',
        text TEXT NOT NULL DEFAULT '',
        sort INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE notes (
        id INTEGER PRIMARY KEY NOT NULL,
        person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        label TEXT NOT NULL DEFAULT '',
        text TEXT NOT NULL DEFAULT '',
        sort INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE words (
        id INTEGER PRIMARY KEY NOT NULL,
        person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        word TEXT NOT NULL DEFAULT '',
        meaning TEXT NOT NULL DEFAULT '',
        sort INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE appointments (
        id INTEGER PRIMARY KEY NOT NULL,
        person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        day TEXT NOT NULL DEFAULT '',
        time TEXT NOT NULL DEFAULT '',
        title TEXT NOT NULL DEFAULT '',
        driver TEXT NOT NULL DEFAULT '',
        sort INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE contacts (
        id INTEGER PRIMARY KEY NOT NULL,
        label TEXT NOT NULL DEFAULT '',
        name TEXT NOT NULL DEFAULT '',
        phone TEXT NOT NULL DEFAULT '',
        sort INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE house_items (
        id INTEGER PRIMARY KEY NOT NULL,
        label TEXT NOT NULL DEFAULT '',
        value TEXT NOT NULL DEFAULT '',
        sort INTEGER NOT NULL DEFAULT 0
      );
    `);
    version = 1;
  }

  if (version === 1) {
    // Routine steps: the activity now comes from a list, so details go in their own box.
    await db.execAsync(`ALTER TABLE routine_steps ADD COLUMN note TEXT NOT NULL DEFAULT ''`);
    version = 2;
  }

  if (version === 2) {
    // Several routines per person, and checking steps off each day. Steps someone already had move
    // into one routine named after their old heading.
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE routines (
          id INTEGER PRIMARY KEY NOT NULL,
          person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
          name TEXT NOT NULL DEFAULT '',
          sort INTEGER NOT NULL DEFAULT 0
        );
        ALTER TABLE routine_steps ADD COLUMN routine_id INTEGER REFERENCES routines(id) ON DELETE CASCADE;
        INSERT INTO routines (person_id, name)
          SELECT p.id, CASE WHEN p.routine_name != '' THEN p.routine_name ELSE 'Routine' END
          FROM people p WHERE EXISTS (SELECT 1 FROM routine_steps s WHERE s.person_id = p.id);
        UPDATE routine_steps SET routine_id = (SELECT r.id FROM routines r WHERE r.person_id = routine_steps.person_id);
        CREATE TABLE step_checks (
          id INTEGER PRIMARY KEY NOT NULL,
          step_id INTEGER NOT NULL REFERENCES routine_steps(id) ON DELETE CASCADE,
          day TEXT NOT NULL,
          done_at INTEGER NOT NULL,
          done_by TEXT NOT NULL DEFAULT ''
        );
        CREATE INDEX step_checks_by_day ON step_checks (day, step_id);
      `);
    });
    version = 3;
  }

  if (version === 3) {
    // House items get their own box for a password or code, which is always hidden. (A test version
    // of step 3 may have added a `hidden` column; it's no longer used. Only add what's missing.)
    await db.withTransactionAsync(async () => {
      const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(house_items)');
      if (!columns.some((c) => c.name === 'secret')) {
        await db.execAsync(`ALTER TABLE house_items ADD COLUMN secret TEXT NOT NULL DEFAULT ''`);
      }
      // What's saved under "Wi-Fi", "Alarm" and the like moves into the hidden box, so nothing that
      // looks like a password ends up showing.
      const items = await db.getAllAsync<{ id: number; label: string }>(
        "SELECT id, label FROM house_items WHERE secret = '' AND value != ''",
      );
      for (const item of items) {
        if (looksSecret(item.label)) {
          await db.runAsync("UPDATE house_items SET secret = value, value = '' WHERE id = ?", [item.id]);
        }
      }
    });
    version = 4;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

// Screens re-read their data whenever anything is saved. The handbook is small, so this is simpler
// than tracking which screen shows which table.
let changeCount = 0;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyChanged() {
  changeCount++;
  listeners.forEach((listener) => listener());
}

/** Rows from a query, re-read after every save. `undefined` while loading. */
export function useQuery<T>(sql: string, params: SQLiteBindValue[] = []): T[] | undefined {
  const db = useSQLiteContext();
  const version = useSyncExternalStore(subscribe, () => changeCount);
  const key = JSON.stringify(params);
  const [rows, setRows] = useState<T[]>();

  useEffect(() => {
    let current = true;
    db.getAllAsync<T>(sql, JSON.parse(key)).then((result) => {
      if (current) setRows(result);
    });
    return () => {
      current = false;
    };
  }, [db, sql, key, version]);

  return rows;
}

/** The first row of a query, `null` if there is none, `undefined` while loading. */
export function useFirst<T>(sql: string, params: SQLiteBindValue[] = []): T | null | undefined {
  const rows = useQuery<T>(sql, params);
  return rows === undefined ? undefined : (rows[0] ?? null);
}

export function useSettings(): Settings {
  const rows = useQuery<{ key: string; value: string }>('SELECT key, value FROM settings');
  return Object.fromEntries((rows ?? []).map((row) => [row.key, row.value]));
}

type Values<T extends Table> = Partial<Omit<Tables[T], 'id'>>;

/** Adds a row and returns its id. Table and column names only ever come from this code. */
export async function insertRow<T extends Table>(
  db: SQLiteDatabase,
  table: T,
  values: Values<T>,
): Promise<number> {
  const columns = Object.keys(values);
  const result = await db.runAsync(
    `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
    Object.values(values) as SQLiteBindValue[],
  );
  notifyChanged();
  return result.lastInsertRowId;
}

export async function updateRow<T extends Table>(
  db: SQLiteDatabase,
  table: T,
  id: number,
  values: Values<T>,
) {
  const columns = Object.keys(values);
  if (columns.length === 0) return;
  await db.runAsync(`UPDATE ${table} SET ${columns.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`, [
    ...(Object.values(values) as SQLiteBindValue[]),
    id,
  ]);
  notifyChanged();
}

export async function deleteRow(db: SQLiteDatabase, table: Table, id: number) {
  await db.runAsync(`DELETE FROM ${table} WHERE id = ?`, [id]);
  notifyChanged();
}

export async function saveSetting(db: SQLiteDatabase, key: keyof Settings, value: string) {
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value',
    [key, value],
  );
  notifyChanged();
}

/**
 * Removes rows left completely blank (someone tapped "Add" and then left), within the rows that
 * match `where`, e.g. `{ person_id: 3 }`.
 */
export async function deleteBlankRows(
  db: SQLiteDatabase,
  table: Table,
  columns: string[],
  where: Record<string, SQLiteBindValue>,
) {
  const conditions = [...columns.map((c) => `${c} = ''`), ...Object.keys(where).map((c) => `${c} = ?`)];
  const result = await db.runAsync(
    `DELETE FROM ${table} WHERE ${conditions.join(' AND ')}`,
    Object.values(where),
  );
  if (result.changes > 0) notifyChanged();
}
