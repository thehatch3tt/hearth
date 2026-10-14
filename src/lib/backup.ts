/**
 * Backup files, for moving to a new phone: everything (pages, letters, people, voice notes, photos),
 * locked with a password the person chooses. Without it the file can't be read, by anyone.
 *
 * The file: "LILOVE01", a 16-byte salt, a 24-byte nonce, then XChaCha20-Poly1305 of the contents. The
 * key comes from the password (PBKDF2-SHA256). The contents: a 4-byte length, the record as JSON (with
 * where each file's bytes are), then the files' bytes one after another.
 */
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { bytesToUtf8, concatBytes, utf8ToBytes } from '@noble/ciphers/utils.js';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { getRandomBytes } from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { photoFile, voiceFile } from './media';
import { getData, mediaIds, restore, type Data } from './store';

const MAGIC = utf8ToBytes('LILOVE01');
const ITERATIONS = 120_000;

type Packed = { data: Data; files: { kind: 'voice' | 'photo'; id: string; offset: number; length: number }[] };

const keyFrom = (password: string, salt: Uint8Array) => pbkdf2Async(sha256, utf8ToBytes(password), salt, { c: ITERATIONS, dkLen: 32 });

const today = () => new Date().toISOString().slice(0, 10);

/** Makes a backup file and opens the share sheet (Save to Files, AirDrop, Mail). */
export async function saveBackup(password: string) {
  const data = getData();
  const ids = mediaIds(data);
  const blobs: Uint8Array[] = [];
  const files: Packed['files'] = [];
  let offset = 0;
  const add = async (kind: 'voice' | 'photo', id: string, file: File) => {
    if (!file.exists) return;
    const bytes = await file.bytes();
    files.push({ kind, id, offset, length: bytes.length });
    blobs.push(bytes);
    offset += bytes.length;
  };
  for (const id of ids.voice) await add('voice', id, voiceFile(id));
  for (const id of ids.photos) await add('photo', id, photoFile(id));

  const record = utf8ToBytes(JSON.stringify({ data, files } satisfies Packed));
  const length = new Uint8Array(4);
  new DataView(length.buffer).setUint32(0, record.length);
  const contents = concatBytes(length, record, ...blobs);

  const salt = getRandomBytes(16);
  const nonce = getRandomBytes(24);
  const sealed = xchacha20poly1305(await keyFrom(password, salt), nonce).encrypt(contents);

  const out = new File(Paths.cache, `Left in Love backup ${today()}.lilbackup`);
  if (out.exists) out.delete();
  out.create();
  out.write(concatBytes(MAGIC, salt, nonce, sealed));
  await Sharing.shareAsync(out.uri, { mimeType: 'application/octet-stream', dialogTitle: 'Left in Love backup' });
}

/** Picks a backup file (or null if they cancelled). */
export async function pickBackup(): Promise<File | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (result.canceled) return null;
  return new File(result.assets[0].uri);
}

/** Restores a backup file with its password. */
export async function openBackup(file: File, password: string): Promise<'restored' | 'wrong-password' | 'not-a-backup'> {
  const bytes = await file.bytes();
  if (bytes.length < 48 || bytesToUtf8(bytes.slice(0, 8)) !== 'LILOVE01') return 'not-a-backup';
  const salt = bytes.slice(8, 24);
  const nonce = bytes.slice(24, 48);
  let contents: Uint8Array;
  try {
    contents = xchacha20poly1305(await keyFrom(password, salt), nonce).decrypt(bytes.slice(48));
  } catch {
    return 'wrong-password';
  }
  const length = new DataView(contents.buffer, contents.byteOffset, 4).getUint32(0);
  const packed = JSON.parse(bytesToUtf8(contents.slice(4, 4 + length))) as Packed;
  const start = 4 + length;
  for (const item of packed.files) {
    const target = item.kind === 'voice' ? voiceFile(item.id) : photoFile(item.id);
    if (target.exists) target.delete();
    target.create();
    target.write(contents.slice(start + item.offset, start + item.offset + item.length));
  }
  restore(packed.data);
  return 'restored';
}
