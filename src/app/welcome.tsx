import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { Icon, type IconName } from '@/components/Icon';
import { BackButton, Button, Card, Dots, Text, Toggle } from '@/components/ui';
import { KEPT_HERE_BACKUPS, pageById } from '@/lib/content';
import { canLock, confirmLock, lockName } from '@/lib/lock';
import { update, useData, type Data } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';

const WHOSE: { id: Data['whose']; label: string; about: string; icon: IconName }[] = [
  { id: 'mine', label: 'My own', about: 'For the people who will need it one day', icon: 'heart' },
  { id: 'helping', label: 'Helping someone write theirs', about: 'A parent or partner, with them beside you', icon: 'people' },
  { id: 'together', label: 'Ours, as a couple', about: 'One handbook you both add to', icon: 'couple' },
];

/** Only what's true today (see KEPT_HERE in lib/content.ts): no account, no server, nothing sent. */
const PRIVATE: { title: string; about: string; icon: IconName }[] = [
  { title: 'It lives only on this phone', about: 'There’s no account and no server. Everything you write stays here, and works without the internet.', icon: 'phone' },
  { title: 'No one else can read it', about: 'Not even us. It leaves the phone only if you send it yourself, as a backup file or a PDF.', icon: 'lock' },
];

const STARTS: { id: string; label: string; about: string; time: string; icon: IconName }[] = [
  { id: 'note', label: 'A note to start', about: 'The first words your family will read', time: '5 min', icon: 'mail' },
  { id: 'facts', label: 'The facts they’ll be asked for', about: 'Your full name, where you were born, and more', time: '5 min', icon: 'file' },
  { id: 'kept', label: 'Where things are kept', about: 'Papers, keys, the safe', time: '10 min', icon: 'folder' },
  { id: 'letter', label: 'A letter to someone', about: 'For now, or for a moment to come', time: 'Any time', icon: 'pen' },
];

/** The first-time welcome: four steps (mockups W1–W4). */
export default function Welcome() {
  const insets = useSafeAreaInsets();
  const saved = useData();
  const [step, setStep] = useState(1);
  const [whose, setWhose] = useState<Data['whose']>(saved.whose);
  const [name, setName] = useState(saved.name);
  const [start, setStart] = useState('note');
  const [lock, setLock] = useState(saved.lock);
  const [lockLabel, setLockLabel] = useState('Face ID');
  useEffect(() => {
    lockName().then(setLockLabel);
  }, []);

  const finish = (then: () => void) => {
    update((current) => ({ ...current, welcomed: true, whose, name: name.trim(), lock }));
    then();
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 20) + 12 }]}>
      {step > 1 && (
        <View style={styles.top}>
          <BackButton onPress={() => setStep(step - 1)} />
          <Dots step={step} total={4} />
          <View style={{ width: 40 }} />
        </View>
      )}

      {step === 1 && (
        <>
          <View style={styles.center}>
            <Svg width={132} height={132} viewBox="0 0 132 132" accessibilityLabel="A heart held in two hands">
              <Circle cx={66} cy={66} r={62} fill={colors.sheet} stroke="#2F2C3A" strokeWidth={1} />
              <Path d="M66 82s-17-10.5-17-23a9.5 9.5 0 0 1 17-5.8A9.5 9.5 0 0 1 83 59c0 12.5-17 23-17 23z" fill="none" stroke={colors.accent} strokeWidth={2} strokeLinejoin="round" />
              <Path d="M34 78c6 10 18 18 32 18s26-8 32-18M30 70c1 3 2 6 4 8M102 70c-1 3-2 6-4 8" fill="none" stroke={colors.faint} strokeWidth={1.6} strokeLinecap="round" />
            </Svg>
            <View style={{ gap: 12, alignItems: 'center' }}>
              <Text weight={200} size={38}>
                Left in Love
              </Text>
              <Text size={17} color="#C9C4D3" style={{ textAlign: 'center', lineHeight: 26 }}>
                Write down what your family will need, and the things you want them to know, so that one day it&apos;s waiting for them.
              </Text>
            </View>
            <Dots step={1} total={4} />
          </View>
          <View style={{ gap: 10 }}>
            <Button label="Begin" onPress={() => setStep(2)} />
          </View>
        </>
      )}

      {step === 2 && (
        <>
          <View style={{ gap: 8 }}>
            <Text size={30}>Whose handbook is this?</Text>
            <Text color={colors.muted}>You can add another one later.</Text>
          </View>
          <View accessibilityRole="radiogroup" style={{ gap: 10 }}>
            {WHOSE.map((option) => (
              <Choice key={option.id} on={whose === option.id} onPress={() => setWhose(option.id)} icon={option.icon} label={option.label} about={option.about} />
            ))}
          </View>
          <View style={{ gap: 8 }}>
            <Text size={14} color={colors.muted} style={{ paddingHorizontal: 4 }}>
              What should we call you?
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your first name"
              placeholderTextColor={colors.faint}
              autoCapitalize="words"
              autoComplete="given-name"
              textContentType="givenName"
              returnKeyType="done"
              accessibilityLabel="Your first name"
              style={styles.input}
            />
          </View>
          <View style={{ flex: 1 }} />
          <Button label="Continue" onPress={() => setStep(3)} />
        </>
      )}

      {step === 3 && (
        <>
          <Text size={30}>Kept only on this phone</Text>
          <View style={{ gap: 22 }}>
            {PRIVATE.map((point) => (
              <View key={point.title} style={{ flexDirection: 'row', gap: 16 }}>
                <View style={styles.ring}>
                  <Icon name={point.icon} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text size={17} weight={400}>
                    {point.title}
                  </Text>
                  <Text size={15} color={colors.muted}>
                    {point.about}
                  </Text>
                </View>
              </View>
            ))}
            <Text size={13} color={colors.faint} style={{ lineHeight: 19 }}>
              {KEPT_HERE_BACKUPS}
            </Text>
          </View>
          {canLock && (
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
              <View style={{ flex: 1 }}>
                <Text weight={400}>{`Lock with ${lockLabel}`}</Text>
                <Text size={13} color={colors.faint}>
                  You can change this later, from your initial on Home
                </Text>
              </View>
              <Toggle value={lock} onChange={async (on) => setLock(on ? await confirmLock() : false)} label={`Lock with ${lockLabel}`} />
            </Card>
          )}
          <View style={{ flex: 1 }} />
          <Button label="Continue" onPress={() => setStep(4)} />
        </>
      )}

      {step === 4 && (
        <>
          <View style={{ gap: 8 }}>
            <Text size={30}>{`Where would you like to begin${name.trim() ? `, ${name.trim()}` : ''}?`}</Text>
            <Text color={colors.muted}>There&apos;s no need to finish today. Ten quiet minutes is a good first sitting.</Text>
          </View>
          <View accessibilityRole="radiogroup" style={{ gap: 10 }}>
            {STARTS.map((option) => (
              <Choice key={option.id} on={start === option.id} onPress={() => setStart(option.id)} icon={option.icon} label={option.label} about={option.about} time={option.time} />
            ))}
          </View>
          <View style={{ flex: 1 }} />
          <View style={{ gap: 4 }}>
            <Button
              label="Start writing"
              onPress={() =>
                finish(() => {
                  router.replace('/');
                  if (start === 'letter') router.push({ pathname: '/letter/[id]', params: { id: 'new' } });
                  else if (pageById(start)) router.push({ pathname: '/page/[id]', params: { id: start } });
                })
              }
            />
            <Button label="Look around first" kind="quiet" onPress={() => finish(() => router.replace('/'))} />
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

function Choice({ on, onPress, icon, label, about, time }: { on: boolean; onPress: () => void; icon: IconName; label: string; about: string; time?: string }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={onPress} style={[styles.choice, on && { borderColor: colors.accent, backgroundColor: colors.card }]}>
      <View style={styles.choiceIcon}>
        <Icon name={icon} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text size={17} weight={400}>
          {label}
        </Text>
        <Text size={14} color={colors.muted}>
          {about}
        </Text>
      </View>
      {time ? (
        <Text size={13} color={colors.faint}>
          {time}
        </Text>
      ) : (
        <View style={[styles.radio, on && { borderColor: colors.accent }]}>{on && <View style={styles.radioDot} />}</View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 22, gap: 24 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28 },
  input: { height: 52, borderRadius: 16, borderWidth: 1, borderColor: colors.selected, backgroundColor: colors.card, color: colors.ink, paddingHorizontal: 16, fontFamily: fonts[300], fontSize: 17 },
  ring: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: colors.selected, alignItems: 'center', justifyContent: 'center' },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.selected },
  choiceIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#5E5A6B', alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
});
