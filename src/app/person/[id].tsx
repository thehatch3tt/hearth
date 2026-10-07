import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert as Confirm, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { RoutineCard } from '@/components/RoutineCard';
import { Avatar, Card, Label, PageHeader, PillButton, Screen, SectionTitle, Text } from '@/components/ui';
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
import { clockTime, dayParts, formatTime, minutesUntil, todayKey } from '@/lib/time';

/** The line under a person's name: "6 years old · 1st grade · 45 lb". */
function describePerson(person: Person) {
  const age = person.age.trim();
  const ageText = age && person.kind === 'child' && /^\d+$/.test(age) ? `${age} years old` : age;
  return [ageText, person.about.trim()].filter(Boolean).join(' · ');
}

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
      <Screen header={<PageHeader />}>
        <Text color={colors.muted}>This person isn’t in the handbook anymore.</Text>
      </Screen>
    );
  }

  const c = personColor(person.color);
  const daily = medicines?.filter((m) => m.time) ?? [];
  const asNeeded = medicines?.filter((m) => !m.time) ?? [];
  const isEmpty =
    !alerts?.length && !medicines?.length && !steps?.length && !notes?.length && !words?.length && !appointments?.length;

  return (
    <Screen
      header={
        <PageHeader
          background={c.soft}
          right={
            <PillButton
              title="Edit"
              onPress={() => router.push({ pathname: '/person/edit', params: { id: String(person.id) } })}
            />
          }>
          <View style={styles.row}>
            <Avatar name={person.name} color={person.color} size={64} solid />
            <View style={{ flex: 1, gap: 2 }}>
              <Text weight={800} size={28} style={{ letterSpacing: -0.5 }}>
                {person.name}
              </Text>
              {describePerson(person) ? (
                <Text weight={600} size={14} color={c.ink}>
                  {describePerson(person)}
                </Text>
              ) : null}
            </View>
          </View>
        </PageHeader>
      }>
      {alerts?.map((alert) => (
        <View key={alert.id} style={styles.alert}>
          <View style={{ marginTop: 2 }}>
            <Icon name="alert" size={22} color={colors.alertText} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text weight={800} size={15} color={colors.alertInk}>
              {alert.title}
            </Text>
            {alert.details ? (
              <Text size={13} color="#6B2416" style={{ lineHeight: 19 }}>
                {alert.details}
              </Text>
            ) : null}
          </View>
        </View>
      ))}

      {daily.length > 0 && (
        <Card>
          <SectionTitle
            title="Today's medicine"
            right={
              <Text weight={700} size={13} color={colors.muted}>
                {`${daily.filter((m) => doses?.some((d) => d.medicine_id === m.id)).length} of ${daily.length} given`}
              </Text>
            }
          />
          {daily.map((medicine) => (
            <MedicineRow
              key={medicine.id}
              medicine={medicine}
              dose={doses?.find((d) => d.medicine_id === medicine.id)}
              color={c.strong}
            />
          ))}
        </Card>
      )}

      {appointments?.map((appointment) => {
        const { weekday, date } = dayParts(appointment.day);
        const detail = [appointment.time && formatTime(appointment.time), appointment.driver && `${appointment.driver} is driving`]
          .filter(Boolean)
          .join(' · ');
        return (
          <Card key={appointment.id} style={[styles.row, { gap: 14 }]}>
            <View style={[styles.dateBlock, { backgroundColor: c.tint }]}>
              <Text weight={800} size={11} color={c.strong} style={{ letterSpacing: 0.9 }}>
                {weekday.toUpperCase()}
              </Text>
              <Text weight={800} size={20}>
                {date}
              </Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text weight={700} size={15}>
                {appointment.title || 'Appointment'}
              </Text>
              {detail ? (
                <Text size={13} color={colors.muted}>
                  {detail}
                </Text>
              ) : null}
            </View>
          </Card>
        );
      })}

      {routines?.map((routine) => {
        const theirs = steps?.filter((step) => step.routine_id === routine.id) ?? [];
        if (theirs.length === 0) return null;
        return (
          <RoutineCard
            key={routine.id}
            routine={routine}
            steps={theirs}
            checks={checks?.filter((check) => theirs.some((step) => step.id === check.step_id)) ?? []}
            color={c.strong}
          />
        );
      })}

      {(notes?.length || asNeeded.length) ? (
        <View style={styles.grid}>
          {asNeeded.map((medicine) => (
            <Card key={`m${medicine.id}`} style={styles.gridCard}>
              <Label>As needed</Label>
              <Text weight={600} size={14} style={{ lineHeight: 20 }}>
                {[medicine.name, medicine.note].filter(Boolean).join('. ')}
              </Text>
            </Card>
          ))}
          {notes?.map((note) => (
            <Card key={note.id} style={styles.gridCard}>
              {note.label ? <Label>{note.label}</Label> : null}
              <Text weight={600} size={14} style={{ lineHeight: 20 }}>
                {note.text}
              </Text>
            </Card>
          ))}
        </View>
      ) : null}

      {words && words.length > 0 && (
        <Card>
          <SectionTitle title={person.kind === 'child' ? 'Words they use' : 'Good to know'} />
          <View style={styles.wrap}>
            {words.map((word) => (
              <View key={word.id} style={styles.word}>
                <Text size={13}>
                  <Text weight={700} size={13}>{`"${word.word}"`}</Text>
                  {word.meaning ? ` = ${word.meaning}` : ''}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {isEmpty && (
        <Card>
          <Text size={14} color={colors.muted} style={{ lineHeight: 20 }}>
            Nothing here yet. Tap Edit to add allergies, medicines, a routine, and anything else a helper
            should know about {person.name}.
          </Text>
        </Card>
      )}
    </Screen>
  );
}

function MedicineRow({ medicine, dose, color }: { medicine: Medicine; dose?: Dose; color: string }) {
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
  let status = [formatTime(medicine.time), medicine.note].filter(Boolean).join(' · ');
  let statusColor = colors.muted;
  if (dose) {
    status = `${formatTime(medicine.time)} · given${dose.given_by ? ` by ${dose.given_by}` : ''} at ${clockTime(dose.given_at)}`;
  } else if (minutes >= 0 && minutes <= 60) {
    status = `${formatTime(medicine.time)} · due in ${minutes} min`;
    statusColor = color;
  } else if (minutes < 0) {
    status = `${formatTime(medicine.time)} · not given yet`;
    statusColor = color;
  }
  const highlight = !dose && minutes <= 60;

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: !!dose }}
        accessibilityLabel={`${medicine.name} given`}
        onPress={dose ? undo : give}
        hitSlop={9}>
        {dose ? (
          <View style={[styles.check, { backgroundColor: colors.done }]}>
            <Icon name="check" size={14} color="#FFFFFF" strokeWidth={3} />
          </View>
        ) : (
          <View style={[styles.check, { borderWidth: 2, borderColor: highlight ? color : '#C9CCD4' }]} />
        )}
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text weight={700} size={14}>
          {medicine.name}
        </Text>
        <Text weight={highlight ? 700 : 500} size={12} color={statusColor}>
          {status}
        </Text>
      </View>
      {highlight && (
        <Pressable
          accessibilityRole="button"
          onPress={give}
          style={({ pressed }) => [styles.markGiven, { backgroundColor: color }, pressed && { opacity: 0.7 }]}>
          <Text weight={700} size={13} color="#FFFFFF">
            Mark given
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  alert: {
    backgroundColor: colors.alert,
    borderRadius: radius.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  check: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  markGiven: { height: 36, paddingHorizontal: 14, borderRadius: 12, justifyContent: 'center' },
  dateBlock: { width: 52, borderRadius: 12, paddingVertical: 6, alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridCard: { flexGrow: 1, flexBasis: '45%', padding: 14, gap: 6 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  word: { backgroundColor: colors.chip, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
});
