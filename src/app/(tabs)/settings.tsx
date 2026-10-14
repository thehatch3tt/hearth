import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import { Card, Eyebrow, Row, Screen, Text, Toggle } from '@/components/ui';
import { canLock, confirmLock, lockName } from '@/lib/lock';
import { startOver, update, useData } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';

const WHOSE = { mine: 'My own', helping: 'Helping someone write theirs', together: 'Ours, as a couple' };

export default function Settings() {
  const data = useData();
  const [lock, setLock] = useState('Face ID');
  useEffect(() => {
    lockName().then(setLock);
  }, []);

  const setLocked = async (on: boolean) => {
    if (on && !(await confirmLock())) return;
    update((current) => ({ ...current, lock: on }));
  };

  return (
    <Screen tabs>
      <Text size={28} weight={400}>
        Settings
      </Text>

      <View style={{ gap: 8 }}>
        <Eyebrow>You</Eyebrow>
        <Card style={{ padding: 14, gap: 6 }}>
          <Text size={13} color={colors.faint}>
            Your first name
          </Text>
          <TextInput
            value={data.name}
            onChangeText={(name) => update((current) => ({ ...current, name }))}
            placeholder="Your first name"
            placeholderTextColor={colors.faint}
            autoCapitalize="words"
            accessibilityLabel="Your first name"
            style={styles.input}
          />
        </Card>
        <Card>
          <Row first title="Whose handbook" note={WHOSE[data.whose]} />
        </Card>
      </View>

      {canLock && (
        <View style={{ gap: 8 }}>
          <Eyebrow>Privacy</Eyebrow>
          <Card>
            <Row first icon="lock" title={`Lock with ${lock}`} note="Asks each time Left in Love opens" right={<Toggle value={data.lock} onChange={setLocked} label={`Lock with ${lock}`} />} />
          </Card>
        </View>
      )}

      <View style={{ gap: 8 }}>
        <Eyebrow>Your handbook</Eyebrow>
        <Card>
          <Row first icon="eye" title="Preview what your family will see" onPress={() => router.push('/preview')} />
          <Row icon="download" title="Backup and export" note="Move to a new phone, or make a PDF" onPress={() => router.push('/backup')} />
          <Row
            icon="trash"
            title="Start over"
            note="Erase everything on this phone"
            onPress={() =>
              Alert.alert('Erase everything?', 'Every page, letter and person you’ve added will be removed from this phone.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Erase', style: 'destructive', onPress: startOver },
              ])
            }
          />
        </Card>
      </View>

      <Text size={13} color={colors.faint} style={{ textAlign: 'center', paddingTop: 8 }}>
        Left in Love keeps everything on this phone.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { color: colors.ink, fontFamily: fonts[300], fontSize: 17, paddingVertical: 4 },
});
