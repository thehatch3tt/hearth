import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Button, Card, Screen, Text } from '@/components/ui';
import { opensText, useData } from '@/lib/store';
import { colors } from '@/lib/theme';

/** Letters for the people you love: with the handbook, on a date, or at a moment in their life. */
export default function Letters() {
  const { letters } = useData();
  return (
    <Screen tabs>
      <View style={{ gap: 4 }}>
        <Text size={28} weight={400}>
          Letters
        </Text>
        <Text size={15} color={colors.muted}>
          Words for the people you love, kept until the right moment.
        </Text>
      </View>

      {letters.length > 0 ? (
        <View style={{ gap: 10 }}>
          {letters.map((letter) => (
            <Pressable
              key={letter.id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/letter/[id]', params: { id: letter.id } })}
              style={({ pressed }) => [styles.letter, pressed && { backgroundColor: colors.raised }]}>
              <View style={styles.icon}>
                <Icon name={letter.opens.kind === 'moment' ? 'heart' : letter.opens.kind === 'date' ? 'calendar' : 'mail'} size={20} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text size={16} weight={500}>{`To ${letter.to || 'someone'}`}</Text>
                <Text size={13} color={colors.muted}>
                  {opensText(letter.opens)}
                </Text>
              </View>
              <Text size={12} weight={500} color={letter.body.trim() ? '#C9C4D3' : colors.accent}>
                {letter.body.trim() ? 'Written' : 'Draft'}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Card style={{ padding: 18, gap: 6 }}>
          <Text size={17} weight={400}>
            No letters yet
          </Text>
          <Text size={14} color={colors.muted} style={{ lineHeight: 21 }}>
            Write to someone for when your handbook opens, or save one for a day still to come: a wedding, a graduation, a first child.
          </Text>
        </Card>
      )}

      <Card style={{ flexDirection: 'row', gap: 12, padding: 16 }}>
        <Icon name="calendar" size={20} />
        <Text size={14} color={colors.soft} style={{ flex: 1, lineHeight: 22 }}>
          A letter can open with the handbook, on a date you choose, or at a moment someone marks, like a wedding day or a first child.
        </Text>
      </Card>

      <Button label="Write a letter" icon="pen" onPress={() => router.push({ pathname: '/letter/[id]', params: { id: 'new' } })} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  letter: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 18, backgroundColor: colors.card },
  icon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' },
});
