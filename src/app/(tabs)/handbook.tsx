import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Icon } from '@/components/Icon';
import { Screen, Text } from '@/components/ui';
import { SECTIONS } from '@/lib/content';
import { isWritten, pageSummary, useData } from '@/lib/store';
import { colors } from '@/lib/theme';

/**
 * The handbook as a contents (A2 on the "calmer looks" canvas): each part opens in place to show its
 * pages, with the first words of what's written on each. A tile on Home opens its part here.
 */
export default function Handbook() {
  const data = useData();
  const params = useLocalSearchParams<{ section?: string }>();
  // A tile on Home opens its part; after that, taps here decide (until Home opens another).
  const [chosen, setChosen] = useState<{ from?: string; id: string | null } | null>(null);
  const open = chosen && chosen.from === params.section ? chosen.id : (params.section ?? SECTIONS[0].id);
  const toggle = (id: string) => setChosen({ from: params.section, id: open === id ? null : id });

  return (
    <Screen tabs gap={20}>
      <View style={{ gap: 4, paddingHorizontal: 2 }}>
        <Text size={30} weight={200} style={{ lineHeight: 38 }}>
          Handbook
        </Text>
        <Text size={15} color={colors.faint}>
          Five parts. Write them in any order, a little at a time.
        </Text>
      </View>

      <View>
        {SECTIONS.map((section, index) => {
          const expanded = open === section.id;
          const written = section.pages.filter((page) => isWritten(data.pages[page.id])).length;
          return (
            <View key={section.id} style={index > 0 && styles.line}>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded }} accessibilityLabel={`${section.title}, ${written} of ${section.pages.length} written`} onPress={() => toggle(section.id)} style={styles.part}>
                <Text size={14} weight={400} color={colors.accent} style={{ width: 22 }}>
                  {index + 1}
                </Text>
                <Text size={17} weight={400} style={{ flex: 1 }}>
                  {section.title}
                </Text>
                <Text size={14} color={colors.faint}>{`${written} of ${section.pages.length}`}</Text>
                <View style={{ transform: [{ rotate: expanded ? '-90deg' : '90deg' }] }}>
                  <Icon name="chevron" size={16} color={expanded ? colors.faint : '#5E5A6B'} strokeWidth={2} />
                </View>
              </Pressable>

              {expanded && (
                <Animated.View entering={FadeIn.duration(180)} style={styles.pages}>
                  <Text size={14} color={colors.muted} style={{ paddingBottom: 6 }}>
                    {section.about}
                  </Text>
                  {section.pages.map((page) => {
                    const saved = data.pages[page.id];
                    const done = isWritten(saved);
                    return (
                      <Pressable
                        key={page.id}
                        accessibilityRole="button"
                        accessibilityLabel={`${page.title}, ${done ? 'written' : 'not written yet'}`}
                        onPress={() => router.push({ pathname: '/page/[id]', params: { id: page.id } })}
                        style={({ pressed }) => [styles.page, pressed && { opacity: 0.6 }]}>
                        <View style={[styles.mark, done ? { backgroundColor: colors.accent } : { borderWidth: 1.5, borderColor: colors.outline }]} />
                        <View style={{ flex: 1, gap: 1 }}>
                          <Text size={16} color={done ? colors.ink : colors.soft}>
                            {page.title}
                          </Text>
                          <Text size={13} color={colors.faint} numberOfLines={1}>
                            {done ? pageSummary(saved) : `About ${page.minutes} minutes`}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </Animated.View>
              )}
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  line: { borderTopWidth: 1, borderTopColor: colors.line },
  part: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 60, paddingHorizontal: 2 },
  pages: { paddingLeft: 36, paddingBottom: 12 },
  page: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  mark: { width: 10, height: 10, borderRadius: 5 },
});
