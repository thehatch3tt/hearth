import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Button, Card, Eyebrow, Screen, Text } from '@/components/ui';
import { Photos } from '@/components/Photos';
import { VoiceNotes } from '@/components/Voice';
import { pageById, sectionOf } from '@/lib/content';
import { newId, updatePage, useData, type Entry } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';

/**
 * Writing one page (mockup 7). A list page has entries (an account, a person, a place); every page
 * has room to write, and questions that add themselves to it when tapped. Everything saves as it's typed.
 */
export default function WritePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const page = pageById(id);
  const section = sectionOf(id);
  const saved = useData().pages[id] ?? {};
  if (!page || !section) return null;

  const entries = saved.entries ?? [];
  const setEntries = (change: (list: Entry[]) => Entry[]) => updatePage(id, (current) => ({ ...current, entries: change(current.entries ?? []) }));
  const body = saved.body ?? '';
  const ask = (prompt: string) => updatePage(id, (current) => ({ ...current, body: `${(current.body ?? '').trimEnd()}${current.body?.trim() ? '\n\n' : ''}${prompt}\n` }));
  const number = section.pages.indexOf(page) + 1;

  return (
    <Screen
      footer={
        <>
          <Button label="Finish later" kind="outline" onPress={() => router.back()} style={{ flex: 1, height: 52 }} />
          <Button
            label={saved.done ? 'Marked done' : 'Mark page done'}
            icon={saved.done ? 'check' : undefined}
            onPress={() => {
              updatePage(id, (current) => ({ ...current, done: !current.done }));
              if (!saved.done) router.back();
            }}
            style={{ flex: 1, height: 52 }}
          />
        </>
      }>
      <View style={styles.top}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Back to ${section.short}`} hitSlop={8} onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Icon name="back" size={18} strokeWidth={2} />
          <Text color={colors.accent}>{section.short}</Text>
        </Pressable>
        <Text size={13} color={colors.faint}>{`Page ${number} of ${section.pages.length}`}</Text>
      </View>

      <View style={{ gap: 6 }}>
        <Text size={28} weight={400}>
          {page.title}
        </Text>
        <Text size={15} color={colors.muted} style={{ lineHeight: 22 }}>
          {page.intro}
        </Text>
      </View>

      {page.kind === 'list' && page.entry && (
        <View style={{ gap: 10 }}>
          {entries.map((entry) => (
            <Card key={entry.id} style={{ padding: 14, gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput
                  value={entry.title}
                  onChangeText={(title) => setEntries((list) => list.map((item) => (item.id === entry.id ? { ...item, title } : item)))}
                  placeholder={page.entry?.title}
                  placeholderTextColor={colors.faint}
                  accessibilityLabel={page.entry?.title}
                  style={[styles.field, { flex: 1, fontFamily: fonts[400], fontSize: 17 }]}
                />
                <Pressable accessibilityRole="button" accessibilityLabel="Remove" hitSlop={8} onPress={() => setEntries((list) => list.filter((item) => item.id !== entry.id))} style={styles.remove}>
                  <Icon name="trash" size={16} color={colors.faint} />
                </Pressable>
              </View>
              <TextInput
                value={entry.note}
                onChangeText={(note) => setEntries((list) => list.map((item) => (item.id === entry.id ? { ...item, note } : item)))}
                placeholder={page.entry?.note}
                placeholderTextColor={colors.faint}
                multiline
                accessibilityLabel={page.entry?.note}
                style={[styles.field, { color: colors.soft }]}
              />
            </Card>
          ))}
          <Pressable accessibilityRole="button" onPress={() => setEntries((list) => [...list, { id: newId(), title: '', note: '' }])} style={styles.dashed}>
            <Text color={colors.muted}>{`+ Add ${entries.length ? 'another' : /^[aeiou]/i.test(page.entry.noun) ? 'an' : 'a'} ${page.entry.noun}`}</Text>
          </Pressable>
        </View>
      )}

      <View style={{ gap: 8 }}>
        <Eyebrow>Voice notes</Eyebrow>
        <VoiceNotes
          notes={saved.voice ?? []}
          suggestion={`“${page.prompts[0]}” Just talk, the way you would to them.`}
          onAdd={(note) => updatePage(id, (current) => ({ ...current, voice: [...(current.voice ?? []), note] }))}
          onRemove={(note) => updatePage(id, (current) => ({ ...current, voice: (current.voice ?? []).filter((item) => item.id !== note.id) }))}
        />
      </View>

      <View style={{ gap: 8 }}>
        <Eyebrow>Photos</Eyebrow>
        <Photos
          photos={saved.photos ?? []}
          hint="Where something is kept, a document, a face. Never a photo of a password or a card number."
          onAdd={(added) => updatePage(id, (current) => ({ ...current, photos: [...(current.photos ?? []), ...added] }))}
          onRemove={(photo) => updatePage(id, (current) => ({ ...current, photos: (current.photos ?? []).filter((item) => item.id !== photo.id) }))}
          onCaption={(photo, caption) => updatePage(id, (current) => ({ ...current, photos: (current.photos ?? []).map((item) => (item.id === photo.id ? { ...item, caption } : item)) }))}
        />
      </View>

      <Card style={{ padding: 14, gap: 10 }}>
        <Text size={14} color={colors.muted}>
          Not sure what to say? Tap a question to add it.
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {page.prompts.map((prompt) => (
            <Pressable key={prompt} accessibilityRole="button" onPress={() => ask(prompt)} style={({ pressed }) => [styles.prompt, pressed && { borderColor: colors.accent }]}>
              <Text size={13} color="#C9C4D3">
                {prompt}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <TextInput
        value={body}
        onChangeText={(text) => updatePage(id, (current) => ({ ...current, body: text }))}
        placeholder={page.kind === 'list' ? 'Anything else they should know?' : 'Write here…'}
        placeholderTextColor={colors.faint}
        multiline
        textAlignVertical="top"
        accessibilityLabel={page.title}
        style={styles.body}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 }}>
        <Icon name="lock" size={14} color={colors.faint} strokeWidth={2} />
        <Text size={13} color={colors.faint}>
          Saved on this phone as you write. Never write full account numbers or passwords.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  field: { color: colors.ink, fontFamily: fonts[300], fontSize: 15, paddingVertical: 2 },
  remove: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  dashed: { height: 46, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.outline, alignItems: 'center', justifyContent: 'center' },
  prompt: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 17, borderWidth: 1, borderColor: colors.selected },
  body: { minHeight: 180, borderRadius: 18, backgroundColor: colors.card, color: colors.ink, padding: 16, fontFamily: fonts[300], fontSize: 17, lineHeight: 26 },
});
