import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Eyebrow, SheetFrame, Text } from '@/components/ui';
import { VoiceNotes } from '@/components/Voice';
import { LETTER_PROMPTS, MOMENTS } from '@/lib/content';
import { forget, voiceFile } from '@/lib/media';
import { getData, newId, opensText, saveLetter, update, type Opens, type VoiceNote } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';

/** Writing a letter (mockup 8), and when it should open (mockup 9). */
export default function WriteLetter() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  // Read once: this screen keeps its own draft until Save.
  const [existing] = useState(() => getData().letters.find((letter) => letter.id === id));
  const [to, setTo] = useState(existing?.to ?? '');
  const [body, setBody] = useState(existing?.body ?? '');
  const [opens, setOpens] = useState<Opens>(existing?.opens ?? { kind: 'handbook' });
  const [choosing, setChoosing] = useState(false);
  const [voice, setVoice] = useState<VoiceNote[]>(existing?.voice ?? []);

  // Leaving without saving: recordings made just now go too.
  const cancel = () => {
    const kept = new Set((existing?.voice ?? []).map((note) => note.id));
    voice.filter((note) => !kept.has(note.id)).forEach((note) => forget(voiceFile(note.id)));
    router.back();
  };

  const save = () => {
    saveLetter({ id: existing?.id ?? newId(), to: to.trim(), body, opens, voice, updatedAt: '' });
    router.back();
  };

  const remove = () =>
    Alert.alert('Delete this letter?', 'It will be removed from this phone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          voice.forEach((note) => forget(voiceFile(note.id)));
          update((current) => ({ ...current, letters: current.letters.filter((letter) => letter.id !== existing?.id) }));
          router.back();
        },
      },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 12 }}>
      <View style={styles.top}>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={cancel}>
          <Text color={colors.muted}>Cancel</Text>
        </Pressable>
        <Text weight={500}>A letter</Text>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={save}>
          <Text weight={500} color={colors.accent}>
            Save
          </Text>
        </Pressable>
      </View>

      <KeyboardAwareScrollView bottomOffset={24} showsVerticalScrollIndicator={false} alwaysBounceVertical={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: insets.bottom + 24, gap: 14 }}>
        <View style={styles.card}>
          <View style={styles.field}>
            <Text size={14} color={colors.faint} style={{ width: 52 }}>
              To
            </Text>
            <TextInput value={to} onChangeText={setTo} placeholder="Their name" placeholderTextColor={colors.faint} autoCapitalize="words" accessibilityLabel="To" style={styles.to} />
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={`When it opens: ${opensText(opens)}`} onPress={() => setChoosing(true)} style={[styles.field, styles.line]}>
            <Text size={14} color={colors.faint} style={{ width: 52 }}>
              Opens
            </Text>
            <Icon name={opens.kind === 'moment' ? 'heart' : opens.kind === 'date' ? 'calendar' : 'mail'} size={18} />
            <Text style={{ flex: 1 }}>{opensText(opens).replace(/^Opens:? ?(on )?/, '').replace(/^with/, 'With')}</Text>
            <Icon name="chevron" size={16} color="#5E5A6B" strokeWidth={2} />
          </Pressable>
        </View>

        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder={to.trim() ? `${to.trim()},\n\n` : 'Dear…'}
          placeholderTextColor={colors.faint}
          multiline
          textAlignVertical="top"
          accessibilityLabel="Your letter"
          style={styles.body}
        />

        <View style={{ gap: 8 }}>
          <Eyebrow>Not sure what to say?</Eyebrow>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {LETTER_PROMPTS.map((prompt) => (
              <Pressable
                key={prompt}
                accessibilityRole="button"
                onPress={() => setBody((current) => `${current.trimEnd()}${current.trim() ? '\n\n' : ''}${prompt}: `)}
                style={({ pressed }) => [styles.prompt, pressed && { borderColor: colors.accent }]}>
                <Text size={13} color="#C9C4D3">
                  {prompt}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Eyebrow>In your own voice</Eyebrow>
          <VoiceNotes
            notes={voice}
            suggestion={to.trim() ? `Start with “${to.trim()},” and say it the way you would if they were here.` : 'Say it the way you would if they were here.'}
            onAdd={(note) => setVoice((current) => [...current, note])}
            onRemove={(note) => setVoice((current) => current.filter((item) => item.id !== note.id))}
          />
        </View>

        {existing && (
          <Pressable accessibilityRole="button" onPress={remove} style={{ alignSelf: 'center', padding: 10 }}>
            <Text size={15} color={colors.faint}>
              Delete this letter
            </Text>
          </Pressable>
        )}
      </KeyboardAwareScrollView>

      <WhenSheet visible={choosing} name={to.trim()} opens={opens} onChange={setOpens} onClose={() => setChoosing(false)} />
    </View>
  );
}

/** When should it open: with the handbook, on a date, or at a moment in their life. */
function WhenSheet({ visible, name, opens, onChange, onClose }: { visible: boolean; name: string; opens: Opens; onChange: (opens: Opens) => void; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const who = name || 'them';
  const kinds: { kind: Opens['kind']; label: string; about: string }[] = [
    { kind: 'handbook', label: 'With the handbook', about: 'When your family opens it' },
    { kind: 'date', label: 'On a date', about: 'A birthday, an anniversary, any day you pick' },
    { kind: 'moment', label: 'At a moment in their life', about: 'Whenever it happens' },
  ];
  // Only what the app does today: the letter is kept with the handbook, sealed and marked for its time.
  const how =
    opens.kind === 'handbook'
      ? `${name || 'They'} will find this letter with your handbook.`
      : opens.kind === 'date'
        ? `It stays sealed in your handbook, marked for ${who} to open on that day.`
        : `It stays sealed in your handbook, marked for ${who} to open when that moment comes.`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <SheetFrame>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.grabber} />
          <View style={[styles.top, { paddingHorizontal: 0 }]}>
            <Text size={22} style={{ flex: 1 }}>{`When should ${name || 'they'} get this?`}</Text>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={onClose}>
              <Text weight={500} color={colors.accent}>
                Done
              </Text>
            </Pressable>
          </View>

          <View accessibilityRole="radiogroup" style={{ gap: 8 }}>
            {kinds.map((item) => {
              const on = opens.kind === item.kind;
              return (
                <Pressable
                  key={item.kind}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => onChange(item.kind === 'handbook' ? { kind: 'handbook' } : item.kind === 'date' ? { kind: 'date', date: opens.kind === 'date' ? opens.date : '' } : { kind: 'moment', moment: opens.kind === 'moment' ? opens.moment : MOMENTS[0] })}
                  style={[styles.option, on && { borderColor: colors.accent, backgroundColor: '#26232F' }]}>
                  <View style={[styles.radio, on && { borderColor: colors.accent }]}>{on && <View style={styles.dot} />}</View>
                  <View style={{ flex: 1 }}>
                    <Text weight={400}>{item.label}</Text>
                    <Text size={13} color={colors.faint}>
                      {item.about}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {opens.kind === 'moment' && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {MOMENTS.map((moment) => {
                const on = opens.moment === moment;
                return (
                  <Pressable key={moment} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => onChange({ kind: 'moment', moment })} style={[styles.chip, on && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                    <Text size={14} weight={500} color={on ? colors.onAccent : '#C9C4D3'}>
                      {moment}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {opens.kind === 'date' && (
            <TextInput
              value={opens.date}
              onChangeText={(date) => onChange({ kind: 'date', date })}
              placeholder="The day, e.g. June 14, 2030"
              placeholderTextColor={colors.faint}
              accessibilityLabel="The day it opens"
              style={styles.date}
            />
          )}

          <View style={styles.how}>
            <Icon name="lock" size={20} />
            <Text size={14} color={colors.soft} style={{ flex: 1, lineHeight: 22 }}>
              {how}
            </Text>
          </View>
        </View>
      </SheetFrame>
    </Modal>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, gap: 12 },
  card: { backgroundColor: colors.card, borderRadius: 18, overflow: 'hidden' },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, minHeight: 50 },
  line: { borderTopWidth: 1, borderTopColor: colors.line },
  to: { flex: 1, color: colors.ink, fontFamily: fonts[400], fontSize: 16, paddingVertical: 12 },
  body: { minHeight: 300, color: '#EDE9F2', fontFamily: fonts[300], fontSize: 17, lineHeight: 29, paddingHorizontal: 2 },
  backdrop: { flex: 1, backgroundColor: 'rgba(5,4,8,0.6)' },
  sheet: { backgroundColor: colors.sheet, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 10, gap: 16 },
  grabber: { width: 38, height: 5, borderRadius: 3, backgroundColor: colors.outline, alignSelf: 'center' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.selected },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#5E5A6B', alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  chip: { height: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 1, borderColor: colors.selected, alignItems: 'center', justifyContent: 'center' },
  date: { height: 50, borderRadius: 14, backgroundColor: '#26232F', color: colors.ink, paddingHorizontal: 14, fontFamily: fonts[300], fontSize: 16 },
  prompt: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 17, borderWidth: 1, borderColor: colors.selected },
  how: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 18, backgroundColor: '#26232F' },
});
