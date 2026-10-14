/**
 * Voice notes and photos are files in the app's own folder (so iPhone backups include them), named by
 * their id. The handbook's record (lib/store.ts) only lists them.
 */
import { Directory, File, Paths } from 'expo-file-system';

const folder = (name: 'voice' | 'photos') => {
  const directory = new Directory(Paths.document, name);
  if (!directory.exists) directory.create({ intermediates: true });
  return directory;
};

export const voiceFile = (id: string) => new File(folder('voice'), `${id}.m4a`);
export const photoFile = (id: string) => new File(folder('photos'), `${id}.jpg`);

/** Moves a finished recording (or a picked photo) into place under its id. */
export async function keep(fromUri: string, to: File) {
  if (to.exists) to.delete();
  await new File(fromUri).copy(to);
}

export function forget(file: File) {
  try {
    if (file.exists) file.delete();
  } catch {
    // Already gone.
  }
}
