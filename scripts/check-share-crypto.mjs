// Checks that a sitter link encrypted the way the app does it (noble AES-GCM, src/lib/share.ts) opens
// the way the link page does it (browser WebCrypto, viewer/index.html). Run: node scripts/check-share-crypto.mjs
import { gcm } from '@noble/ciphers/aes.js';
import { randomBytes } from 'node:crypto';

const base64 = (bytes) => Buffer.from(bytes).toString('base64');
const base64url = (bytes) => base64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromBase64 = (text) => Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

const snapshot = { v: 1, to: 'Jess', note: 'Pizza money is on the counter ✓ — “quotes”', people: [] };

// The app's side.
const key = new Uint8Array(randomBytes(32));
const nonce = new Uint8Array(randomBytes(12));
const sealed = gcm(key, nonce).encrypt(new TextEncoder().encode(JSON.stringify(snapshot)));
const stored = { data: base64(sealed), iv: base64(nonce) };
const linkKey = base64url(key);

// The link page's side.
const cryptoKey = await crypto.subtle.importKey('raw', fromBase64(linkKey), 'AES-GCM', false, ['decrypt']);
const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(stored.iv) }, cryptoKey, fromBase64(stored.data));
const opened = JSON.parse(new TextDecoder().decode(plain));
console.log(JSON.stringify(opened) === JSON.stringify(snapshot) ? 'OK: the link page opens what the app sealed' : 'MISMATCH');

// A wrong key must fail.
const wrong = await crypto.subtle.importKey('raw', new Uint8Array(randomBytes(32)), 'AES-GCM', false, ['decrypt']);
try {
  await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(stored.iv) }, wrong, fromBase64(stored.data));
  console.log('PROBLEM: a wrong key opened it');
} catch {
  console.log('OK: a wrong key is refused');
}
