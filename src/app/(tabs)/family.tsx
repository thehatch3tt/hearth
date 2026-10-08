import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { Icon } from '@/components/Icon';
import { Avatar, Button, Card, Hairline, Label, Masthead, Screen, Text, Title } from '@/components/ui';
import { type Person, useQuery } from '@/lib/db';
import { colors } from '@/lib/theme';

/** Everyone in the handbook, one per row: their name as a headline, what to know under it. */
export default function FamilyScreen() {
  const people = useQuery<Person>('SELECT * FROM people ORDER BY sort, id');
  const warnings = useQuery<{ person_id: number; title: string }>(
    "SELECT person_id, title FROM alerts WHERE title != '' ORDER BY sort, id",
  );

  const openPerson = (id: number) => router.push({ pathname: '/person/[id]', params: { id: String(id) } });

  return (
    <Screen tabBar>
      <Masthead label="Everyone in this handbook" />
      <Title size={72}>Family</Title>

      {people?.length === 0 && (
        <Animated.View entering={FadeIn} style={styles.empty}>
          <Text serif italic size={28} style={{ lineHeight: 33 }}>
            No one here yet.
          </Text>
          <Text size={16} color={colors.muted} style={{ lineHeight: 23 }}>
            Add your kids or a parent, with their allergies, medicine and routines.
          </Text>
        </Animated.View>
      )}

      {people && people.length > 0 && (
        <Card style={{ gap: 0 }}>
          {people.map((person, index) => {
            const theirs = warnings?.filter((w) => w.person_id === person.id) ?? [];
            const details = [person.age && `Age ${person.age}`, person.about].filter(Boolean).join(' · ');
            return (
              <Animated.View key={person.id} entering={FadeIn} layout={LinearTransition.duration(240)}>
                {index > 0 && <Hairline />}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={[person.name, ...theirs.map((w) => w.title), details].filter(Boolean).join(', ')}
                  onPress={() => openPerson(person.id)}
                  style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                  <Avatar name={person.name} color={person.color} size={44} />
                  <View style={styles.text}>
                    <Text serif size={30} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ lineHeight: 35 }}>
                      {person.name}
                    </Text>
                    {theirs.length > 0 && (
                      <Label color={colors.accent} numberOfLines={1}>
                        {theirs.map((w) => w.title).join(' · ')}
                      </Label>
                    )}
                    {details ? (
                      <Text size={15} color={colors.muted} numberOfLines={1}>
                        {details}
                      </Text>
                    ) : null}
                  </View>
                  <Icon name="chevron" size={20} color={colors.faint} />
                </Pressable>
              </Animated.View>
            );
          })}
        </Card>
      )}

      <Button title="Add someone" icon="plus" quiet color={colors.ink} onPress={() => router.push('/person/edit')} style={styles.add} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  text: { flex: 1, gap: 3 },
  add: { alignSelf: 'flex-start' },
  pressed: { opacity: 0.6 },
});
