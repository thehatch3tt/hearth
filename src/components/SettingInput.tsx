import { useSQLiteContext } from 'expo-sqlite';
import { StyleSheet, type TextInputProps, View } from 'react-native';

import { Field, SavedInput, Text } from '@/components/ui';
import { saveSetting, type Settings } from '@/lib/db';
import { serif } from '@/lib/theme';

type Props = Omit<TextInputProps, 'value'> & { settings: Settings; name: keyof Settings; label: string };

/** A labeled text box for one setting, saved as you leave it. */
export function SettingInput({ settings, name, label, hint, ...props }: Props & { hint?: string }) {
  const db = useSQLiteContext();
  const value = settings[name] ?? '';
  return (
    <Field label={label} hint={hint}>
      <SavedInput key={`${name}:${value}`} value={value} onSave={(text) => saveSetting(db, name, text.trim())} {...props} />
    </Field>
  );
}

/** One line of a settings list: the label on the left, the value typed in place on the right. */
export function SettingRow({ settings, name, label, ...props }: Props) {
  const db = useSQLiteContext();
  const value = settings[name] ?? '';
  return (
    <View style={styles.row}>
      <Text weight={500} size={16}>
        {label}
      </Text>
      <SavedInput
        key={`${name}:${value}`}
        value={value}
        onSave={(text) => saveSetting(db, name, text.trim())}
        accessibilityLabel={label}
        returnKeyType="done"
        {...props}
        style={styles.value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 },
  value: {
    flex: 1,
    minHeight: 52,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    textAlign: 'right',
    fontFamily: serif.italic,
    fontSize: 22,
  },
});
