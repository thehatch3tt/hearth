import { useSQLiteContext } from 'expo-sqlite';
import { type TextInputProps } from 'react-native';

import { Field, SavedInput } from '@/components/ui';
import { saveSetting, type Settings } from '@/lib/db';

/** A labeled text box for one setting, saved as you leave it. */
export function SettingInput({
  settings,
  name,
  label,
  hint,
  ...props
}: Omit<TextInputProps, 'value'> & { settings: Settings; name: keyof Settings; label: string; hint?: string }) {
  const db = useSQLiteContext();
  const value = settings[name] ?? '';
  return (
    <Field label={label} hint={hint}>
      <SavedInput key={`${name}:${value}`} value={value} onSave={(text) => saveSetting(db, name, text.trim())} {...props} />
    </Field>
  );
}
