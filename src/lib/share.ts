/**
 * Sitter links. The chosen pages are packed up, encrypted on this phone with a new random key, and
 * only the scrambled copy is saved to Firebase. The key goes in the link after the `#`, which
 * browsers never send to a server, so Firebase (and anyone who reads its database) can't open it.
 * Firebase deletes the copy once the link ends (a TTL policy on `expiresAt`); "Stop" deletes it now.
 *
 * The web page in `viewer/` reads the copy, decrypts it with the key from the link, and shows it.
 * Keep `Snapshot` in step with what that page expects.
 */
import { gcm } from '@noble/ciphers/aes.js';
import { getRandomBytes } from 'expo-crypto';
import { type SQLiteDatabase } from 'expo-sqlite';
import { deleteDoc, doc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';

import {
  type Alert,
  type Contact,
  deleteRow,
  type HouseItem,
  insertRow,
  type Medicine,
  type Note,
  type Person,
  type Routine,
  type RoutineStep,
  type Settings,
  type Word,
} from '@/lib/db';
import { firestore, VIEWER_URL } from '@/lib/firebase';
import { personColor } from '@/lib/theme';

/** What the sitter's page shows. Version 1. */
export type Snapshot = {
  v: 1;
  /** "Carter", or empty. */
  family: string;
  /** Who shared it ("Matt"), or empty. */
  from: string;
  /** Who it's for ("Jess"), or empty. */
  to: string;
  note: string;
  /** Milliseconds since 1970. */
  expiresAt: number;
  people: {
    name: string;
    kind: string;
    age: string;
    about: string;
    /** The person's colors, so the page doesn't need its own copy of the palette. */
    colors: { soft: string; strong: string; tint: string };
    alerts: { title: string; details: string }[];
    medicines: { name: string; time: string; note: string }[];
    routines: { name: string; steps: { time: string; text: string; note: string }[] }[];
    notes: { label: string; text: string }[];
    words: { word: string; meaning: string }[];
  }[];
  /** Null when Our home isn't shared. `secret` is shown as dots until tapped. */
  house: { label: string; value: string; secret: string }[] | null;
  /** Null when the emergency card isn't shared. */
  emergency: {
    address: string;
    addressNote: string;
    note: string;
    contacts: { label: string; name: string; phone: string }[];
  } | null;
};

export type ShareChoice = {
  personIds: number[];
  house: boolean;
  emergency: boolean;
  to: string;
  note: string;
  expiresAt: number;
};

/** Gathers the chosen pages from the database. Blank rows are left out. */
export async function buildSnapshot(db: SQLiteDatabase, settings: Settings, choice: ShareChoice): Promise<Snapshot> {
  const people: Snapshot['people'] = [];
  for (const id of choice.personIds) {
    const person = await db.getFirstAsync<Person>('SELECT * FROM people WHERE id = ?', [id]);
    if (!person) continue;
    const alerts = await db.getAllAsync<Alert>(
      "SELECT * FROM alerts WHERE person_id = ? AND (title != '' OR details != '') ORDER BY sort, id",
      [id],
    );
    const medicines = await db.getAllAsync<Medicine>(
      "SELECT * FROM medicines WHERE person_id = ? AND name != '' ORDER BY time = '', time, sort, id",
      [id],
    );
    const routines = await db.getAllAsync<Routine>('SELECT * FROM routines WHERE person_id = ? ORDER BY sort, id', [id]);
    const steps = await db.getAllAsync<RoutineStep>(
      "SELECT * FROM routine_steps WHERE person_id = ? AND text != '' ORDER BY time = '', time, sort, id",
      [id],
    );
    const notes = await db.getAllAsync<Note>("SELECT * FROM notes WHERE person_id = ? AND text != '' ORDER BY sort, id", [id]);
    const words = await db.getAllAsync<Word>("SELECT * FROM words WHERE person_id = ? AND word != '' ORDER BY sort, id", [id]);
    const c = personColor(person.color);
    people.push({
      name: person.name,
      kind: person.kind,
      age: person.age,
      about: person.about,
      colors: { soft: c.soft, strong: c.strong, tint: c.tint },
      alerts: alerts.map(({ title, details }) => ({ title, details })),
      medicines: medicines.map(({ name, time, note }) => ({ name, time, note })),
      routines: routines
        .map((r) => ({
          name: r.name,
          steps: steps.filter((s) => s.routine_id === r.id).map(({ time, text, note }) => ({ time, text, note })),
        }))
        .filter((r) => r.steps.length > 0),
      notes: notes.map(({ label, text }) => ({ label, text })),
      words: words.map(({ word, meaning }) => ({ word, meaning })),
    });
  }

  const house = choice.house
    ? (
        await db.getAllAsync<HouseItem>(
          "SELECT * FROM house_items WHERE label != '' OR value != '' OR secret != '' ORDER BY sort, id",
        )
      ).map(({ label, value, secret }) => ({ label, value, secret }))
    : null;

  const emergency = choice.emergency
    ? {
        address: settings.address ?? '',
        addressNote: settings.address_note ?? '',
        note: settings.emergency_note ?? '',
        contacts: (await db.getAllAsync<Contact>("SELECT * FROM contacts WHERE phone != '' ORDER BY sort, id")).map(
          ({ label, name, phone }) => ({ label, name, phone }),
        ),
      }
    : null;

  return {
    v: 1,
    family: settings.family_name?.trim() ?? '',
    from: settings.my_name?.trim() ?? '',
    to: choice.to.trim(),
    note: choice.note.trim(),
    expiresAt: choice.expiresAt,
    people,
    house,
    emergency,
  };
}

function base64(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** Base64 that's safe in a link: no "+", "/" or "=". */
function base64url(bytes: Uint8Array) {
  return base64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Encrypts the snapshot, saves the scrambled copy to Firebase, remembers the link on this phone,
 * and returns the link to send.
 */
export async function createLink(db: SQLiteDatabase, snapshot: Snapshot): Promise<string> {
  const key = getRandomBytes(32);
  const nonce = getRandomBytes(12);
  const plain = new TextEncoder().encode(JSON.stringify(snapshot));
  const sealed = gcm(key, nonce).encrypt(plain);
  // Our own random id (rather than Firebase's) so it comes from the phone's secure random source.
  const id = base64url(getRandomBytes(16));

  await setDoc(doc(firestore(), 'links', id), {
    v: 1,
    data: base64(sealed),
    iv: base64(nonce),
    expiresAt: Timestamp.fromMillis(snapshot.expiresAt),
    createdAt: serverTimestamp(),
  });

  const url = `${VIEWER_URL.replace(/\/$/, '')}/#${id}.${base64url(key)}`;
  await insertRow(db, 'sitter_links', {
    doc_id: id,
    name: snapshot.to,
    url,
    expires_at: snapshot.expiresAt,
    created_at: Date.now(),
  });
  return url;
}

/** Ends a link now: deletes the copy from Firebase and forgets it here. */
export async function stopLink(db: SQLiteDatabase, link: { id: number; doc_id: string }) {
  await deleteDoc(doc(firestore(), 'links', link.doc_id));
  await deleteRow(db, 'sitter_links', link.id);
}

/** When a link should stop working, from the choices on the share screen. */
export function expiryFor(choice: 'morning' | 'three' | 'week', now = new Date()) {
  if (choice === 'morning') {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0);
    return date.getTime();
  }
  const days = choice === 'three' ? 3 : 7;
  return now.getTime() + days * 86_400_000;
}
