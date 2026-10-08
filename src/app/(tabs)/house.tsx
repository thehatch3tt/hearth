import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { Icon, type IconName } from '@/components/Icon';
import { BottomSheet, Chip } from '@/components/Select';
import { Button, Card, Field, Hairline, Masthead, PillButton, Screen, Text, Title, styles as ui } from '@/components/ui';
import { houseLabels } from '@/lib/choices';
import { deleteRow, type HouseItem, insertRow, updateRow, useQuery } from '@/lib/db';
import { colors } from '@/lib/theme';

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
    <Screen tabBar>
      <Masthead label="Wi-Fi, codes, where things are" right={<PillButton title="Add" onPress={() => setEditing({})} />} />
      <Title size={72}>Our home</Title>

      {items && filled.length === 0 && (
        <Text serif italic size={22} color={colors.muted} style={{ lineHeight: 28 }}>
          The things a helper asks about. Passwords and codes stay hidden until someone taps them.
        </Text>
      )}

      {filled.length > 0 && (
        <Card style={{ gap: 0 }}>
          {filled.map((item, i) => (
            <Animated.View key={item.id} entering={FadeIn} layout={LinearTransition.duration(240)}>
              {i > 0 && <Hairline />}
              <HouseRow item={item} onEdit={() => setEditing({ item })} />
            </Animated.View>
          ))}
        </Card>
      )}

      {missing.length > 0 && (
        <Animated.View layout={LinearTransition.duration(240)} style={styles.quick}>
          {missing.map((label) => (
            <Chip key={label} label={`+ ${label}`} onPress={() => setEditing({ label })} />
          ))}
        </Animated.View>
      )}

      {editing && <HouseSheet {...editing} sort={items?.length ?? 0} onClose={() => setEditing(null)} />}
    </Screen>
  );
}

function HouseRow({ item, onEdit }: { item: HouseItem; onEdit: () => void }) {
  // A password goes back to dots whenever this page opens again.
  const [shown, setShown] = useState(false);
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Opens it to change"
        onPress={onEdit}
        style={({ pressed }) => [styles.rowMain, pressed && { opacity: 0.6 }]}>
        <View style={styles.icon}>
          <Icon name={iconFor(item.label)} size={20} color={colors.accent} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text serif size={24} numberOfLines={1} style={{ lineHeight: 29 }}>
            {item.label || 'Untitled'}
          </Text>
          {item.value ? (
            <Text size={15} color={colors.muted} style={{ lineHeight: 21 }}>
              {item.value}
            </Text>
          ) : null}
          {item.secret ? (
            <Text
              weight={700}
              size={16}
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
  row: { flexDirection: 'row', alignItems: 'center' },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 14 },
  icon: { width: 24, paddingTop: 5, alignItems: 'center' },
  eye: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  secretField: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
