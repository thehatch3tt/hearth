/**
 * Covers the app until Face ID (or the passcode) says it's them, when the lock is on (app/you). It
 * locks again whenever the app goes to the background. The screens stay underneath, so nothing is lost.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Button, Text } from '@/components/ui';
import { canLock, lockName, unlock } from '@/lib/lock';
import { getData, useData } from '@/lib/store';
import { colors } from '@/lib/theme';

export function LockGate({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { lock } = useData();
  const [locked, setLocked] = useState(() => canLock && getData().lock);
  const [name, setName] = useState('Face ID');

  useEffect(() => {
    lockName().then(setName);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background' && canLock && getData().lock) setLocked(true);
    });
    return () => subscription.remove();
  }, []);

  const showing = locked && lock;

  const tryUnlock = async () => {
    if (await unlock()) setLocked(false);
  };

  // Ask straight away when the cover appears, and on coming back from the background. (Not on every
  // return to "active": the Face ID prompt itself passes through "inactive", so Cancel would loop.)
  useEffect(() => {
    if (!showing) return;
    const ask = async () => {
      if (await unlock()) setLocked(false);
    };
    if (AppState.currentState === 'active') ask();
    let previous = AppState.currentState;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && previous === 'background') ask();
      previous = state;
    });
    return () => subscription.remove();
  }, [showing]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {children}
      {showing && (
        <View style={[StyleSheet.absoluteFill, styles.cover, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 20) + 12 }]}>
          <View style={styles.center}>
            <View style={styles.ring}>
              <Icon name="lock" size={30} />
            </View>
            <Text weight={200} size={34}>
              Left in Love
            </Text>
            <Text color={colors.muted}>Locked, to keep it private</Text>
          </View>
          <Button label={`Unlock with ${name}`} onPress={tryUnlock} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { backgroundColor: colors.background, paddingHorizontal: 22 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  ring: { width: 76, height: 76, borderRadius: 38, borderWidth: 1, borderColor: colors.selected, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
});
