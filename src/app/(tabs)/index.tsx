import { router } from 'expo-router';
import { type SQLiteDatabase, useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert as Confirm, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { GlassButton, GlassIconButton } from '@/components/Glass';
import { Button, Card, CheckRow, Hairline, Label, LinkButton, Masthead, Screen, SectionTitle, tap, Text, Title } from '@/components/ui';
import { deleteRow, insertRow, type Person, useQuery, useSettings } from '@/lib/db';
import { colors } from '@/lib/theme';
import { formatTime, minutesUntil, relativeDay, spokenDate, spokenTime, todayKey, weekdayName } from '@/lib/time';

/** One thing to do today: a timed medicine or a routine step. */
type DayItem = {
  key: string;
  kind: 'medicine' | 'step';
  id: number;
  personId: number;
  /** "HH:MM", or empty for a step with no time. */
  time: string;
  title: string;
  note: string;
  /** The dose or check that marks it done today, if it's done. */
  doneId: number | null;
};

/** Marks an item done now. Outside the component because it reads the clock. */
function markDone(db: SQLiteDatabase, item: DayItem, by: string) {
  if (item.kind === 'medicine') {
    return insertRow(db, 'doses', { medicine_id: item.id, day: todayKey(), given_at: Date.now(), given_by: by });
  }
  return insertRow(db, 'step_checks', { step_id: item.id, day: todayKey(), done_at: Date.now(), done_by: by });
}

function markNotDone(db: SQLiteDatabase, item: DayItem) {
  if (item.doneId === null) return;
  return deleteRow(db, item.kind === 'medicine' ? 'doses' : 'step_checks', item.doneId);
}

/** "in 25 minutes", "now", "was due 8:00 am", "at 5:30 pm" */
function whenText(time: string) {
  const minutes = minutesUntil(time);
  if (minutes > 90) return `at ${formatTime(time)}`;
  if (minutes > 1) return `in ${minutes} minutes`;
  if (minutes >= -5) return 'now';
  return `was due ${formatTime(time)}`;
}

/** How many of the rest of today to show before "See the whole day". */
const SHOWN = 3;

/** Today, set like a magazine page: the day as a headline, the next thing due, the rest, and the people. */
export default function TodayScreen() {
  const db = useSQLiteContext();
  const settings = useSettings();
  const today = todayKey();
  const [showAll, setShowAll] = useState(false);

  const people = useQuery<Person>('SELECT * FROM people ORDER BY sort, id');
  const warnings = useQuery<{ person_id: number; title: string }>(
    "SELECT person_id, title FROM alerts WHERE title != '' ORDER BY sort, id",
  );
  const medicines = useQuery<{ id: number; person_id: number; name: string; time: string; note: string; dose_id: number | null }>(
    `SELECT id, person_id, name, time, note,
       (SELECT d.id FROM doses d WHERE d.medicine_id = m.id AND d.day = ? LIMIT 1) AS dose_id
     FROM medicines m WHERE time != '' AND name != ''`,
    [today],
  );
  const steps = useQuery<{ id: number; person_id: number; time: string; text: string; note: string; check_id: number | null }>(
    `SELECT s.id, s.person_id, s.time, s.text, s.note,
       (SELECT c.id FROM step_checks c WHERE c.step_id = s.id AND c.day = ? LIMIT 1) AS check_id
     FROM routine_steps s JOIN routines r ON r.id = s.routine_id WHERE s.text != ''`,
    [today],
  );
  const appointments = useQuery<{ person_id: number; day: string; title: string }>(
    "SELECT person_id, day, title FROM appointments WHERE day >= ? AND day != '' ORDER BY day, time",
    [today],
  );

  const byId = new Map(people?.map((p) => [p.id, p]));
  const items: DayItem[] = [
    ...(medicines ?? []).map((m) => ({
      key: `m${m.id}`,
      kind: 'medicine' as const,
      id: m.id,
      personId: m.person_id,
      time: m.time,
      title: m.name,
      note: m.note,
      doneId: m.dose_id,
    })),
    ...(steps ?? []).map((s) => ({
      key: `s${s.id}`,
      kind: 'step' as const,
      id: s.id,
      personId: s.person_id,
      time: s.time,
      title: s.text,
      note: s.note,
      doneId: s.check_id,
    })),
  ]
    .filter((item) => byId.has(item.personId))
    // In time order, untimed steps last; medicine first when the times match.
    .sort((a, b) => (a.time || '99').localeCompare(b.time || '99') || (a.kind === 'medicine' ? -1 : 1));

  const open = items.filter((item) => item.doneId === null);
  const done = items.filter((item) => item.doneId !== null);
  const next = open.find((item) => item.time) ?? open[0];
  const later = open.filter((item) => item !== next);
  const rest = showAll ? [...later, ...done] : later.slice(0, SHOWN);
  const me = settings.my_name?.trim() ?? '';
  const family = settings.family_name?.trim();
  const now = new Date();

  function toggle(item: DayItem) {
    if (item.doneId === null) return markDone(db, item, me);
    if (item.kind === 'step') return markNotDone(db, item);
    Confirm.alert(`Undo ${item.title}?`, 'This marks it as not given today.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Not given', style: 'destructive', onPress: () => markNotDone(db, item) },
    ]);
  }

  const openPerson = (id: number) => router.push({ pathname: '/person/[id]', params: { id: String(id) } });

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
        <Animated.View entering={FadeIn} style={[styles.lead, styles.thinRule]}>
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
          <Animated.View key={next?.key ?? 'none'} entering={FadeIn.duration(260)} style={[styles.lead, styles.thinRule]}>
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
              <Card>
                <SectionTitle title="The rest of today" right={`${done.length} of ${items.length} done`} />
                <View>
                  {rest.map((item, index) => (
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
                        checked={item.doneId !== null}
                        label={`${item.title}, ${byId.get(item.personId)!.name}${item.time ? `, ${formatTime(item.time)}` : ''}`}
                        onPress={() => toggle(item)}
                      />
                    </Animated.View>
                  ))}
                </View>
                {later.length > SHOWN || done.length > 0 ? (
                  <LinkButton title={showAll ? 'Show less' : 'See the whole day →'} onPress={() => setShowAll(!showAll)} />
                ) : null}
              </Card>
            </Animated.View>
          )}

          <Animated.View layout={LinearTransition.duration(240)}>
            <Card style={{ gap: 2 }}>
              <SectionTitle title="In this handbook" />
              {people.map((person) => {
                const note = aside(person);
                return (
                  <Pressable
                    key={person.id}
                    accessibilityRole="button"
                    accessibilityLabel={[person.name, note.text].filter(Boolean).join(', ')}
                    onPress={() => openPerson(person.id)}
                    style={({ pressed }) => [styles.contentsRow, pressed && styles.pressed]}>
                    <Text serif size={24} numberOfLines={1} style={{ flexShrink: 1 }}>
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
  thinRule: { borderTopWidth: 1, borderTopColor: colors.border },
  headline: { lineHeight: 36 },
  contentsRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, minHeight: 44, paddingVertical: 4 },
  leader: { flex: 1, minWidth: 16 },
  asideText: { maxWidth: 170, flexShrink: 0 },
  pressed: { opacity: 0.6 },
});
