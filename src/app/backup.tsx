import * as Calendar from 'expo-calendar';
import * as Contacts from 'expo-contacts';
import { type File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { BackButton, Button, Card, Eyebrow, Row, Screen, Text } from '@/components/ui';
import { openBackup, pickBackup, saveBackup } from '@/lib/backup';
import { colors, fonts } from '@/lib/theme';

type Ask = { mode: 'save' } | { mode: 'open'; file: File } | null;
type Source = 'contacts' | 'photos' | 'calendar';

const SOURCES: { id: Source; title: string; note: string; icon: 'call' | 'eye' | 'calendar' }[] = [
  { id: 'contacts', title: 'Phone contacts', note: 'Pick family and who to tell first', icon: 'call' },
  { id: 'photos', title: 'Photos', note: 'For stories, and pictures of papers', icon: 'eye' },
  { id: 'calendar', title: 'Calendar dates', note: 'Birthdays and anniversaries', icon: 'calendar' },
];

const ask = {
  contacts: () => Contacts.requestPermissionsAsync(),
  photos: () => ImagePicker.requestMediaLibraryPermissionsAsync(),
  calendar: () => Calendar.requestCalendarPermissionsAsync(),
};
const check = {
  contacts: () => Contacts.getPermissionsAsync(),
  photos: () => ImagePicker.getMediaLibraryPermissionsAsync(),
  calendar: () => Calendar.getCalendarPermissionsAsync(),
};

/** Backup and export (mockup 13): a locked backup file for a new phone, a PDF, and what can be brought in. */
export default function Backup() {
  const [asking, setAsking] = useState<Ask>(null);
  const [allowed, setAllowed] = useState<Partial<Record<Source, boolean>>>({});

  useEffect(() => {
    SOURCES.forEach(({ id }) =>
      check[id]()
        .then((status) => setAllowed((current) => ({ ...current, [id]: status.granted })))
        .catch(() => undefined)
    );
  }, []);

  const allow = async (id: Source) => {
    const status = await ask[id]().catch(() => null);
    setAllowed((current) => ({ ...current, [id]: Boolean(status?.granted) }));
    if (status && !status.granted && !status.canAskAgain) Alert.alert('Turned off in Settings', 'You can allow it in the iPhone Settings app, under Left in Love.');
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton />
        <Text size={26} weight={400}>
          Backup and export
        </Text>
      </View>

      <Card style={{ padding: 16, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={styles.tick}>
            <Icon name="check" size={12} color={colors.onAccent} strokeWidth={3.2} />
          </View>
          <Text weight={500} style={{ flex: 1 }}>
            Included in your phone&apos;s own backup
          </Text>
        </View>
        <Text size={14} color={colors.muted} style={{ lineHeight: 21 }}>
          Restore a new iPhone from iCloud and your handbook comes along. A backup file is for anything else, like moving to an Android phone.
        </Text>
      </Card>

      <View style={{ gap: 8 }}>
        <Eyebrow>Moving phones</Eyebrow>
        <Card>
          <Row first icon="arrow" title="Save a backup file" note="Everything, locked with a password you choose" onPress={() => setAsking({ mode: 'save' })} />
          <Row
            icon="folder"
            title="Restore from a backup file"
            note="From Files, email or AirDrop"
            onPress={async () => {
              const file = await pickBackup().catch(() => null);
              if (file) setAsking({ mode: 'open', file });
            }}
          />
        </Card>
      </View>

      <View style={{ gap: 8 }}>
        <Eyebrow>Share a copy</Eyebrow>
        <Card>
          <Row first icon="book" title="Make a PDF" note="To print, email or keep with your will" onPress={() => router.push('/pdf')} />
        </Card>
      </View>

      <View style={{ gap: 8 }}>
        <Eyebrow>Bring things in</Eyebrow>
        <Card>
          {SOURCES.map((source, i) => (
            <Row
              key={source.id}
              first={i === 0}
              icon={source.icon}
              title={source.title}
              note={source.note}
              right={
                <Pressable accessibilityRole="button" accessibilityLabel={allowed[source.id] ? `${source.title}: allowed` : `Allow ${source.title}`} disabled={allowed[source.id]} onPress={() => allow(source.id)} style={[styles.allow, allowed[source.id] ? styles.allowed : { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                  <Text size={13} weight={500} color={allowed[source.id] ? colors.muted : colors.onAccent}>
                    {allowed[source.id] ? 'Allowed' : 'Allow'}
                  </Text>
                </Pressable>
              }
            />
          ))}
        </Card>
        <Text size={13} color={colors.faint} style={{ paddingHorizontal: 4 }}>
          Nothing is copied until you pick it, and it stays on this phone.
        </Text>
      </View>

      <PasswordSheet ask={asking} onClose={() => setAsking(null)} />
    </Screen>
  );
}

/** Asks for the backup's password (twice when saving), then saves or restores. */
function PasswordSheet({ ask: current, onClose }: { ask: Ask; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const saving = current?.mode === 'save';

  const close = () => {
    setPassword('');
    setAgain('');
    setProblem('');
    setBusy(false);
    onClose();
  };

  const go = async () => {
    if (!current) return;
    if (password.length < 6) return setProblem('Use at least 6 characters.');
    if (saving && password !== again) return setProblem('The two passwords don’t match.');
    setBusy(true);
    setProblem('');
    try {
      if (current.mode === 'save') {
        await saveBackup(password);
        close();
      } else {
        const result = await openBackup(current.file, password);
        if (result === 'restored') {
          close();
          Alert.alert('Restored', 'Your handbook, letters and recordings are back.');
          router.replace('/');
        } else {
          setBusy(false);
          setProblem(result === 'wrong-password' ? 'That password doesn’t open this backup.' : 'That file isn’t a Left in Love backup.');
        }
      }
    } catch {
      setBusy(false);
      setProblem('Something went wrong. Please try again.');
    }
  };

  return (
    <Modal visible={current !== null} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <Text size={22}>{saving ? 'Lock your backup' : 'Open your backup'}</Text>
        <Text size={14} color={colors.muted} style={{ lineHeight: 21 }}>
          {saving ? 'Choose a password. You’ll need it to restore, and it can’t be recovered, so keep it somewhere safe.' : 'Enter the password you chose when you saved it.'}
        </Text>
        <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" placeholderTextColor={colors.faint} accessibilityLabel="Password" autoFocus style={styles.input} />
        {saving && <TextInput value={again} onChangeText={setAgain} secureTextEntry placeholder="The same password again" placeholderTextColor={colors.faint} accessibilityLabel="Password again" style={styles.input} />}
        {problem ? (
          <Text size={14} color={colors.accent}>
            {problem}
          </Text>
        ) : null}
        {busy ? (
          <View style={{ height: 54, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }}>
            <ActivityIndicator color={colors.accent} />
            <Text color={colors.muted}>{saving ? 'Locking…' : 'Opening…'}</Text>
          </View>
        ) : (
          <Button label={saving ? 'Save backup file' : 'Restore'} onPress={go} />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  tick: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  allow: { height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  allowed: { borderColor: colors.selected },
  backdrop: { flex: 1, backgroundColor: 'rgba(5,4,8,0.6)' },
  sheet: { backgroundColor: colors.sheet, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 14 },
  input: { height: 52, borderRadius: 14, borderWidth: 1, borderColor: colors.selected, backgroundColor: colors.background, color: colors.ink, paddingHorizontal: 14, fontFamily: fonts[300], fontSize: 17 },
});
