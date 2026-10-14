import { View } from 'react-native';

import { BackButton, Card, Eyebrow, Screen, Text } from '@/components/ui';
import { colors } from '@/lib/theme';

const AGES = [
  {
    age: 'Under 5',
    points: ['Use simple, true words: “died”, not “went to sleep” or “we lost him”.', 'Expect the same questions again and again. Answer them each time.', 'Keep their routines: meals, naps and bedtime help them feel safe.'],
  },
  {
    age: '6 to 11',
    points: ['Answer their questions honestly, in small pieces.', 'They may grieve in bursts, then go back to playing. That is normal.', 'Give them a small part in remembering: a drawing, a song, a candle.'],
  },
  {
    age: 'Teenagers',
    points: ['They may turn to friends more than family. Stay near without pushing.', 'Invite them to talk, and keep inviting.', 'Watch for pulling away from everything for weeks at a time.'],
  },
];

/** Helping a child grieve: a few plain points by age. */
export default function GrieveChild() {
  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton />
        <Text size={24} weight={400}>
          Helping a child grieve
        </Text>
      </View>
      <Text color="#C9C4D3" style={{ lineHeight: 25 }}>
        Children grieve too, often in ways that look different from ours. Being honest, and staying close, matters more than finding perfect words.
      </Text>

      {AGES.map((group) => (
        <View key={group.age} style={{ gap: 8 }}>
          <Eyebrow>{group.age}</Eyebrow>
          <Card style={{ padding: 16, gap: 10 }}>
            {group.points.map((point) => (
              <View key={point} style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, marginTop: 9 }} />
                <Text size={15} color={colors.soft} style={{ flex: 1, lineHeight: 23 }}>
                  {point}
                </Text>
              </View>
            ))}
          </Card>
        </View>
      ))}

      <View style={{ gap: 8 }}>
        <Eyebrow>For every age</Eyebrow>
        <Card style={{ padding: 16 }}>
          <Text size={15} color={colors.soft} style={{ lineHeight: 23 }}>
            Let their school know. It&apos;s okay for them to see you cry. If you&apos;re worried about them, talk with their doctor or a school counselor.
          </Text>
        </Card>
      </View>
    </Screen>
  );
}
