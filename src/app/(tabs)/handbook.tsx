import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Card, Screen, Text } from '@/components/ui';
import { SECTIONS } from '@/lib/content';
import { pageState, useData } from '@/lib/store';
import { colors } from '@/lib/theme';

/** When a page was last written ("Written Sept 2"). */
const writtenOn = (iso?: string) => (iso ? `Written ${new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : '');

/** The handbook, a section at a time (tabs across the top), each page with how far along it is. */
export default function Handbook() {
  const data = useData();
  const params = useLocalSearchParams<{ section?: string }>();
  // A tile on Home opens its section; after that the tabs here decide (until Home opens another).
  const [chosen, setChosen] = useState<{ from?: string; id: string } | null>(null);
  const id = chosen && chosen.from === params.section ? chosen.id : (params.section ?? SECTIONS[0].id);
  const section = SECTIONS.find((item) => item.id === id) ?? SECTIONS[0];

  return (
    <Screen tabs>
      <Text size={28} weight={400}>
        Handbook
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginHorizontal: -18 }}>
        <View style={{ width: 10 }} />
        {SECTIONS.map((item) => {
          const on = item.id === section.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => setChosen({ from: params.section, id: item.id })}
              style={[styles.chip, on && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
              <Text size={14} weight={500} color={on ? colors.onAccent : '#C9C4D3'}>
                {item.short}
              </Text>
            </Pressable>
          );
        })}
        <View style={{ width: 10 }} />
      </ScrollView>

      <View style={{ gap: 4, paddingHorizontal: 2 }}>
        <Text size={20} weight={500}>
          {section.title}
        </Text>
        <Text size={14} color={colors.muted}>
          {section.about}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: '/talk/[section]', params: { section: section.id } })}
        style={({ pressed }) => [styles.talk, pressed && { borderColor: colors.accent }]}>
        <Icon name="mic" size={18} />
        <View style={{ flex: 1 }}>
          <Text weight={400}>Talk it through</Text>
          <Text size={13} color={colors.faint}>
            Answer this section out loud, one question at a time
          </Text>
        </View>
        <Icon name="chevron" size={16} color="#5E5A6B" strokeWidth={2} />
      </Pressable>

      <Card>
        {section.pages.map((page, i) => {
          const saved = data.pages[page.id];
          const state = pageState(saved);
          return (
            <Pressable
              key={page.id}
              accessibilityRole="button"
              accessibilityLabel={`${page.title}, ${state === 'done' ? 'written' : state === 'started' ? 'started' : 'not started'}`}
              onPress={() => router.push({ pathname: '/page/[id]', params: { id: page.id } })}
              style={({ pressed }) => [styles.row, i > 0 && styles.line, pressed && { backgroundColor: colors.raised }]}>
              {state === 'done' ? (
                <View style={[styles.mark, { backgroundColor: colors.accent }]}>
                  <Icon name="check" size={12} color={colors.onAccent} strokeWidth={3.2} />
                </View>
              ) : state === 'started' ? (
                <View style={[styles.mark, { borderWidth: 1.5, borderColor: colors.accent }]}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent }} />
                </View>
              ) : (
                <View style={[styles.mark, { borderWidth: 1.5, borderColor: colors.outline }]} />
              )}
              <View style={{ flex: 1, gap: 2 }}>
                <Text size={16} weight={400}>
                  {page.title}
                </Text>
                <Text size={13} color={state === 'started' ? colors.accent : colors.faint}>
                  {state === 'done' ? writtenOn(saved?.updatedAt) : state === 'started' ? 'Started · keep going' : `Not started · about ${page.minutes} min`}
                </Text>
              </View>
              <Icon name="chevron" size={16} color="#5E5A6B" strokeWidth={2} />
            </Pressable>
          );
        })}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chip: { height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.selected, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 13 },
  line: { borderTopWidth: 1, borderTopColor: colors.line },
  talk: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.selected },
  mark: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
