import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { BottomSheet, Chip } from '@/components/Select';
import { Button, Card, Field, PageHeader, PillButton, Screen, Text, styles as ui } from '@/components/ui';
import { houseLabels } from '@/lib/choices';
import { deleteRow, type HouseItem, insertRow, updateRow, useQuery } from '@/lib/db';
import { colors, radius } from '@/lib/theme';

/** A small picture for a house item, from words in its label. */
function iconFor(label: string): IconName {
  const text = label.toLowerCase();
  if (/wi-?fi|internet|network/.test(text)) return 'wifi';
  if (/alarm/.test(text)) return 'bell';
  if (/door|gate|garage|code|lock|pin/.test(text)) return 'lock';
  if (/key/.test(text)) return 'key';
  if (/first aid|medicine|bandage/.test(text)) return 'aid';
  if (/fuse|breaker|power|electric/.test(text)) return 'bolt';
  if (/water/.test(text)) return 'drop';
  if (/tv|remote/.test(text)) return 'tv';
  if (/thermostat|heat|air/.test(text)) return 'thermometer';
  if (/pet|dog|cat|fish/.test(text)) return 'paw';
  if (/trash|garbage|recycl/.test(text)) return 'trash';
  return 'home';
}

/** "Password" for Wi-Fi, "Code" for everything else. */
const secretName = (label: string) => (/wi-?fi|password/i.test(label) ? 'Password' : 'Code');

type Editing = { item?: HouseItem; label?: string };

/** Wi-Fi, the alarm, where things are: one short list. Tap a row to change it. */
export default function HouseScreen() {
  const items = useQuery<HouseItem>('SELECT * FROM house_items ORDER BY sort, id');
  const [editing, setEditing] = useState<Editing | null>(null);
  const filled = items?.filter((item) => item.label || item.value || item.secret) ?? [];
  // Quick ways to add the usual things that aren't in the list yet.
  const missing = houseLabels.filter((label) => !filled.some((item) => item.label === label)).slice(0, 6);

  return (
    <Screen
      header={
        <PageHeader right={<PillButton title="Add" onPress={() => setEditing({})} />}>
          <Text weight={900} size={28} style={{ letterSpacing: -0.3 }}>
            Our home
          </Text>
        </PageHeader>
      }>
      {items && filled.length === 0 && (
        <Text weight={600} size={15} color={colors.muted} style={styles.intro}>
          The things a helper asks about. Passwords and codes stay hidden until someone taps them.
        </Text>
      )}

      {filled.length > 0 && (
        <Card style={styles.list}>
          {filled.map((item, i) => (
            <HouseRow key={item.id} item={item} first={i === 0} onEdit={() => setEditing({ item })} />
          ))}
        </Card>
      )}

      {missing.length > 0 && (
        <View style={styles.quick}>
          {missing.map((label) => (
            <Chip key={label} label={`+ ${label}`} onPress={() => setEditing({ label })} style={styles.quickChip} />
          ))}
        </View>
      )}

      {editing && <HouseSheet {...editing} sort={items?.length ?? 0} onClose={() => setEditing(null)} />}
    </Screen>
  );
}

function HouseRow({ item, first, onEdit }: { item: HouseItem; first: boolean; onEdit: () => void }) {
  // A password goes back to dots whenever this page opens again.
  const [shown, setShown] = useState(false);
  return (
    <View style={[styles.row, !first && styles.divider]}>
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Opens it to change"
        onPress={onEdit}
        style={({ pressed }) => [styles.rowMain, pressed && { opacity: 0.6 }]}>
        <View style={styles.icon}>
          <Icon name={iconFor(item.label)} size={18} color={colors.accent} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text weight={800} size={15}>
            {item.label || 'Untitled'}
          </Text>
          {item.value ? (
            <Text weight={600} size={14} color={colors.muted} style={{ lineHeight: 19 }}>
              {item.value}
            </Text>
          ) : null}
          {item.secret ? (
            <Text
              weight={800}
              size={shown ? 15 : 16}
              color={shown ? colors.ink : colors.muted}
              style={{ letterSpacing: shown ? 0.3 : 2 }}
              selectable={shown}>
              {shown ? item.secret : '••••••••'}
            </Text>
          ) : null}
        </View>
      </Pressable>
      {item.secret ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={shown ? `Hide ${secretName(item.label).toLowerCase()}` : `Show ${secretName(item.label).toLowerCase()}`}
          onPress={() => setShown(!shown)}
          hitSlop={6}
          style={({ pressed }) => [styles.eye, pressed && { opacity: 0.6 }]}>
          <Icon name={shown ? 'eyeOff' : 'eye'} size={20} color={colors.accentText} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Adds or changes one house item. */
function HouseSheet({ item, label: preset, sort, onClose }: Editing & { sort: number; onClose: () => void }) {
  const db = useSQLiteContext();
  const [label, setLabel] = useState(item?.label ?? preset ?? '');
  const [value, setValue] = useState(item?.value ?? '');
  const [secret, setSecret] = useState(item?.secret ?? '');
  const [shown, setShown] = useState(false);
  const wifi = /wi-?fi/i.test(label);
  const empty = !label.trim() && !value.trim() && !secret.trim();

  async function save() {
    const values = { label: label.trim(), value: value.trim(), secret: secret.trim() };
    if (item) await updateRow(db, 'house_items', item.id, values);
    else await insertRow(db, 'house_items', { ...values, sort });
    onClose();
  }

  function remove() {
    if (!item) return;
    Alert.alert(`Delete ${item.label || 'this'}?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteRow(db, 'house_items', item.id);
          onClose();
        },
      },
    ]);
  }

  return (
    <BottomSheet title={item ? item.label || 'Change' : preset ? `Add ${preset}` : 'Add something'} onClose={onClose}>
      <View style={{ gap: 14 }}>
        {!item && !preset && (
          <View style={styles.quick}>
            {houseLabels.map((name) => (
              <Chip key={name} label={name} selected={name === label} onPress={() => setLabel(name)} style={{ minHeight: 38 }} />
            ))}
          </View>
        )}
        {(item || !preset) && (
          <Field label="What is it">
            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder="Wi-Fi, spare key..."
              placeholderTextColor={colors.faint}
              style={ui.input}
            />
          </Field>
        )}
        <Field label={wifi ? 'Network name' : 'Details'}>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder={wifi ? 'CarterHome' : 'Where it is, how it works'}
            placeholderTextColor={colors.faint}
            multiline={!wifi}
            style={[ui.input, !wifi && ui.multiline]}
          />
        </Field>
        <Field label={`${secretName(label)} (kept hidden)`}>
          <View style={styles.secretField}>
            <TextInput
              value={secret}
              onChangeText={setSecret}
              placeholder="Optional"
              placeholderTextColor={colors.faint}
              secureTextEntry={!shown}
              autoCapitalize="none"
              autoCorrect={false}
              style={[ui.input, { flex: 1 }]}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={shown ? 'Hide' : 'Show'}
              onPress={() => setShown(!shown)}
              hitSlop={6}
              style={styles.eye}>
              <Icon name={shown ? 'eyeOff' : 'eye'} size={20} color={colors.muted} />
            </Pressable>
          </View>
        </Field>
        <View style={styles.buttons}>
          {item && <Button quiet title="Delete" color={colors.danger} onPress={remove} style={{ flex: 1 }} />}
          <Button title="Save" disabled={empty} onPress={save} style={{ flex: 2 }} />
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  intro: { lineHeight: 21, paddingHorizontal: 4 },
  list: { paddingVertical: 4, paddingHorizontal: 0, gap: 0 },
  row: { flexDirection: 'row', alignItems: 'center', paddingRight: 8 },
  divider: { borderTopWidth: 1, borderTopColor: colors.chip },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, paddingLeft: 16 },
  icon: {
    width: 34,
    height: 34,
    borderRadius: radius.small - 4,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eye: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickChip: { minHeight: 38, backgroundColor: colors.card },
  secretField: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
