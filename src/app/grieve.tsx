import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { BackButton, Card, Eyebrow, Row, Screen, Text } from '@/components/ui';
import { colors } from '@/lib/theme';

/** "How are you today?" and a gentle reply to each (only for this moment; nothing is saved). */
const MOODS: Record<string, string> = {
  Okay: 'Good. Be gentle with the rest of the day too.',
  Heavy: 'That makes sense. Pick one small thing below, or just rest. Nothing else is required today.',
  Numb: 'Numb is normal, especially early on. It doesn’t mean you don’t care.',
  'A little better': 'Hold on to that. Harder days may still come, and that’s okay.',
  'Not great': 'Thank you for being honest. Would it help to call someone today? The numbers are at the bottom.',
};

const IDEAS: { title: string; about: string; icon: IconName }[] = [
  { title: 'Take a short walk outside', about: 'Ten minutes is enough', icon: 'walk' },
  { title: 'Write to them', about: 'Tell them about your day, as you used to', icon: 'pen' },
  { title: 'Say their name', about: 'Tell someone a story about them', icon: 'chat' },
  { title: 'Keep one ritual', about: 'Coffee in their mug, the Sunday drive', icon: 'cup' },
  { title: 'Rest without guilt', about: 'Grief is tiring work', icon: 'moon' },
  { title: 'Pray, or sit in the quiet', about: 'However feels right to you', icon: 'flame' },
];

/**
 * Ways to grieve (mockup 12), for the family: there's no right way, what can be normal, small things
 * to try, helping a child, and where to find more help. Not medical advice; it points to real help.
 */
export default function Grieve() {
  const [mood, setMood] = useState<string | null>(null);
  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton />
        <Text size={26} weight={400}>
          Ways to grieve
        </Text>
      </View>
      <Text color="#C9C4D3" style={{ lineHeight: 25 }}>
        There&apos;s no right way to do this. These are only ideas, for the days you don&apos;t know what to do with yourself.
      </Text>

      <Card style={{ padding: 16, gap: 12 }}>
        <Text size={17} weight={500}>
          How are you today?
        </Text>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {Object.keys(MOODS).map((label) => {
            const on = mood === label;
            return (
              <Pressable key={label} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setMood(label)} style={[styles.chip, on && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                <Text size={14} weight={500} color={on ? colors.onAccent : '#C9C4D3'}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {mood && (
          <Text size={14} color={colors.muted} style={{ lineHeight: 21 }}>
            {MOODS[mood]}
          </Text>
        )}
      </Card>

      <View style={{ gap: 8 }}>
        <Eyebrow>What can be normal</Eyebrow>
        <Card style={{ padding: 16 }}>
          <Text size={15} color={colors.soft} style={{ lineHeight: 24 }}>
            Feeling fine one hour and undone the next. Forgetting things. Feeling numb, or angry, or relieved. Laughing, then feeling guilty for it. All of it is part of loving someone you&apos;ve lost.
          </Text>
        </Card>
      </View>

      <View style={{ gap: 8 }}>
        <Eyebrow>Small things to try</Eyebrow>
        <Card>
          {IDEAS.map((idea, i) => (
            <Row key={idea.title} first={i === 0} icon={idea.icon} title={idea.title} note={idea.about} />
          ))}
        </Card>
      </View>

      <Card>
        <Row first title="Helping a child grieve" note="What to say, and what to expect at each age" onPress={() => router.push('/grieve-child')} />
      </Card>

      <View style={{ gap: 8 }}>
        <Eyebrow>When you need more</Eyebrow>
        <Card>
          <Row first title="A grief group near you" note="GriefShare groups meet at local churches" onPress={() => Linking.openURL('https://www.griefshare.org')} />
          <Row title="Someone to talk to" note="A grief counselor, your doctor or your pastor" />
        </Card>
        <Pressable accessibilityRole="button" accessibilityLabel="Call or text 988" onPress={() => Linking.openURL('tel:988')} style={styles.crisis}>
          <Icon name="call" size={20} />
          <Text size={15} color="#E4E0EA" style={{ flex: 1, lineHeight: 23 }}>
            If it feels like too much to carry, call or text <Text weight={500}>988</Text>, any time, day or night.
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chip: { height: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 1, borderColor: colors.selected, alignItems: 'center', justifyContent: 'center' },
  crisis: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: colors.accent },
});
