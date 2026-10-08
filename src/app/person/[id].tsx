import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Fragment } from 'react';
import { Alert as Confirm, StyleSheet, View } from 'react-native';

import { RoutineCard } from '@/components/RoutineCard';
import { Card, CheckRow, Hairline, Label, Masthead, PillButton, Screen, SectionTitle, Text, Title } from '@/components/ui';
import {
  type Alert,
  type Appointment,
  deleteRow,
  type Dose,
  insertRow,
  type Medicine,
  type Note,
  type Person,
  type Routine,
  type RoutineStep,
  type StepCheck,
  useFirst,
  useQuery,
  useSettings,
  type Word,
} from '@/lib/db';
import { colors, personColor, radius } from '@/lib/theme';
import { clockTime, dayParts, formatTime, minutesUntil, relativeDay, todayKey } from '@/lib/time';

/** The line under a person's name: "6 years old · 1st grade · 45 lb". */
function describePerson(person: Person) {
  const age = person.age.trim();
  const ageText = age && person.kind === 'child' && /^\d+$/.test(age) ? `${age} years old` : age;
  return [ageText, person.about.trim()].filter(Boolean).join(' · ');
}

/** A person's page in the handbook: warnings first, then today, what's coming, and what to know. */
export default function PersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const personId = Number(id);
  const today = todayKey();

  const person = useFirst<Person>('SELECT * FROM people WHERE id = ?', [personId]);
  const alerts = useQuery<Alert>("SELECT * FROM alerts WHERE person_id = ? AND (title != '' OR details != '') ORDER BY sort, id", [personId]);
  const medicines = useQuery<Medicine>(
    "SELECT * FROM medicines WHERE person_id = ? AND name != '' ORDER BY time = '', time, sort, id",
    [personId],
  );
  const doses = useQuery<Dose>(
    'SELECT d.* FROM doses d JOIN medicines m ON m.id = d.medicine_id WHERE m.person_id = ? AND d.day = ?',
    [personId, today],
  );
  const routines = useQuery<Routine>('SELECT * FROM routines WHERE person_id = ? ORDER BY sort, id', [personId]);
  const steps = useQuery<RoutineStep>(
    "SELECT * FROM routine_steps WHERE person_id = ? AND text != '' ORDER BY time = '', time, sort, id",
    [personId],
  );
  const checks = useQuery<StepCheck>(
    'SELECT c.* FROM step_checks c JOIN routine_steps s ON s.id = c.step_id WHERE s.person_id = ? AND c.day = ?',
    [personId, today],
  );
  const notes = useQuery<Note>("SELECT * FROM notes WHERE person_id = ? AND text != '' ORDER BY sort, id", [personId]);
  const words = useQuery<Word>("SELECT * FROM words WHERE person_id = ? AND word != '' ORDER BY sort, id", [personId]);
  const appointments = useQuery<Appointment>(
    "SELECT * FROM appointments WHERE person_id = ? AND day >= ? AND day != '' ORDER BY day, time",
    [personId, today],
  );

  if (person === undefined) return null;
  if (person === null) {
    // Deleted (e.g. from the edit screen): nothing to show.
    return (
      <Screen>
        <Masthead back label="Family" />
        <Text serif italic size={24} color={colors.muted}>
          This person isn’t in the handbook anymore.
        </Text>
      </Screen>
    );
  }

  const c = personColor(person.color);
  const daily = medicines?.filter((m) => m.time) ?? [];
  const asNeeded = medicines?.filter((m) => !m.time) ?? [];
  const isEmpty =
    !alerts?.length && !medicines?.length && !steps?.length && !notes?.length && !words?.length && !appointments?.length;

  return (
    <Screen>
      <Masthead
        back
        label={person.kind === 'child' ? 'Family · Child' : 'Family · In our care'}
        color={c.strong}
        right={
          <PillButton title="Edit" onPress={() => router.push({ pathname: '/person/edit', params: { id: String(person.id) } })} />
        }
      />
      <View style={{ gap: 10 }}>
        <View style={[styles.swatch, { backgroundColor: c.strong }]} />
        <Title size={64} deck={describePerson(person) || undefined}>
          {person.name}
        </Title>
      </View>

      {alerts && alerts.length > 0 && (
        <View style={{ gap: 10 }}>
          {alerts.map((alert) => (
            <View key={alert.id} style={styles.alert}>
              <Label color={colors.alertText}>Warning</Label>
              {alert.title ? (
                <Text serif size={26} color={colors.alertInk} style={{ lineHeight: 30 }}>
                  {alert.title}
                </Text>
              ) : null}
              {alert.details ? (
                <Text size={15} color={colors.alertInk} style={{ lineHeight: 21 }}>
                  {alert.details}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      )}

      {daily.length > 0 && (
        <Card style={{ gap: 0 }}>
          <SectionTitle
            title="Today’s medicine"
            right={`${daily.filter((m) => doses?.some((d) => d.medicine_id === m.id)).length} of ${daily.length} given`}
          />
          {daily.map((medicine, index) => (
            <Fragment key={medicine.id}>
              {index > 0 && <Hairline />}
              <MedicineRow medicine={medicine} dose={doses?.find((d) => d.medicine_id === medicine.id)} />
            </Fragment>
          ))}
        </Card>
      )}

      {routines?.map((routine) => {
        const theirs = steps?.filter((step) => step.routine_id === routine.id) ?? [];
        if (theirs.length === 0) return null;
        return (
          <RoutineCard
            key={routine.id}
            routine={routine}
            steps={theirs}
            checks={checks?.filter((check) => theirs.some((step) => step.id === check.step_id)) ?? []}
          />
        );
      })}

      {appointments && appointments.length > 0 && (
        <Card style={{ gap: 0 }}>
          <SectionTitle title="Coming up" />
          {appointments.map((appointment, index) => {
            const { weekday, date } = dayParts(appointment.day);
            const detail = [
              relativeDay(appointment.day),
              appointment.time && formatTime(appointment.time),
              appointment.driver && `${appointment.driver} is driving`,
            ]
              .filter(Boolean)
              .join(' · ');
            return (
              <Fragment key={appointment.id}>
                {index > 0 && <Hairline />}
                <View style={styles.visit}>
                  <View style={styles.date}>
                    <Label color={c.strong}>{weekday}</Label>
                    <Text serif size={34} style={{ lineHeight: 38 }}>
                      {date}
                    </Text>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text weight={600} size={16}>
                      {appointment.title || 'Appointment'}
                    </Text>
                    <Text size={14} color={colors.muted}>
                      {detail}
                    </Text>
                  </View>
                </View>
              </Fragment>
            );
          })}
        </Card>
      )}

      {notes?.length || asNeeded.length ? (
        <Card>
          <SectionTitle title="Good to know" />
          <View style={styles.grid}>
            {asNeeded.map((medicine) => (
              <View key={`m${medicine.id}`} style={styles.note}>
                <Label>Medicine as needed</Label>
                <Text size={15} style={styles.noteText}>
                  <Text weight={700} size={15}>
                    {medicine.name}
                  </Text>
                  {medicine.note ? `. ${medicine.note}` : ''}
                </Text>
              </View>
            ))}
            {notes?.map((note) => (
              <View key={note.id} style={styles.note}>
                {note.label ? <Label>{note.label}</Label> : null}
                <Text size={15} style={styles.noteText}>
                  {note.text}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      {words && words.length > 0 && (
        <Card style={{ gap: 0 }}>
          <SectionTitle title={person.kind === 'child' ? 'Words they use' : 'Worth knowing'} />
          {words.map((word, index) => (
            <Fragment key={word.id}>
              {index > 0 && <Hairline />}
              <View style={styles.word}>
                <Text serif italic size={22} style={{ lineHeight: 27 }}>
                  {person.kind === 'child' ? `“${word.word}”` : word.word}
                </Text>
                {word.meaning ? (
                  <Text size={15} color={colors.muted} style={{ lineHeight: 21 }}>
                    {word.meaning}
                  </Text>
                ) : null}
              </View>
            </Fragment>
          ))}
        </Card>
      )}

      {isEmpty && (
        <Card>
          <Text serif italic size={24} style={{ lineHeight: 29 }}>
            Nothing here yet.
          </Text>
          <Text size={15} color={colors.muted} style={{ lineHeight: 21 }}>
            Tap Edit to add allergies, medicine, a routine, and anything else a helper should know about {person.name}.
          </Text>
        </Card>
      )}
    </Screen>
  );
}

function MedicineRow({ medicine, dose }: { medicine: Medicine; dose?: Dose }) {
  const db = useSQLiteContext();
  const settings = useSettings();

  const give = () =>
    insertRow(db, 'doses', {
      medicine_id: medicine.id,
      day: todayKey(),
      given_at: Date.now(),
      given_by: settings.my_name?.trim() ?? '',
    });
  const undo = () =>
    dose &&
    Confirm.alert(`Undo ${medicine.name}?`, 'This marks it as not given today.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Not given', style: 'destructive', onPress: () => deleteRow(db, 'doses', dose.id) },
    ]);

  const minutes = minutesUntil(medicine.time);
  let detail = medicine.note;
  let detailColor = colors.muted;
  if (dose) {
    detail = `Given${dose.given_by ? ` by ${dose.given_by}` : ''} at ${clockTime(dose.given_at)}`;
  } else if (minutes >= 0 && minutes <= 60) {
    detail = [`Due in ${minutes} min`, medicine.note].filter(Boolean).join(' · ');
    detailColor = colors.accentText;
  } else if (minutes < 0) {
    detail = [`Not given yet`, medicine.note].filter(Boolean).join(' · ');
    detailColor = colors.accentText;
  }

  return (
    <CheckRow
      time={medicine.time}
      title={medicine.name}
      detail={detail}
      detailColor={detailColor}
      checked={!!dose}
      boxColor={!dose && minutes <= 60 ? colors.accent : undefined}
      label={`${medicine.name}, ${formatTime(medicine.time)}, ${dose ? 'given' : 'not given'}`}
      onPress={dose ? undo : give}
    />
  );
}

const styles = StyleSheet.create({
  swatch: { width: 28, height: 4, borderRadius: 2 },
  alert: { backgroundColor: colors.alert, borderRadius: radius.small, paddingVertical: 14, paddingHorizontal: 16, gap: 6 },
  visit: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 10 },
  date: { width: 52, alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 14 },
  note: { flexGrow: 1, flexBasis: '42%', gap: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.track },
  noteText: { lineHeight: 21 },
  word: { gap: 2, paddingVertical: 10 },
});
