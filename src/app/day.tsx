import { Fragment } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { Card, CheckRow, Hairline, Masthead, Screen, SectionTitle, Text, Title } from '@/components/ui';
import { type DayItem, partOfDay, useDay } from '@/lib/day';
import { useTheme } from '@/lib/theme';
import { formatTime, spokenDate, weekdayName } from '@/lib/time';

/**
 * The whole day on one page: everything to give or do today, morning to evening, with what's done
 * still in its place (struck through) so the day reads in order.
 */
export default function DayScreen() {
  const { colors } = useTheme();
  const { byId, items, done, toggle } = useDay();
  const now = new Date();

  // In time order already, so each part of the day comes out in order too.
  const parts: { name: string; items: DayItem[] }[] = [];
  for (const item of items) {
    const name = partOfDay(item.time);
    const part = parts.find((p) => p.name === name);
    if (part) part.items.push(item);
    else parts.push({ name, items: [item] });
  }

  return (
    <Screen>
      <Masthead back label={`${weekdayName(now)}, ${done.length} of ${items.length} done`} />
      <Title size={56} deck={spokenDate(now)}>
        The whole day
      </Title>

      {items.length === 0 && (
        <Text serif italic size={22} color={colors.muted} style={{ lineHeight: 28 }}>
          Nothing today. Add medicine or a routine on someone’s page.
        </Text>
      )}

      {parts.map((part) => (
        <Animated.View key={part.name} entering={FadeIn} layout={LinearTransition.duration(240)}>
          <Card style={{ gap: 0 }}>
            <SectionTitle
              title={part.name}
              right={`${part.items.filter((i) => i.doneId !== null).length} of ${part.items.length}`}
            />
            <View>
              {part.items.map((item, index) => {
                const person = byId.get(item.personId)!;
                return (
                  <Fragment key={item.key}>
                    {index > 0 && <Hairline />}
                    <CheckRow
                      time={item.time}
                      title={item.title}
                      note={item.note}
                      aside={person.name}
                      checked={item.doneId !== null}
                      label={`${item.title}, ${person.name}${item.time ? `, ${formatTime(item.time)}` : ''}`}
                      onPress={() => toggle(item)}
                    />
                  </Fragment>
                );
              })}
            </View>
          </Card>
        </Animated.View>
      ))}
    </Screen>
  );
}
