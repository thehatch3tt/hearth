import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { Button, Card, RoundButton, Screen, Text } from '@/components/ui';
import { type Person, useQuery, useSettings } from '@/lib/db';
import { colors, personColor, radius } from '@/lib/theme';
import { daysUntil, greeting, longDay, relativeDay, shortTime, todayKey } from '@/lib/time';

type TodayItem = {
  key: string;
  person: Person;
  icon: IconName;
  title: string;
  detail: string;
  /** Sorts the list: "HH:MM" today, or the day and time ahead. */
  order: string;
};

export default function HomeScreen() {
  const settings = useSettings();
  const today = todayKey();
  const people = useQuery<Person>('SELECT * FROM people ORDER BY sort, id');
  const warned = useQuery<{ person_id: number }>(
    "SELECT DISTINCT person_id FROM alerts WHERE title != '' OR details != ''",
  );
  // Medicine still to give today.
  const dueMeds = useQuery<{ id: number; person_id: number; name: string; time: string }>(
    `SELECT id, person_id, name, time FROM medicines m
     WHERE time != '' AND name != '' AND NOT EXISTS (SELECT 1 FROM doses d WHERE d.medicine_id = m.id AND d.day = ?)
     ORDER BY time`,
    [today],
  );
  const appointments = useQuery<{ id: number; person_id: number; day: string; time: string; title: string; driver: string }>(
    "SELECT id, person_id, day, time, title, driver FROM appointments WHERE day >= ? AND day != '' ORDER BY day, time",
    [today],
  );

  const family = settings.family_name?.trim();
  const me = settings.my_name?.trim();
  const byId = new Map(people?.map((p) => [p.id, p]));

  // What's left today, and appointments in the coming week.
  const items: TodayItem[] = [];
  for (const med of dueMeds ?? []) {
    const person = byId.get(med.person_id);
    if (person) {
      items.push({
        key: `m${med.id}`,
        person,
        icon: 'pill',
        title: `${person.name}: ${med.name}`,
        detail: shortTime(med.time),
        order: `0 ${med.time}`,
      });
    }
  }
  for (const visit of appointments ?? []) {
    const person = byId.get(visit.person_id);
    if (person && daysUntil(visit.day) < 7) {
      items.push({
        key: `a${visit.id}`,
        person,
        icon: 'calendar',
        title: `${person.name}: ${visit.title || 'Appointment'}`,
        detail: [relativeDay(visit.day), visit.time && shortTime(visit.time), visit.driver && `${visit.driver} is driving`]
          .filter(Boolean)
          .join(' · '),
        order: `${daysUntil(visit.day) === 0 ? 0 : 1} ${visit.day} ${visit.time}`,
      });
    }
  }
  items.sort((a, b) => a.order.localeCompare(b.order));

  return (
    <Screen>
      <View style={styles.top}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text weight={700} size={15} color={colors.muted}>
            {me ? `${greeting()}, ${me}` : greeting()}
          </Text>
          <Text weight={900} size={34} style={styles.title}>
            {family ? `${family} Family Handbook` : 'Our Family Handbook'}
          </Text>
        </View>
        <RoundButton icon="settings" label="Settings" onPress={() => router.push('/settings')} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.peopleScroll} contentContainerStyle={styles.people}>
        {people?.map((person) => {
          const c = personColor(person.color);
          const hasWarning = warned?.some((w) => w.person_id === person.id);
          return (
            <Pressable
              key={person.id}
              accessibilityRole="button"
              accessibilityLabel={hasWarning ? `${person.name}, has an allergy or warning` : person.name}
              onPress={() => router.push({ pathname: '/person/[id]', params: { id: String(person.id) } })}
              style={({ pressed }) => [styles.person, pressed && styles.pressed]}>
              <View style={[styles.avatar, { backgroundColor: c.soft }, hasWarning && styles.ring]}>
                <Text weight={900} size={28} color={c.strong}>
                  {person.name.trim().charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
              <Text weight={800} size={14} numberOfLines={1}>
                {person.name}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add someone"
          onPress={() => router.push('/person/edit')}
          style={({ pressed }) => [styles.person, pressed && styles.pressed]}>
          <View style={[styles.avatar, styles.addAvatar]}>
            <Icon name="plus" size={26} color={colors.muted} strokeWidth={2.4} />
          </View>
          <Text weight={700} size={14} color={colors.muted}>
            Add
          </Text>
        </Pressable>
      </ScrollView>

      {people?.length === 0 ? (
        <Card style={styles.bigCard}>
          <Text weight={900} size={20}>
            Start with the people you care for
          </Text>
          <Text weight={600} size={15} color={colors.muted} style={{ lineHeight: 21 }}>
            Add your kids or a parent. Then fill in their allergies, medicines and routines, so anyone
            helping out knows what to do.
          </Text>
          <Button title="Add a person" icon="plus" onPress={() => router.push('/person/edit')} />
        </Card>
      ) : (
        <Card style={styles.bigCard}>
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <Text weight={900} size={20}>
              Today
            </Text>
            <View style={styles.datePill}>
              <Text weight={800} size={13}>
                {longDay(today)}
              </Text>
            </View>
          </View>
          {items.length === 0 && (
            <Text weight={600} size={14} color={colors.muted}>
              Nothing left to do today.
            </Text>
          )}
          {items.map((item) => {
            const c = personColor(item.person.color);
            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/person/[id]', params: { id: String(item.person.id) } })}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                <View style={[styles.itemIcon, { backgroundColor: c.soft }]}>
                  <Icon name={item.icon} size={20} color={c.strong} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text weight={800} size={16} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text weight={600} size={13} color={colors.muted}>
                    {item.detail}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </Card>
      )}

      {people && people.length > 0 && (
        <Button title="Share with a sitter" icon="share" onPress={() => router.push('/share')} style={styles.share} />
      )}

      <View style={[styles.row, { alignItems: 'stretch' }]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/house')}
          style={({ pressed }) => [styles.tile, { backgroundColor: colors.card }, pressed && styles.pressed]}>
          <Text weight={900} size={16}>
            Our home
          </Text>
          <Text weight={600} size={13} color={colors.muted}>
            Wi-Fi, alarm, where things are
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/emergency')}
          style={({ pressed }) => [styles.tile, { backgroundColor: colors.alert }, pressed && styles.pressed]}>
          <Text weight={900} size={16} color={colors.alertText}>
            Emergency
          </Text>
          <Text weight={600} size={13} color="#7A3A2E">
            Big buttons, works offline
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 6 },
  title: { letterSpacing: -0.3, lineHeight: 40 },
  // The row of faces runs to the screen's edges as it scrolls.
  peopleScroll: { marginHorizontal: -20 },
  people: { paddingHorizontal: 20, gap: 14, paddingVertical: 6 },
  person: { width: 76, alignItems: 'center', gap: 6 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  // A gap in the page color, then the ring, as in the mockup.
  ring: { boxShadow: `0 0 0 3px ${colors.background}, 0 0 0 5px ${colors.ring}` },
  addAvatar: { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.faint },
  bigCard: { borderRadius: radius.big, padding: 20, gap: 14 },
  datePill: { backgroundColor: colors.chip, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  itemIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  share: { height: 56, borderRadius: 28 },
  tile: { flex: 1, borderRadius: radius.card, padding: 16, gap: 4 },
  pressed: { opacity: 0.7 },
});
