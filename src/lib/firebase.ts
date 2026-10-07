/**
 * Firebase, used only for sharing. Today that's sitter links: an encrypted copy of the chosen pages
 * that Firebase can't read, deleted when the link ends. Nothing else in the handbook goes here.
 *
 * The settings come from `.env` (see `.env.example`). Until they're filled in, sharing shows as
 * "not set up yet" and the rest of the app works as usual.
 */
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Expo only fills these in when they're written out in full like this.
const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/** The web page that opens sitter links (hosted on Vercel, from `viewer/`). */
export const VIEWER_URL = process.env.EXPO_PUBLIC_SITTER_VIEWER_URL ?? '';

export const sharingIsSetUp = Boolean(config.apiKey && config.projectId && config.appId && VIEWER_URL);

export function firestore() {
  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  return getFirestore(app);
}
