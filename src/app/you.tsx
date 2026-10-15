import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Button, Card, Eyebrow, Row, Screen, Text, Toggle } from '@/components/ui';
import { KEPT_HERE, KEPT_HERE_BACKUPS, NOT_ADVICE } from '@/lib/content';
import { canLock, confirmLock, lockName } from '@/lib/lock';
import { newId, startOver, update, useData, type Person } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';

/**
 * You (A+ on the "calmer looks" canvas), from your initial on Home: where everything is kept, who it's
 * written for, the preview, the lock, backups, and starting over. It replaced the Family and Settings
 * tabs on 2026-10-15.
 */
export default function You() {
  const data = useData();
  const [lock, setLock] = useState('Face ID');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');

  useEffect(() => {
    lockName().then(setLock);
  }, []);

  const setLocked = async (on: boolean) => {
    if (on && !(await confirmLock())) return;
    update((current) => ({ ...current, lock: on }));
  };

  const add = () => {
    if (!name.trim()) return;
    update((current) => ({ ...current, people: [...current.people, { id: newId(), name: name.trim(), relation: relation.trim() }] }));
    setName('');
    setRelation('');
    setAdding(false);
  };

  const remove = (person: Person) =>
    Alert.alert(`Remove ${person.name}?`, 'Only their name is removed. Nothing you’ve written changes.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => update((current) => ({ ...current, people: current.people.filter((item) => item.id !== person.id) })) },
    ]);

  return (
    <Screen gap={24}>
      <View style={styles.top}>
        <TextInput
          value={data.name}
          onChangeText={(value) => update((current) => ({ ...current, name: value }))}
          placeholder="Your first name"
          placeholderTextColor={colors.faint}
          autoCapitalize="words"
          accessibilityLabel="Your first name"
          style={styles.name}
        />
        <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} onPress={() => router.back()} style={styles.round}>
          <Icon name="close" size={16} color={colors.ink} strokeWidth={2} />
        </Pressable>
      </View>

      <Card style={{ padding: 20, gap: 12, borderRadius: 26 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Icon name="lock" size={20} strokeWidth={1.8} />
          <Text size={18} weight={400}>
            Kept only on this phone
          </Text>
        </View>
        <Text size={15} color={colors.soft} style={{ lineHeight: 23 }}>
          {KEPT_HERE}
        </Text>
        <Text size={13} color={colors.faint} style={{ lineHeight: 19 }}>
          {KEPT_HERE_BACKUPS}
        </Text>
      </Card>

      <View style={{ gap: 4 }}>
        <Eyebrow style={{ paddingHorizontal: 2 }}>Written for</Eyebrow>
        {data.people.map((person, i) => (
          <View key={person.id} style={[styles.person, i > 0 && styles.line]}>
            <View style={styles.initial}>
              <Text weight={500} color={colors.accent}>
                {person.name[0].toUpperCase()}
              </Text>
            </View>
            <Text style={{ flex: 1 }}>
              {person.name}
              {person.relation ? <Text color={colors.faint}>{` · ${person.relation}`}</Text> : null}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${person.name}`} hitSlop={8} onPress={() => remove(person)} style={styles.remove}>
              <Icon name="close" size={14} color={colors.faint} strokeWidth={2} />
            </Pressable>
          </View>
        ))}
        {adding ? (
          <Card style={{ padding: 14, gap: 10, marginTop: 8 }}>
            <TextInput value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={colors.faint} autoCapitalize="words" autoFocus accessibilityLabel="Name" style={styles.input} />
            <TextInput value={relation} onChangeText={setRelation} placeholder="Who they are to you (wife, son…)" placeholderTextColor={colors.faint} accessibilityLabel="Who they are to you" returnKeyType="done" onSubmitEditing={add} style={styles.input} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button label="Cancel" kind="outline" onPress={() => setAdding(false)} style={{ flex: 1, height: 46 }} />
              <Button label="Add" onPress={add} style={{ flex: 1, height: 46 }} />
            </View>
          </Card>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => setAdding(true)} style={({ pressed }) => [styles.addPill, pressed && { borderColor: colors.accent }]}>
            <Text size={15} color={colors.muted}>
              + Add someone
            </Text>
          </Pressable>
        )}
      </View>

      <Card>
        <Row first icon="eye" title="See it as they will" onPress={() => router.push('/preview')} />
        {canLock && <Row icon="lock" title={`Lock with ${lock}`} note="Asks each time Left in Love opens" right={<Toggle value={data.lock} onChange={setLocked} label={`Lock with ${lock}`} />} />}
        <Row icon="download" title="Backup and PDF" note="Move to a new phone, or print it" onPress={() => router.push('/backup')} />
      </Card>

      <Pressable
        accessibilityRole="button"
        onPress={() =>
          Alert.alert('Erase everything?', 'Every page, letter and recording will be removed from this phone. This can’t be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Erase', style: 'destructive', onPress: startOver },
          ])
        }
        style={{ alignSelf: 'center', padding: 8 }}>
        <Text size={15} color={colors.faint}>
          Erase everything and start over
        </Text>
      </Pressable>

      <Text size={12} color={colors.faint} style={{ textAlign: 'center', lineHeight: 18, paddingHorizontal: 12 }}>
        {NOT_ADVICE}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { flex: 1, color: colors.ink, fontFamily: fonts[200], fontSize: 30, paddingVertical: 2 },
  round: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 2 },
  line: { borderTopWidth: 1, borderTopColor: colors.line },
  initial: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' },
  remove: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  addPill: { alignSelf: 'flex-start', marginTop: 8, height: 40, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: colors.selected, justifyContent: 'center' },
  input: { height: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.selected, backgroundColor: colors.background, color: colors.ink, paddingHorizontal: 14, fontFamily: fonts[300], fontSize: 16 },
});
