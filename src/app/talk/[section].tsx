import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Button, Text } from '@/components/ui';
import { clock, useRecording } from '@/components/Voice';
import { SECTIONS } from '@/lib/content';
import { updatePage } from '@/lib/store';
import { colors } from '@/lib/theme';

/**
 * Talk it through (mockup 11): a section's questions one at a time, answered out loud. Each answer is
 * kept as a voice note on its page, titled with the question.
 */
export default function TalkThrough() {
  const insets = useSafeAreaInsets();
  const { section: sectionId } = useLocalSearchParams<{ section: string }>();
  const section = SECTIONS.find((item) => item.id === sectionId) ?? SECTIONS[0];
  // One question from each page in the section.
  const questions = section.pages.map((page) => ({ page, question: page.prompts[0] }));
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState<{ question: string; seconds: number }[]>([]);
  const { state, start, stop, discard, level } = useRecording();
  const current = questions[index];
  const last = index === questions.length - 1;

  const next = () => (last ? router.back() : setIndex(index + 1));

  const record = async () => {
    if (!state.isRecording) {
      await start();
      return;
    }
    const note = await stop(current.question);
    if (note) {
      updatePage(current.page.id, (page) => ({ ...page, voice: [...(page.voice ?? []), note] }));
      setAnswered((list) => [...list, { question: current.question, seconds: note.seconds }]);
    }
    next();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 20) + 12 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text weight={500}>Talk it through</Text>
          <Text size={13} color={colors.faint}>{`${section.title} · question ${index + 1} of ${questions.length}`}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={async () => {
            await discard();
            router.back();
          }}
          style={styles.round}>
          <Icon name="close" size={16} color={colors.ink} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 6 }}>
        {questions.map((item, i) => (
          <View key={item.page.id} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= index ? colors.accent : colors.selected }} />
        ))}
      </View>

      <View style={{ gap: 12, paddingTop: 12 }}>
        <Text size={28} style={{ lineHeight: 37 }}>
          {current.question}
        </Text>
        <Text color={colors.muted}>{`For “${current.page.title}”. Just talk. You can tidy it up later, or leave it in your own words.`}</Text>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <View style={[styles.ring, { transform: [{ scale: 1 + level * 0.12 }] }]}>
          <Pressable accessibilityRole="button" accessibilityLabel={state.isRecording ? 'Stop and keep this answer' : 'Record your answer'} onPress={record} style={styles.mic}>
            {state.isRecording ? <View style={styles.stop} /> : <Icon name="mic" size={30} color={colors.onAccent} strokeWidth={1.8} />}
          </Pressable>
        </View>
        <Text size={14} color={colors.faint}>
          {state.isRecording ? `Recording ${clock(state.durationMillis / 1000)} · tap to finish` : 'Tap to start talking'}
        </Text>
      </View>

      {answered.length > 0 && (
        <View style={styles.answered}>
          <View style={styles.tick}>
            <Icon name="check" size={12} color={colors.onAccent} strokeWidth={3.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text size={15}>{answered[answered.length - 1].question}</Text>
            <Text size={12} color={colors.faint}>{`Kept · ${clock(answered[answered.length - 1].seconds)}${answered.length > 1 ? ` · ${answered.length} answers so far` : ''}`}</Text>
          </View>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button
          label={last ? 'Finish' : 'Skip this one'}
          kind="outline"
          onPress={async () => {
            await discard();
            next();
          }}
          style={{ flex: 1, height: 52 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 22, gap: 22 },
  round: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  ring: { width: 150, height: 150, borderRadius: 75, backgroundColor: colors.sheet, borderWidth: 1, borderColor: '#2F2C3A', alignItems: 'center', justifyContent: 'center' },
  mic: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  stop: { width: 28, height: 28, borderRadius: 7, backgroundColor: colors.onAccent },
  answered: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.card },
  tick: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
});
