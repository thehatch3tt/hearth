/** One routine on a person's page: its steps in time order, each checked off as it's done today. */
import { type SQLiteDatabase, useSQLiteContext } from 'expo-sqlite';
import { Fragment } from 'react';

import { Card, CheckRow, Hairline, SectionTitle, Text } from '@/components/ui';
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
}: {
  routine: Routine;
  steps: RoutineStep[];
  /** Today's checks for these steps. */
  checks: StepCheck[];
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
    <Card style={{ gap: 0 }}>
      <SectionTitle
        title={routine.name || 'Routine'}
        right={
          <Text weight={600} size={12} color={allDone ? colors.done : colors.muted}>
            {allDone ? 'All done' : `${done} of ${steps.length} done`}
          </Text>
        }
      />
      {steps.map((step, index) => {
        const check = checks.find((c) => c.step_id === step.id);
        const label = [step.text, step.note].filter(Boolean).join(', ');
        return (
          <Fragment key={step.id}>
            {index > 0 && <Hairline />}
            <CheckRow
              time={step.time}
              title={step.text}
              note={step.note}
              detail={check ? `Done at ${clockTime(check.done_at)}${check.done_by ? ` by ${check.done_by}` : ''}` : undefined}
              checked={!!check}
              label={step.time ? `${formatTime(step.time)}, ${label}` : label}
              onPress={() => toggle(step, check)}
            />
          </Fragment>
        );
      })}
    </Card>
  );
}
