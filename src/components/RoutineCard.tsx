/** One routine on a person's page: its steps in time order, each checked off as it's done today. */
import { type SQLiteDatabase, useSQLiteContext } from 'expo-sqlite';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Card, SectionTitle, Text } from '@/components/ui';
import { deleteRow, insertRow, type Routine, type RoutineStep, type StepCheck, useSettings } from '@/lib/db';
import { colors } from '@/lib/theme';
import { clockTime, formatTime, todayKey } from '@/lib/time';

/** Records a step as done now, today. */
function checkOff(db: SQLiteDatabase, stepId: number, by: string) {
  return insertRow(db, 'step_checks', { step_id: stepId, day: todayKey(), done_at: Date.now(), done_by: by });
}

export function RoutineCard({
  routine,
  steps,
  checks,
  color,
}: {
  routine: Routine;
  steps: RoutineStep[];
  /** Today's checks for these steps. */
  checks: StepCheck[];
  /** The person's strong color, for the checks. */
  color: string;
}) {
  const db = useSQLiteContext();
  const settings = useSettings();
  const done = steps.filter((step) => checks.some((c) => c.step_id === step.id)).length;
  const allDone = done === steps.length;

  function toggle(step: RoutineStep, check?: StepCheck) {
    if (check) deleteRow(db, 'step_checks', check.id);
    else checkOff(db, step.id, settings.my_name?.trim() ?? '');
  }

  return (
    <Card>
      <SectionTitle
        title={routine.name || 'Routine'}
        right={
          <Text weight={800} size={13} color={allDone ? colors.done : colors.muted}>
            {allDone ? 'All done' : `${done} of ${steps.length} done`}
          </Text>
        }
      />
      <View style={{ gap: 4 }}>
        {steps.map((step) => {
          const check = checks.find((c) => c.step_id === step.id);
          const label = [step.text, step.note].filter(Boolean).join(' · ');
          return (
            <Pressable
              key={step.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: !!check }}
              accessibilityLabel={step.time ? `${formatTime(step.time)}, ${label}` : label}
              onPress={() => toggle(step, check)}
              style={({ pressed }) => [styles.step, pressed && { opacity: 0.6 }]}>
              {check ? (
                <View style={[styles.check, { backgroundColor: colors.done }]}>
                  <Icon name="check" size={14} color="#FFFFFF" strokeWidth={3} />
                </View>
              ) : (
                <View style={[styles.check, { borderWidth: 2, borderColor: color }]} />
              )}
              <Text weight={700} size={13} color={colors.muted} style={styles.time}>
                {step.time ? formatTime(step.time) : ''}
              </Text>
              <View style={{ flex: 1 }}>
                <Text
                  weight={700}
                  size={15}
                  color={check ? colors.muted : colors.ink}
                  style={check && styles.struck}>
                  {step.text}
                  {step.note ? (
                    <Text weight={500} size={15} color={colors.muted}>
                      {` · ${step.note}`}
                    </Text>
                  ) : null}
                </Text>
                {check ? (
                  <Text weight={600} size={12} color={colors.muted}>
                    {`Done at ${clockTime(check.done_at)}${check.done_by ? ` by ${check.done_by}` : ''}`}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44, paddingVertical: 4 },
  check: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  time: { width: 64, fontVariant: ['tabular-nums'] },
  struck: { textDecorationLine: 'line-through' },
});
