import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { GlassButton, GlassIconButton } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Button, Card, CheckRow, Hairline, Label, LinkButton, Masthead, Screen, tap, Text, Title } from '@/components/ui';
import { useDay, whenText } from '@/lib/day';
import { type Person, useQuery } from '@/lib/db';
import { useTheme } from '@/lib/theme';
import { formatTime, relativeDay, spokenDate, spokenTime, todayKey, weekdayName } from '@/lib/time';

/** How many of the rest of today to show; the whole day is a page of its own. */
const SHOWN = 3;

/** Today, set like a magazine page: the day as a headline, the next thing due, what's after it, and the people. */
export default function TodayScreen() {
  const { colors } = useTheme();
  const { people, byId, items, open, done, next, toggle, settings } = useDay();
  const warnings = useQuery<{ person_id: number; title: string }>(
    "SELECT person_id, title FROM alerts WHERE title != '' ORDER BY sort, id",
  );
  const appointments = useQuery<{ person_id: number; day: string; title: string }>(
    "SELECT person_id, day, title FROM appointments WHERE day >= ? AND day != '' ORDER BY day, time",
    [todayKey()],
  );

  const after = open.filter((item) => item !== next).slice(0, SHOWN);
  const family = settings.family_name?.trim();
  const now = new Date();

  const openPerson = (id: number) => router.push({ pathname: '/person/[id]', params: { id: String(id) } });
  const openDay = () => router.push('/day');

  /** The short note beside a name in the contents: a warning first, else the next appointment, else their age. */
  function aside(person: Person) {
    const warning = warnings?.find((w) => w.person_id === person.id);
    if (warning) return { text: warning.title, alert: true };
    const visit = appointments?.find((a) => a.person_id === person.id);
    if (visit) return { text: `${visit.title || 'Appointment'} ${relativeDay(visit.day)}`, alert: false };
    return { text: person.age ? `age ${person.age}` : '', alert: false };
  }

  return (
    <Screen tabBar>
      <Masthead
        label={family ? `The ${family} Family Handbook` : 'Our Family Handbook'}
        right={<GlassIconButton icon="settings" label="Settings" onPress={() => router.push('/settings')} />}
      />

      <Title size={72} deck={spokenDate(now)}>
        {weekdayName(now)}
      </Title>

      {people?.length === 0 && (
        <Animated.View entering={FadeIn} style={[styles.lead, styles.thinRule, { borderTopColor: colors.border }]}>
          <Label color={colors.accent}>Welcome</Label>
          <Text serif size={32} style={styles.headline}>
            Start with the people <Text serif italic size={32}>you care for.</Text>
          </Text>
          <Text size={16} color={colors.muted} style={{ lineHeight: 23 }}>
            Add your kids or a parent. Then fill in their allergies, medicine and routines, so anyone helping out knows what to
            do.
          </Text>
          <Button title="Add a person" icon="plus" onPress={() => router.push('/person/edit')} style={{ alignSelf: 'flex-start' }} />
        </Animated.View>
      )}

      {people && people.length > 0 && (
        <>
          <Animated.View
            key={next?.key ?? 'none'}
            entering={FadeIn.duration(260)}
            style={[styles.lead, styles.thinRule, { borderTopColor: colors.border }]}>
            {next ? (
              <>
                <Label color={colors.accent}>{next.time ? `Next, ${whenText(next.time)}` : 'Next'}</Label>
                <Text serif size={32} style={styles.headline}>
                  {`${next.title}, `}
                  <Text serif italic size={32}>
                    {`for ${byId.get(next.personId)!.name}${next.time ? ` ${spokenTime(next.time)}` : ''}.`}
                  </Text>
                </Text>
                {next.note ? (
                  <Text size={16} color={colors.muted} style={{ lineHeight: 22 }}>
                    {next.note}
                  </Text>
                ) : null}
                <GlassButton
                  title={next.kind === 'medicine' ? 'Mark it given →' : 'Mark it done →'}
                  onPress={() => {
                    tap();
                    toggle(next);
                  }}
                />
              </>
            ) : (
              <>
                <Label color={colors.accent}>{items.length ? 'All done' : 'Nothing today'}</Label>
                <Text serif italic size={30} style={styles.headline}>
                  {items.length ? 'Everything is done for today.' : 'Add medicine or a routine on someone’s page.'}
                </Text>
              </>
            )}
          </Animated.View>

          {items.length > 1 && (
            <Animated.View layout={LinearTransition.duration(240)}>
              <Card style={{ gap: 0 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`The whole day, ${done.length} of ${items.length} done`}
                  onPress={openDay}
                  hitSlop={8}
                  style={({ pressed }) => [styles.sectionHead, pressed && styles.pressed]}>
                  <Label color={colors.ink}>{after.length ? 'After that' : 'Today'}</Label>
                  <View style={styles.headRight}>
                    <Text weight={600} size={12} color={colors.muted}>
                      {`${done.length} of ${items.length} done`}
                    </Text>
                    <Icon name="chevron" size={16} color={colors.muted} />
                  </View>
                </Pressable>
                {after.map((item, index) => (
                  <Animated.View
                    key={item.key}
                    entering={FadeIn.duration(220)}
                    exiting={FadeOut.duration(140)}
                    layout={LinearTransition.duration(240)}>
                    {index > 0 && <Hairline />}
                    <CheckRow
                      time={item.time}
                      title={item.title}
                      aside={byId.get(item.personId)!.name}
                      checked={false}
                      label={`${item.title}, ${byId.get(item.personId)!.name}${item.time ? `, ${formatTime(item.time)}` : ''}`}
                      onPress={() => toggle(item)}
                    />
                  </Animated.View>
                ))}
                <LinkButton title="See the whole day →" onPress={openDay} />
              </Card>
            </Animated.View>
          )}

          <Animated.View layout={LinearTransition.duration(240)}>
            <Card style={{ gap: 2 }}>
              <Label color={colors.ink}>In this handbook</Label>
              {people.map((person) => {
                const note = aside(person);
                return (
                  <Pressable
                    key={person.id}
                    accessibilityRole="link"
                    accessibilityLabel={[person.name, note.text].filter(Boolean).join(', ')}
                    accessibilityHint="Opens their page"
                    onPress={() => openPerson(person.id)}
                    style={({ pressed }) => [styles.contentsRow, pressed && styles.pressed]}>
                    <Text
                      serif
                      size={24}
                      numberOfLines={1}
                      style={[styles.name, { textDecorationColor: colors.faint }]}>
                      {person.name}
                    </Text>
                    <Text size={12} color={colors.faint} numberOfLines={1} ellipsizeMode="clip" style={styles.leader}>
                      {LEADER}
                    </Text>
                    {note.text ? (
                      <Text
                        weight={700}
                        size={12}
                        color={note.alert ? colors.accent : colors.muted}
                        numberOfLines={1}
                        style={[styles.asideText, note.alert && styles.caps]}>
                        {note.text}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
              <LinkButton title="+ Add someone" onPress={() => router.push('/person/edit')} />
            </Card>
          </Animated.View>
        </>
      )}
    </Screen>
  );
}

/** Dots that run from a name to its note, cut off wherever the row ends. */
const LEADER = ' .'.repeat(80);

const styles = StyleSheet.create({
  caps: { letterSpacing: 1.5, textTransform: 'uppercase' },
  lead: { gap: 12, paddingTop: 16 },
  thinRule: { borderTopWidth: 1 },
  headline: { lineHeight: 36 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 32 },
  headRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  contentsRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, minHeight: 44, paddingVertical: 4 },
  name: { flexShrink: 1, textDecorationLine: 'underline' },
  leader: { flex: 1, minWidth: 16 },
  asideText: { maxWidth: 170, flexShrink: 0 },
  pressed: { opacity: 0.6 },
});
