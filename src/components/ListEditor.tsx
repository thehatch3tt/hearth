/**
 * Edits a list of rows in one table (allergies, medicines, routine steps, phone numbers...): each row
 * is a few boxes that save as you go, with a trash button, and "+ Add" underneath. Times, dates and
 * set choices are pick lists; the rest are text boxes that save when you leave them.
 */
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Pressable, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Icon } from '@/components/Icon';
import { DaySelect, Select, TimeSelect } from '@/components/Select';
import { LinkButton, SavedInput, Text } from '@/components/ui';
import { toOptions } from '@/lib/choices';
import { deleteBlankRows, deleteRow, insertRow, type Table, updateRow } from '@/lib/db';
import { colors } from '@/lib/theme';

export type Column = {
  key: string;
  placeholder: string;
  /**
   * `time`: hour, minutes, am/pm. `day`: a calendar. `choice`: from `options`, or type your own.
   * `text` (the default) and `phone` are typed. `secret` is typed as dots, with an eye to check it.
   */
  kind?: 'text' | 'phone' | 'time' | 'day' | 'choice' | 'secret';
  options?: string[];
  /** For `time`: a first choice meaning "no time" (e.g. medicine given as needed). */
  clearLabel?: string;
  /** For `time`: the time the picker starts at when nothing is chosen yet. */
  suggest?: string;
  /** A fixed width; otherwise the box shares the line. */
  width?: number;
  multiline?: boolean;
};

type Row = { id: number } & Record<string, unknown>;

export function ListEditor({
  table,
  rows,
  lines,
  parent = {},
  addLabel,
}: {
  table: Table;
  rows: Row[] | undefined;
  /** The boxes for one row, line by line. */
  lines: Column[][];
  /** Saved on new rows and used to find this list's rows, e.g. `{ person_id: 3 }`. */
  parent?: Record<string, number>;
  addLabel: string;
}) {
  const db = useSQLiteContext();
  const [added, setAdded] = useState<number>();
  const columns = lines.flat();
  const columnKeys = columns.map((c) => c.key).join(',');
  const parentKey = JSON.stringify(parent);

  // Tidies away rows that were added last time but never filled in. (Done on opening rather than
  // leaving, so it can't race the last box saving as the screen closes.)
  useEffect(() => {
    deleteBlankRows(db, table, columnKeys.split(','), JSON.parse(parentKey));
  }, [db, table, columnKeys, parentKey]);

  async function add() {
    const blank = Object.fromEntries(columns.map((c) => [c.key, '']));
    setAdded(await insertRow(db, table, { ...blank, ...parent }));
  }

  const save = (row: Row, column: Column, value: string) =>
    updateRow(db, table, row.id, { [column.key]: value.trim() });

  function remove(row: Row) {
    const filled = columns.some((c) => row[c.key]);
    if (!filled) return deleteRow(db, table, row.id);
    Alert.alert('Delete this?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteRow(db, table, row.id) },
    ]);
  }

  function box(row: Row, column: Column, first: boolean) {
    const saved = String(row[column.key] ?? '');
    const size = column.width ? { width: column.width } : { flex: 1 };
    const onChange = (value: string) => save(row, column, value);

    if (column.kind === 'secret') {
      return (
        <SecretInput
          key={`${column.key}:${saved}`}
          value={saved}
          onSave={onChange}
          placeholder={column.placeholder}
          style={size}
        />
      );
    }
    if (column.kind === 'time') {
      return (
        <TimeSelect
          key={column.key}
          title={column.placeholder}
          placeholder={column.placeholder}
          value={saved}
          clearLabel={column.clearLabel}
          suggest={column.suggest}
          onChange={onChange}
          style={size}
        />
      );
    }
    if (column.kind === 'day') {
      return (
        <DaySelect
          key={column.key}
          title={column.placeholder}
          placeholder={column.placeholder}
          value={saved}
          onChange={onChange}
          style={size}
        />
      );
    }
    if (column.kind === 'choice') {
      return (
        <Select
          key={column.key}
          title={column.placeholder}
          placeholder={column.placeholder}
          value={saved}
          options={toOptions(column.options ?? [])}
          custom="Or type your own"
          onChange={onChange}
          style={size}
        />
      );
    }
    return (
      <SavedInput
        // A new key after each save, so a change from elsewhere shows.
        key={`${column.key}:${saved}`}
        value={saved}
        onSave={onChange}
        placeholder={column.placeholder}
        autoFocus={row.id === added && first}
        // Only once: the box is redrawn after it saves, and shouldn't grab focus again.
        onFocus={() => setAdded(undefined)}
        multiline={column.multiline}
        keyboardType={column.kind === 'phone' ? 'phone-pad' : 'default'}
        style={size}
      />
    );
  }

  return (
    <View style={{ gap: 14 }}>
      {rows?.map((row) => (
        <View key={row.id} style={styles.item}>
          <View style={{ flex: 1, gap: 8 }}>
            {lines.map((line, i) => (
              <View key={i} style={styles.line}>
                {line.map((column, j) => box(row, column, i === 0 && j === 0))}
              </View>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete"
            onPress={() => remove(row)}
            hitSlop={8}
            style={({ pressed }) => [styles.trash, pressed && { opacity: 0.5 }]}>
            <Icon name="trash" size={18} color={colors.faint} />
          </Pressable>
        </View>
      ))}
      <LinkButton title={`+ ${addLabel}`} onPress={add} />
    </View>
  );
}

/** A password box: dots while typing, with an eye button to check what was typed. */
function SecretInput({
  value,
  onSave,
  placeholder,
  style,
}: {
  value: string;
  onSave: (text: string) => void;
  placeholder: string;
  style: StyleProp<ViewStyle>;
}) {
  const [shown, setShown] = useState(false);
  return (
    <View style={[styles.secret, style]}>
      <SavedInput
        value={value}
        onSave={onSave}
        placeholder={placeholder}
        secureTextEntry={!shown}
        autoCapitalize="none"
        autoCorrect={false}
        style={{ flex: 1 }}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={shown ? 'Hide password' : 'Show password'}
        onPress={() => setShown(!shown)}
        hitSlop={6}
        style={styles.eye}>
        <Icon name={shown ? 'eyeOff' : 'eye'} size={20} color={colors.muted} />
      </Pressable>
    </View>
  );
}

/** A short hint under a section's heading. */
export function Hint({ children }: { children: string }) {
  return (
    <Text size={13} color={colors.muted} style={{ lineHeight: 18 }}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  line: { flexDirection: 'row', gap: 8 },
  secret: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eye: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  trash: { width: 32, height: 44, alignItems: 'center', justifyContent: 'center' },
});
