/**
 * Voice notes (mockup 10): a list of a page's or letter's recordings with play and remove, and the
 * sheet that records a new one (also opened from a page's tool bar).
 */
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { SheetFrame, Text } from '@/components/ui';
import { forget, keep, voiceFile } from '@/lib/media';
import { newId, type VoiceNote } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';

/** "0:42" from seconds. */
export const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

/** The bars' shape; the voice's loudness scales it. */
const SHAPE = [0.2, 0.35, 0.5, 0.3, 0.65, 0.8, 0.45, 0.6, 0.9, 0.75, 0.4, 0.55, 0.85, 1, 0.7, 0.5, 0.35, 0.6, 0.8, 0.5, 0.35, 0.25, 0.45, 0.3, 0.2, 0.15, 0.12, 0.1];

/** Recording, with permission asked first. Stopping hands back the finished note (saved under its id). */
export function useRecording() {
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const state = useAudioRecorderState(recorder, 100);

  const start = async () => {
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Microphone is off', 'To record, allow the microphone for Left in Love (or Expo Go) in the iPhone Settings app.');
      return false;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    return true;
  };

  const stop = async (title: string): Promise<VoiceNote | null> => {
    const seconds = Math.round(state.durationMillis / 1000);
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    if (!recorder.uri || seconds < 1) return null;
    const id = newId();
    await keep(recorder.uri, voiceFile(id));
    return { id, title: title.trim() || 'Voice note', seconds, createdAt: new Date().toISOString() };
  };

  const discard = async () => {
    if (state.isRecording || state.durationMillis > 0) await recorder.stop().catch(() => undefined);
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
  };

  // Loudness as 0–1 (metering is in decibels, about -60 quiet to 0 loud).
  const level = state.isRecording ? Math.max(0.08, Math.min(1, ((state.metering ?? -60) + 60) / 50)) : 0.08;
  return { recorder, state, start, stop, discard, level };
}

/**
 * A page's or letter's voice notes, with a button to record another (not when `readOnly`, the family's
 * view, or when the screen has its own record button: `recordButton={false}`).
 */
export function VoiceNotes({ notes, onAdd, onRemove, suggestion, readOnly, recordButton = true }: { notes: VoiceNote[]; onAdd?: (note: VoiceNote) => void; onRemove?: (note: VoiceNote) => void; suggestion?: string; readOnly?: boolean; recordButton?: boolean }) {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [playing, setPlaying] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);

  const play = (note: VoiceNote) => {
    if (playing === note.id && status.playing) {
      player.pause();
      return;
    }
    player.replace({ uri: voiceFile(note.id).uri });
    player.play();
    setPlaying(note.id);
  };

  const remove = (note: VoiceNote) =>
    Alert.alert(`Delete “${note.title}”?`, 'The recording will be removed from this phone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (playing === note.id) player.pause();
          forget(voiceFile(note.id));
          onRemove?.(note);
        },
      },
    ]);

  return (
    <View style={{ gap: 8 }}>
      {notes.length > 0 && (
        <View style={styles.list}>
          {notes.map((note, i) => {
            const on = playing === note.id && status.playing;
            return (
              <View key={note.id} style={[styles.note, i > 0 && styles.line]}>
                <Pressable accessibilityRole="button" accessibilityLabel={`${on ? 'Pause' : 'Play'}: ${note.title}`} onPress={() => play(note)} style={styles.play}>
                  {on ? <View style={styles.pauseMark} /> : <Icon name="play" size={14} color={colors.accent} />}
                </Pressable>
                <View style={{ flex: 1 }}>
                  <Text size={15} weight={400}>
                    {note.title}
                  </Text>
                  <Text size={12} color={colors.faint}>{`${clock(note.seconds)} · ${new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}</Text>
                </View>
                {!readOnly && (
                  <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${note.title}`} hitSlop={8} onPress={() => remove(note)} style={{ padding: 6 }}>
                    <Icon name="trash" size={16} color={colors.faint} />
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
      )}
      {!readOnly && recordButton && (
        <>
          <Pressable accessibilityRole="button" onPress={() => setRecording(true)} style={({ pressed }) => [styles.record, pressed && { borderColor: colors.accent }]}>
            <Icon name="mic" size={18} />
            <Text color={colors.soft}>{notes.length ? 'Record another voice note' : 'Record a voice note'}</Text>
          </Pressable>
          <RecordSheet visible={recording} suggestion={suggestion} onClose={() => setRecording(false)} onSave={(note) => onAdd?.(note)} />
        </>
      )}
    </View>
  );
}

/** The recording sheet: timer, the voice as bars, start over / pause / save. */
export function RecordSheet({ visible, suggestion, onClose, onSave }: { visible: boolean; suggestion?: string; onClose: () => void; onSave: (note: VoiceNote) => void }) {
  const insets = useSafeAreaInsets();
  const { recorder, state, start, stop, discard, level } = useRecording();
  const [title, setTitle] = useState('');
  const [paused, setPaused] = useState(false);
  const started = state.isRecording || paused;

  const close = async () => {
    await discard();
    setPaused(false);
    setTitle('');
    onClose();
  };

  const toggle = async () => {
    if (!started) {
      if (await start()) setPaused(false);
    } else if (state.isRecording) {
      recorder.pause();
      setPaused(true);
    } else {
      recorder.record();
      setPaused(false);
    }
  };

  const save = async () => {
    const note = await stop(title);
    setPaused(false);
    setTitle('');
    if (note) onSave(note);
    onClose();
  };

  const again = async () => {
    await discard();
    setPaused(false);
    await start();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <SheetFrame>
        <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.grabber} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text size={20} weight={400}>
              A voice note
            </Text>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={close}>
              <Text color={colors.muted}>Cancel</Text>
            </Pressable>
          </View>

          {suggestion ? (
            <View style={styles.hint}>
              <Text size={12} weight={500} color={colors.accent} style={{ letterSpacing: 1.2, textTransform: 'uppercase' }}>
                Try saying
              </Text>
              <Text size={16} color="#E4E0EA">
                {suggestion}
              </Text>
            </View>
          ) : null}

          <View style={{ alignItems: 'center', gap: 12 }}>
            <Text weight={200} size={46} style={{ fontVariant: ['tabular-nums'], lineHeight: 56 }}>
              {clock(state.durationMillis / 1000)}
            </Text>
            <View accessibilityLabel="Your voice, as it's recorded" style={styles.bars}>
              {SHAPE.map((shape, i) => (
                <View key={i} style={{ width: 4, borderRadius: 2, height: Math.max(4, 52 * shape * level), backgroundColor: state.isRecording ? colors.accent : colors.outline }} />
              ))}
            </View>
            <Text size={14} color={colors.faint}>
              {!started ? 'Tap the circle to start' : paused ? 'Paused. Tap to keep going.' : 'Recording…'}
            </Text>
          </View>

          <View style={styles.controls}>
            <Pressable accessibilityRole="button" accessibilityLabel="Start over" disabled={!started} onPress={again} style={[styles.side, !started && { opacity: 0.35 }]}>
              <Icon name="restart" size={20} color={colors.soft} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={!started ? 'Start recording' : state.isRecording ? 'Pause' : 'Keep recording'} onPress={toggle} style={styles.big}>
              {state.isRecording ? <View style={styles.stopMark} /> : <View style={styles.recordMark} />}
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Save" disabled={!started} onPress={save} style={[styles.side, { backgroundColor: colors.accent, borderColor: colors.accent }, !started && { opacity: 0.35 }]}>
              <Icon name="check" size={22} color={colors.onAccent} strokeWidth={2.4} />
            </Pressable>
          </View>

          <TextInput value={title} onChangeText={setTitle} placeholder="Name it (optional)" placeholderTextColor={colors.faint} accessibilityLabel="Name this voice note" style={styles.title} />
        </View>
      </SheetFrame>
    </Modal>
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: colors.card, borderRadius: 18, overflow: 'hidden' },
  note: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10 },
  line: { borderTopWidth: 1, borderTopColor: colors.line },
  play: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.selected, alignItems: 'center', justifyContent: 'center' },
  pauseMark: { width: 10, height: 12, borderLeftWidth: 3, borderRightWidth: 3, borderColor: colors.accent },
  record: { height: 48, borderRadius: 999, borderWidth: 1, borderColor: colors.selected, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  backdrop: { flex: 1, backgroundColor: 'rgba(5,4,8,0.6)' },
  sheet: { backgroundColor: colors.sheet, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, gap: 18 },
  grabber: { width: 38, height: 5, borderRadius: 3, backgroundColor: colors.outline, alignSelf: 'center' },
  hint: { backgroundColor: '#26232F', borderRadius: 16, padding: 14, gap: 4 },
  bars: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 56 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 36 },
  side: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: colors.selected, alignItems: 'center', justifyContent: 'center' },
  big: { width: 84, height: 84, borderRadius: 42, borderWidth: 3, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  recordMark: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accent },
  stopMark: { width: 30, height: 30, borderRadius: 8, backgroundColor: colors.accent },
  title: { height: 48, borderRadius: 14, backgroundColor: '#26232F', color: colors.ink, paddingHorizontal: 14, fontFamily: fonts[300], fontSize: 16 },
});
