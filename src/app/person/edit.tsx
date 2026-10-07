import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Hint, ListEditor } from '@/components/ListEditor';
import { Icon } from '@/components/Icon';
import { Button, Card, Field, PageHeader, PillButton, SavedInput, Screen, SectionTitle, Text, styles as ui } from '@/components/ui';
import {
  type Alert as AlertRow,
  type Appointment,
  deleteRow,
  insertRow,
  type Medicine,
  type Note,
  type Person,
  type PersonKind,
  type Routine,
  type RoutineStep,
  updateRow,
  useFirst,
  useQuery,
  type Word,
} from '@/lib/db';
import { Select } from '@/components/Select';
import { activities, noteLabels, routineNames, toOptions } from '@/lib/choices';
import { colors, PERSON_COLORS, personColor, type PersonColor } from '@/lib/theme';

/** Where the time list opens for a routine, so a bedtime routine doesn't start at midnight. */
function routineStart(name: string) {
  const text = name.toLowerCase();
  if (text.includes('morning')) return '06:30';
  if (text.includes('nap')) return '12:00';
  if (text.includes('school')) return '15:00';
  if (text.includes('bed') || text.includes('evening')) return '18:00';
  return '07:00';
}

/** Adds a person (no `id`), or edits everything on a person's page. */
export default function EditPersonScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return id ? <EditPerson personId={Number(id)} /> : <AddPerson />;
}

function AddPerson() {
  const db = useSQLiteContext();
  const used = useQuery<{ color: string }>('SELECT color FROM people');
  const [name, setName] = useState('');
  const [kind, setKind] = useState<PersonKind>('child');
  const [color, setColor] = useState<PersonColor>();
  // The first color nobody has yet, until one is picked.
  const shown = color ?? PERSON_COLORS.find((c) => !used?.some((u) => u.color === c)) ?? 'blue';

  async function add() {
    const personId = await insertRow(db, 'people', { name: name.trim(), kind, color: shown });
    // A first routine, ready for its steps.
    await insertRow(db, 'routines', { person_id: personId, name: routineNames[kind][0] });
    // Straight on to filling in their page.
    router.replace({ pathname: '/person/edit', params: { id: String(personId) } });
  }

  return (
    <Screen header={<PageHeader />}>
      <Text weight={800} size={28} style={{ letterSpacing: -0.5 }}>
        Add a person
      </Text>
      <Card style={{ gap: 16 }}>
        <Field label="Name">
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ellie, Grandma Ruth..."
            placeholderTextColor={colors.faint}
            autoFocus
            autoCapitalize="words"
            returnKeyType="done"
            style={ui.input}
          />
        </Field>
        <KindPicker value={kind} onChange={setKind} />
        <ColorPicker value={shown} onChange={setColor} />
      </Card>
      <Button title="Add" disabled={!name.trim()} onPress={add} />
    </Screen>
  );
}

function EditPerson({ personId }: { personId: number }) {
  const db = useSQLiteContext();
  const person = useFirst<Person>('SELECT * FROM people WHERE id = ?', [personId]);
  const parent = { person_id: personId };
  const alerts = useQuery<AlertRow>('SELECT * FROM alerts WHERE person_id = ? ORDER BY sort, id', [personId]);
  const medicines = useQuery<Medicine>('SELECT * FROM medicines WHERE person_id = ? ORDER BY sort, id', [personId]);
  const routines = useQuery<Routine>('SELECT * FROM routines WHERE person_id = ? ORDER BY sort, id', [personId]);
  const steps = useQuery<RoutineStep>('SELECT * FROM routine_steps WHERE person_id = ? ORDER BY sort, id', [personId]);
  const appointments = useQuery<Appointment>(
    'SELECT * FROM appointments WHERE person_id = ? ORDER BY sort, id',
    [personId],
  );
  const notes = useQuery<Note>('SELECT * FROM notes WHERE person_id = ? ORDER BY sort, id', [personId]);
  const words = useQuery<Word>('SELECT * FROM words WHERE person_id = ? ORDER BY sort, id', [personId]);

  if (!person) return null;
  const save = (values: Partial<Person>) => updateRow(db, 'people', personId, values);
  const child = person.kind === 'child';

  /** Adds a routine named after the first suggestion this person doesn't have yet. */
  function addRoutine() {
    const name = routineNames[person!.kind].find((n) => !routines?.some((r) => r.name === n)) ?? '';
    insertRow(db, 'routines', { person_id: personId, name, sort: routines?.length ?? 0 });
  }

  function confirmDeleteRoutine(routine: Routine) {
    const hasSteps = steps?.some((step) => step.routine_id === routine.id && step.text);
    if (!hasSteps) return deleteRow(db, 'routines', routine.id);
    Alert.alert(`Delete ${routine.name || 'this routine'}?`, 'Its steps are deleted too.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteRow(db, 'routines', routine.id) },
    ]);
  }

  function confirmDelete() {
    Alert.alert(`Delete ${person!.name}?`, 'Their whole page is removed from this phone. This can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteRow(db, 'people', personId);
          router.dismissTo('/');
        },
      },
    ]);
  }

  return (
    <Screen
      header={
        <PageHeader background={personColor(person.color).soft} right={<PillButton title="Done" onPress={() => router.back()} />}>
          <Text weight={800} size={28} style={{ letterSpacing: -0.5 }}>
            {person.name || 'Edit'}
          </Text>
        </PageHeader>
      }>
      <Card style={{ gap: 16 }}>
        <Field label="Name">
          <SavedInput key={`name:${person.name}`} value={person.name} onSave={(name) => name.trim() && save({ name: name.trim() })} autoCapitalize="words" />
        </Field>
        <View style={ui.row}>
          <View style={{ width: 90 }}>
            <Field label="Age">
              <SavedInput key={`age:${person.age}`} value={person.age} onSave={(age) => save({ age: age.trim() })} placeholder={child ? '6' : '81'} keyboardType="numbers-and-punctuation" />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="About">
              <SavedInput
                key={`about:${person.about}`}
                value={person.about}
                onSave={(about) => save({ about: about.trim() })}
                placeholder={child ? '1st grade · 45 lb' : 'Lives at home · Uses a walker'}
              />
            </Field>
          </View>
        </View>
        <KindPicker value={person.kind} onChange={(kind) => save({ kind })} />
        <ColorPicker value={person.color} onChange={(color) => save({ color })} />
      </Card>

      <Card>
        <SectionTitle title="Allergies and warnings" />
        <Hint>Shown in red at the top of the page, and on the emergency card.</Hint>
        <ListEditor
          table="alerts"
          rows={alerts}
          parent={parent}
          lines={[[{ key: 'title', placeholder: 'Severe peanut allergy' }], [{ key: 'details', placeholder: 'What to do: EpiPen in the kitchen drawer...', multiline: true }]]}
          addLabel="Add a warning"
        />
      </Card>

      <Card>
        <SectionTitle title="Medicine" />
        <Hint>Choose a time for daily medicine, so it can be checked off each day. Choose “No set time” for medicine given only when needed.</Hint>
        <ListEditor
          table="medicines"
          rows={medicines}
          parent={parent}
          lines={[
            [
              { key: 'name', placeholder: 'Name and dose' },
              { key: 'time', placeholder: 'Time', kind: 'time', width: 124, clearLabel: 'No set time (as needed)', scrollTo: '08:00' },
            ],
            [{ key: 'note', placeholder: child ? 'If fever over 101°' : 'With dinner' }],
          ]}
          addLabel="Add medicine"
        />
      </Card>

      <View style={{ gap: 12 }}>
        <View style={{ paddingHorizontal: 4, paddingTop: 6, gap: 2 }}>
          <Text weight={900} size={20}>
            Routines
          </Text>
          <Hint>Each step can be checked off on their page as it’s done. Checks start fresh every day.</Hint>
        </View>
        {routines?.map((routine) => (
          <Card key={routine.id}>
            <View style={ui.row}>
              <Select
                title="Which routine"
                placeholder="Choose one"
                value={routine.name}
                options={toOptions(routineNames[person.kind])}
                custom="Or type your own"
                onChange={(name) => updateRow(db, 'routines', routine.id, { name })}
                style={{ flex: 1 }}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete ${routine.name || 'this routine'}`}
                onPress={() => confirmDeleteRoutine(routine)}
                hitSlop={8}
                style={({ pressed }) => [styles.routineTrash, pressed && { opacity: 0.5 }]}>
                <Icon name="trash" size={18} color={colors.faint} />
              </Pressable>
            </View>
            <ListEditor
              table="routine_steps"
              rows={steps?.filter((step) => step.routine_id === routine.id)}
              parent={{ person_id: personId, routine_id: routine.id }}
              lines={[
                [
                  { key: 'time', placeholder: 'Time', kind: 'time', width: 124, scrollTo: routineStart(routine.name) },
                  { key: 'text', placeholder: 'Activity', kind: 'choice', options: activities[person.kind] },
                ],
                [{ key: 'note', placeholder: child ? 'Details (optional): she likes bubbles' : 'Details (optional)' }],
              ]}
              addLabel="Add a step"
            />
          </Card>
        ))}
        <Button quiet title="Add a routine" icon="plus" color={colors.accentText} onPress={addRoutine} />
      </View>

      <Card>
        <SectionTitle title="Appointments" />
        <ListEditor
          table="appointments"
          rows={appointments}
          parent={parent}
          lines={[
            [
              { key: 'day', placeholder: 'Date', kind: 'day' },
              { key: 'time', placeholder: 'Time', kind: 'time', width: 124, scrollTo: '09:00' },
            ],
            [{ key: 'title', placeholder: child ? 'Dentist, Dr. Lee' : 'Cardiology, Dr. Patel' }],
            [{ key: 'driver', placeholder: 'Who’s driving (optional)' }],
          ]}
          addLabel="Add an appointment"
        />
      </Card>

      <Card>
        <SectionTitle title="Notes" />
        <Hint>Short things a helper should know, like a comfort item, food, or screen time.</Hint>
        <ListEditor
          table="notes"
          rows={notes}
          parent={parent}
          lines={[
            [{ key: 'label', placeholder: 'What about', kind: 'choice', options: noteLabels[person.kind] }],
            [{ key: 'text', placeholder: child ? '"Pinky" the pink elephant' : 'Soft foods, no grapefruit', multiline: true }],
          ]}
          addLabel="Add a note"
        />
      </Card>

      <Card>
        <SectionTitle title={child ? 'Words they use' : 'Good to know'} />
        <ListEditor
          table="words"
          rows={words}
          parent={parent}
          lines={[
            [
              { key: 'word', placeholder: child ? 'Bumblebee' : 'Hearing aid' },
              { key: 'meaning', placeholder: child ? 'I’m scared' : 'Left ear, spare batteries in the drawer' },
            ],
          ]}
          addLabel={child ? 'Add a word' : 'Add one'}
        />
      </Card>

      <Pressable accessibilityRole="button" onPress={confirmDelete} style={({ pressed }) => [styles.delete, pressed && { opacity: 0.6 }]}>
        <Icon name="trash" size={18} color={colors.danger} />
        <Text weight={700} size={15} color={colors.danger}>
          Delete {person.name}
        </Text>
      </Pressable>
    </Screen>
  );
}

function KindPicker({ value, onChange }: { value: PersonKind; onChange: (kind: PersonKind) => void }) {
  const options: { kind: PersonKind; title: string }[] = [
    { kind: 'child', title: 'A child' },
    { kind: 'adult', title: 'An adult I care for' },
  ];
  return (
    <Field label="Who is this?">
      <View style={styles.segments}>
        {options.map((option) => {
          const selected = option.kind === value;
          return (
            <Pressable
              key={option.kind}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.kind)}
              style={[styles.segment, selected && styles.segmentSelected]}>
              <Text weight={selected ? 700 : 600} size={14} color={selected ? colors.ink : colors.muted}>
                {option.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Field>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (color: PersonColor) => void }) {
  return (
    <Field label="Their color">
      <View style={[ui.row, { gap: 10 }]}>
        {PERSON_COLORS.map((name) => {
          const selected = name === value;
          return (
            <Pressable
              key={name}
              accessibilityRole="radio"
              accessibilityLabel={name}
              accessibilityState={{ selected }}
              onPress={() => onChange(name)}
              hitSlop={4}
              style={[styles.swatch, { backgroundColor: personColor(name).strong }, selected && styles.swatchSelected]}>
              {selected && <Icon name="check" size={16} color="#FFFFFF" strokeWidth={3} />}
            </Pressable>
          );
        })}
      </View>
    </Field>
  );
}

const styles = StyleSheet.create({
  segments: { flexDirection: 'row', backgroundColor: colors.background, borderRadius: 12, padding: 3 },
  segment: { flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentSelected: { backgroundColor: colors.card, boxShadow: '0 1px 3px rgba(0,0,0,0.12)' },
  swatch: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  swatchSelected: { borderWidth: 3, borderColor: colors.card, outlineWidth: 2, outlineColor: colors.ink },
  routineTrash: { width: 32, height: 44, alignItems: 'center', justifyContent: 'center' },
  delete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, marginTop: 8 },
});
