import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Button, Card, Eyebrow, Screen, Segmented, Text } from '@/components/ui';
import { newId, update, useData, type Data, type Person } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';

/** Who the handbook is for, and how it opens for them. */
export default function Family() {
  const data = useData();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [access, setAccess] = useState<Person['access']>('later');

  const add = () => {
    if (!name.trim()) return;
    update((current) => ({ ...current, people: [...current.people, { id: newId(), name: name.trim(), relation: relation.trim(), access }] }));
    setName('');
    setRelation('');
    setAccess('later');
    setAdding(false);
  };

  const remove = (person: Person) =>
    Alert.alert(`Remove ${person.name}?`, 'They won’t receive your handbook.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => update((current) => ({ ...current, people: current.people.filter((item) => item.id !== person.id) })) },
    ]);

  return (
    <Screen tabs>
      <Text size={28} weight={400}>
        Family
      </Text>

      <View style={{ gap: 8 }}>
        <Eyebrow>Who your handbook is for</Eyebrow>
        {data.people.length > 0 && (
          <Card>
            {data.people.map((person, i) => (
              <View key={person.id} style={[styles.row, i > 0 && styles.line]}>
                <View style={styles.initial}>
                  <Text weight={500} color={colors.accent}>
                    {person.name[0].toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, gap: 1 }}>
                  <Text weight={400}>
                    {person.name}
                    {person.relation ? <Text color={colors.faint}>{` · ${person.relation}`}</Text> : null}
                  </Text>
                  <Text size={13} color={colors.faint}>
                    {person.access === 'now' ? 'Can read it now' : 'Opens it when it’s needed'}
                  </Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${person.name}`} hitSlop={8} onPress={() => remove(person)} style={styles.remove}>
                  <Icon name="trash" size={16} color={colors.faint} />
                </Pressable>
              </View>
            ))}
          </Card>
        )}

        {adding ? (
          <Card style={{ padding: 14, gap: 10 }}>
            <TextInput value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={colors.faint} autoCapitalize="words" accessibilityLabel="Name" style={styles.input} />
            <TextInput value={relation} onChangeText={setRelation} placeholder="How they're related (wife, son…)" placeholderTextColor={colors.faint} accessibilityLabel="How they're related" style={styles.input} />
            <Segmented
              label="When they can read it"
              value={access}
              onChange={setAccess}
              options={[
                { value: 'later', label: 'When it’s needed' },
                { value: 'now', label: 'Now' },
              ]}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button label="Cancel" kind="outline" onPress={() => setAdding(false)} style={{ flex: 1, height: 48 }} />
              <Button label="Add" onPress={add} style={{ flex: 1, height: 48 }} />
            </View>
          </Card>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => setAdding(true)} style={styles.dashed}>
            <Text color={colors.muted}>+ Add someone</Text>
          </Pressable>
        )}
      </View>

      <Card style={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Icon name="lock" size={20} />
          <Text size={17} weight={500}>
            How it opens for them
          </Text>
        </View>
        <Text size={14} color={colors.soft} style={{ lineHeight: 22 }}>
          When someone asks to open your handbook, you&apos;ll get a message. If you don&apos;t answer in time, it opens for them. Until then it stays sealed.
        </Text>
        <View style={{ gap: 6 }}>
          <Text size={13} color={colors.faint}>
            Wait before it opens
          </Text>
          <Segmented
            label="Wait before it opens"
            value={data.waitDays}
            onChange={(waitDays: Data['waitDays']) => update((current) => ({ ...current, waitDays }))}
            options={[
              { value: 3, label: '3 days' },
              { value: 7, label: '7 days' },
              { value: 14, label: '14 days' },
            ]}
          />
        </View>
        <Text size={13} color={colors.faint}>
          Sending it to them comes in a later version. For now this records who it&apos;s for.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  line: { borderTopWidth: 1, borderTopColor: colors.line },
  initial: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' },
  remove: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  dashed: { height: 46, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.outline, alignItems: 'center', justifyContent: 'center' },
  input: { height: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.selected, backgroundColor: colors.background, color: colors.ink, paddingHorizontal: 14, fontFamily: fonts[300], fontSize: 16 },
});
