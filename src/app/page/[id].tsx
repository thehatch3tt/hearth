import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { choosePhotos, Photos } from '@/components/Photos';
import { Eyebrow, Screen, Text } from '@/components/ui';
import { RecordSheet, VoiceNotes } from '@/components/Voice';
import { pageById, personal, sectionOf } from '@/lib/content';
import { newId, updatePage, useData, type Entry } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';

/**
 * Writing one page (mockup A3 on the "calmer looks" canvas). A list page has entries (an account, a
 * person, a place); a fields page asks for a few set things; every page has room to write. The glass
 * bar at the foot adds a question to think about, a voice note or a photo. Everything saves as it's
 * typed, so there's nothing to finish: "Done for now" just goes back.
 * Opened with `ask` (from Home's question), that question starts the writing.
 */
export default function WritePage() {
  const { id, ask: asked } = useLocalSearchParams<{ id: string; ask?: string }>();
  const page = pageById(id);
  const section = sectionOf(id);
  const data = useData();
  const saved = data.pages[id] ?? {};
  const names = data.people.map((person) => person.name);
  const bodyRef = useRef<TextInput>(null);
  const [recording, setRecording] = useState(false);

  const ask = (prompt: string) => {
    updatePage(id, (current) => ({ ...current, body: `${(current.body ?? '').trimEnd()}${current.body?.trim() ? '\n\n' : ''}${prompt}\n` }));
    setTimeout(() => bodyRef.current?.focus(), 50);
  };

  // Home's question: start the writing with it (once; not again if it's already there).
  const askedOnce = useRef(false);
  useEffect(() => {
    if (!asked || askedOnce.current) return;
    askedOnce.current = true;
    if (!(saved.body ?? '').includes(asked)) ask(asked);
  });

  if (!page || !section) return null;

  const entries = saved.entries ?? [];
  const setEntries = (change: (list: Entry[]) => Entry[]) => updatePage(id, (current) => ({ ...current, entries: change(current.entries ?? []) }));
  const setField = (field: string, value: string) => updatePage(id, (current) => ({ ...current, fields: { ...current.fields, [field]: value } }));
  // The next question not already in the writing (round again once they're all there).
  const body = saved.body ?? '';
  const nextQuestion = page.prompts.find((prompt) => !body.includes(prompt)) ?? page.prompts[0];

  return (
    <Screen
      gap={24}
      floating={
        <>
          <ToolButton icon="chat" label={`Add a question: ${nextQuestion}`} onPress={() => ask(nextQuestion)} />
          <ToolButton icon="mic" label="Record a voice note" onPress={() => setRecording(true)} />
          <ToolButton
            icon="photo"
            label="Add a photo"
            onPress={() => choosePhotos((added) => updatePage(id, (current) => ({ ...current, photos: [...(current.photos ?? []), ...added] })))}
          />
          <View style={{ flex: 1 }} />
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={({ pressed }) => [styles.done, pressed && { opacity: 0.75 }]}>
            <Text weight={500} color={colors.onAccent}>
              Done for now
            </Text>
          </Pressable>
        </>
      }>
      <Pressable accessibilityRole="button" accessibilityLabel={`Back to ${section.short}`} hitSlop={8} onPress={() => router.back()} style={styles.back}>
        <Icon name="back" size={18} color={colors.soft} strokeWidth={2} />
        <Text size={15} color={colors.soft}>
          {section.short}
        </Text>
      </Pressable>

      <View style={{ gap: 8 }}>
        <Text size={28} style={{ lineHeight: 34 }}>
          {page.title}
        </Text>
        <Text size={15} color={colors.muted} style={{ lineHeight: 22 }}>
          {personal(page.intro, names)}
        </Text>
      </View>

      {page.kind === 'fields' && page.fields && (
        <View>
          {page.fields.map((field, i) => (
            <View key={field.id} style={[styles.field, i > 0 && styles.line]}>
              <Text size={13} color={colors.faint}>
                {field.label}
              </Text>
              <TextInput
                value={saved.fields?.[field.id] ?? ''}
                onChangeText={(value) => setField(field.id, value)}
                placeholder={field.hint}
                placeholderTextColor="#5E5A6B"
                multiline
                accessibilityLabel={field.label}
                style={styles.fieldInput}
              />
            </View>
          ))}
        </View>
      )}

      {page.kind === 'list' && page.entry && (
        <View>
          {entries.map((entry, i) => (
            <View key={entry.id} style={[styles.entry, i > 0 && styles.line]}>
              <View style={{ flex: 1 }}>
                <TextInput
                  value={entry.title}
                  onChangeText={(title) => setEntries((list) => list.map((item) => (item.id === entry.id ? { ...item, title } : item)))}
                  placeholder={page.entry?.title}
                  placeholderTextColor="#5E5A6B"
                  accessibilityLabel={page.entry?.title}
                  style={styles.entryTitle}
                />
                <TextInput
                  value={entry.note}
                  onChangeText={(note) => setEntries((list) => list.map((item) => (item.id === entry.id ? { ...item, note } : item)))}
                  placeholder={page.entry?.note}
                  placeholderTextColor="#5E5A6B"
                  multiline
                  accessibilityLabel={page.entry?.note}
                  style={styles.entryNote}
                />
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${entry.title || page.entry?.noun}`} hitSlop={8} onPress={() => setEntries((list) => list.filter((item) => item.id !== entry.id))} style={styles.remove}>
                <Icon name="close" size={14} color={colors.faint} strokeWidth={2} />
              </Pressable>
            </View>
          ))}
          <Pressable accessibilityRole="button" onPress={() => setEntries((list) => [...list, { id: newId(), title: '', note: '' }])} style={({ pressed }) => [styles.add, entries.length > 0 && { marginTop: 12 }, pressed && { borderColor: colors.accent }]}>
            <Text size={15} color={colors.muted}>{`+ Add ${entries.length ? 'another' : /^[aeiou]/i.test(page.entry.noun) ? 'an' : 'a'} ${page.entry.noun}`}</Text>
          </Pressable>
        </View>
      )}

      <View style={{ gap: 8 }}>
        {page.kind !== 'note' && <Eyebrow style={{ paddingHorizontal: 0 }}>Anything else</Eyebrow>}
        <TextInput
          ref={bodyRef}
          value={body}
          onChangeText={(text) => updatePage(id, (current) => ({ ...current, body: text }))}
          placeholder={page.kind === 'note' ? 'Write here, the way you’d say it to them…' : 'Anything else they should know?'}
          placeholderTextColor="#5E5A6B"
          multiline
          scrollEnabled={false}
          textAlignVertical="top"
          accessibilityLabel={page.kind === 'note' ? page.title : 'Anything else'}
          style={[styles.body, { minHeight: page.kind === 'note' ? 220 : 90 }]}
        />
      </View>

      {(saved.voice?.length ?? 0) > 0 && (
        <View style={{ gap: 8 }}>
          <Eyebrow style={{ paddingHorizontal: 0 }}>In your voice</Eyebrow>
          <VoiceNotes
            notes={saved.voice ?? []}
            recordButton={false}
            onRemove={(note) => updatePage(id, (current) => ({ ...current, voice: (current.voice ?? []).filter((item) => item.id !== note.id) }))}
          />
        </View>
      )}

      {(saved.photos?.length ?? 0) > 0 && (
        <View style={{ gap: 8 }}>
          <Eyebrow style={{ paddingHorizontal: 0 }}>Photos</Eyebrow>
          <Photos
            photos={saved.photos ?? []}
            addTile={false}
            onRemove={(photo) => updatePage(id, (current) => ({ ...current, photos: (current.photos ?? []).filter((item) => item.id !== photo.id) }))}
            onCaption={(photo, caption) => updatePage(id, (current) => ({ ...current, photos: (current.photos ?? []).map((item) => (item.id === photo.id ? { ...item, caption } : item)) }))}
          />
        </View>
      )}

      <View style={styles.kept}>
        <Icon name={page.id === 'papers' ? 'file' : 'lock'} size={15} color={colors.accent} strokeWidth={1.9} />
        <Text size={13} color={colors.muted} style={{ flex: 1, lineHeight: 19 }}>
          {page.note ? `${personal(page.note, names)} Kept only on this phone.` : 'Kept only on this phone, saved as you write. Never write full account numbers or passwords.'}
        </Text>
      </View>

      <RecordSheet
        visible={recording}
        suggestion={`“${nextQuestion}” Just talk, the way you would to them.`}
        onClose={() => setRecording(false)}
        onSave={(note) => updatePage(id, (current) => ({ ...current, voice: [...(current.voice ?? []), note] }))}
      />
    </Screen>
  );
}

function ToolButton({ icon, label, onPress }: { icon: 'chat' | 'mic' | 'photo'; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.tool, pressed && { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
      <Icon name={icon} size={22} color={colors.soft} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', height: 40, paddingLeft: 8, paddingRight: 14, borderRadius: 999, backgroundColor: colors.card },
  line: { borderTopWidth: 1, borderTopColor: colors.line },
  field: { paddingVertical: 10, gap: 1 },
  fieldInput: { color: colors.ink, fontFamily: fonts[300], fontSize: 17, paddingVertical: 2 },
  entry: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 10 },
  entryTitle: { color: colors.ink, fontFamily: fonts[400], fontSize: 17, paddingVertical: 2 },
  entryNote: { color: colors.muted, fontFamily: fonts[300], fontSize: 15, paddingVertical: 2 },
  remove: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  add: { alignSelf: 'flex-start', height: 40, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: colors.selected, justifyContent: 'center' },
  body: { color: colors.ink, fontFamily: fonts[300], fontSize: 17, lineHeight: 27, padding: 0 },
  kept: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 18, backgroundColor: colors.card },
  tool: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  done: { height: 46, paddingHorizontal: 20, borderRadius: 999, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
});
