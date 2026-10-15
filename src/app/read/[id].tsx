import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Photos } from '@/components/Photos';
import { BackButton, Button, Card, Eyebrow, Screen, Text } from '@/components/ui';
import { VoiceNotes } from '@/components/Voice';
import { pageById, sectionOf } from '@/lib/content';
import { useData } from '@/lib/store';
import { colors } from '@/lib/theme';

/** One page as the family reads it (from the preview): what's written, the photos and the voice notes. */
export default function ReadPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const page = pageById(id);
  const section = sectionOf(id);
  const saved = useData().pages[id] ?? {};
  if (!page || !section) return null;

  const entries = (saved.entries ?? []).filter((entry) => entry.title.trim() || entry.note.trim());
  const fields = (page.fields ?? []).map((field) => ({ ...field, value: saved.fields?.[field.id]?.trim() ?? '' })).filter((field) => field.value);
  const body = saved.body?.trim();
  const photos = saved.photos ?? [];
  const voice = saved.voice ?? [];
  const empty = !entries.length && !fields.length && !body && !photos.length && !voice.length;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton />
        <Text size={13} color={colors.faint} style={{ flex: 1 }}>
          {section.title}
        </Text>
      </View>

      <Text size={28} weight={400}>
        {page.title}
      </Text>

      {fields.length > 0 && (
        <Card>
          {fields.map((field, i) => (
            <View key={field.id} style={{ paddingHorizontal: 14, paddingVertical: 12, gap: 2, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
              <Text size={13} color={colors.faint}>
                {field.label}
              </Text>
              <Text weight={400}>{field.value}</Text>
            </View>
          ))}
        </Card>
      )}

      {entries.length > 0 && (
        <Card>
          {entries.map((entry, i) => (
            <View key={entry.id} style={{ paddingHorizontal: 14, paddingVertical: 12, gap: 2, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
              <Text weight={400}>{entry.title.trim() || '—'}</Text>
              {entry.note.trim() ? (
                <Text size={14} color={colors.muted} style={{ lineHeight: 21 }}>
                  {entry.note.trim()}
                </Text>
              ) : null}
            </View>
          ))}
        </Card>
      )}

      {body ? (
        <Text size={17} color="#E4E0EA" style={{ lineHeight: 27 }}>
          {body}
        </Text>
      ) : null}

      {photos.length > 0 && (
        <View style={{ gap: 8 }}>
          <Eyebrow>Photos</Eyebrow>
          <Photos photos={photos} readOnly />
        </View>
      )}

      {voice.length > 0 && (
        <View style={{ gap: 8 }}>
          <Eyebrow>In their own voice</Eyebrow>
          <VoiceNotes notes={voice} readOnly />
        </View>
      )}

      {empty && (
        <Card style={{ padding: 16, gap: 12 }}>
          <Text color={colors.muted}>Nothing is written on this page yet.</Text>
          <Button label="Write it now" kind="outline" icon="pen" onPress={() => router.replace({ pathname: '/page/[id]', params: { id } })} />
        </Card>
      )}
    </Screen>
  );
}
