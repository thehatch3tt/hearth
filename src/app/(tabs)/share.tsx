import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { Icon } from '@/components/Icon';
import { Chip } from '@/components/Select';
import { Button, Card, Field, Hairline, Masthead, Screen, SectionTitle, Segmented, Text, Title, styles as ui } from '@/components/ui';
import { type Person, type SitterLink, useQuery, useSettings } from '@/lib/db';
import { sharingIsSetUp } from '@/lib/firebase';
import { buildSnapshot, createLink, expiryFor, stopLink } from '@/lib/share';
import { colors, radius } from '@/lib/theme';
import { clockTime, relativeDay, todayKey } from '@/lib/time';

type Expiry = 'morning' | 'three' | 'week';
const EXPIRY: { value: Expiry; label: string }[] = [
  { value: 'morning', label: 'Tomorrow 9 am' },
  { value: 'three', label: 'In 3 days' },
  { value: 'week', label: 'In a week' },
];

/** "Tomorrow 9:00 am", "Sat 6:30 pm" */
const when = (ms: number) => `${relativeDay(todayKey(new Date(ms)))} ${clockTime(ms)}`;

/** A link for a sitter: choose the pages, add a note, send. No app or account needed on their end. */
export default function ShareScreen() {
  const db = useSQLiteContext();
  const settings = useSettings();
  const people = useQuery<Person>('SELECT * FROM people ORDER BY sort, id');
  const links = useQuery<SitterLink>('SELECT * FROM sitter_links ORDER BY created_at DESC');
  const [now] = useState(() => Date.now());

  const [to, setTo] = useState('');
  const [note, setNote] = useState('');
  // Until someone taps a person, the kids are chosen and the adults aren't.
  const [picked, setPicked] = useState<number[] | null>(null);
  const [house, setHouse] = useState(true);
  const [emergency, setEmergency] = useState(true);
  const [expiry, setExpiry] = useState<Expiry>('morning');
  const [sending, setSending] = useState(false);

  const chosen = picked ?? people?.filter((p) => p.kind === 'child').map((p) => p.id) ?? [];
  const toggle = (id: number) =>
    setPicked(chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id]);
  const nothingChosen = chosen.length === 0 && !house && !emergency;
  const active = links?.filter((link) => link.expires_at > now) ?? [];

  async function send() {
    setSending(true);
    try {
      const snapshot = await buildSnapshot(db, settings, {
        personIds: chosen,
        house,
        emergency,
        to,
        note,
        expiresAt: expiryFor(expiry),
      });
      const url = await createLink(db, snapshot);
      const name = to.trim();
      await Share.share({
        message: `${name ? `Hi ${name}, here's` : "Here's"} our handbook for tonight: ${url}`,
      });
      setNote('');
    } catch (error) {
      Alert.alert('The link couldn’t be made', error instanceof Error ? error.message : String(error));
    } finally {
      setSending(false);
    }
  }

  function confirmStop(link: SitterLink) {
    Alert.alert(`Stop ${link.name ? `${link.name}’s` : 'this'} link?`, 'It stops working right away and the copy is deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Stop link',
        style: 'destructive',
        onPress: () =>
          stopLink(db, link).catch((error) =>
            Alert.alert('The link couldn’t be stopped', error instanceof Error ? error.message : String(error)),
          ),
      },
    ]);
  }

  return (
    <Screen tabBar>
      <Masthead label="For a sitter · no app needed" />
      <Title size={64} deck="Choose the pages, add a note, and send.">
        Link for tonight
      </Title>

      {!sharingIsSetUp && (
        <View style={styles.notice}>
          <Text weight={700} size={11} color={colors.alertText} style={ui.label}>
            Not set up yet
          </Text>
          <Text size={15} color={colors.alertInk} style={{ lineHeight: 21 }}>
            The Firebase project and the link page still need to be connected. Until then you can look around, but links can’t
            be sent.
          </Text>
        </View>
      )}

      <Card style={{ gap: 20, paddingTop: 16 }}>
        <Field label="Who’s it for?">
          <TextInput
            value={to}
            onChangeText={setTo}
            placeholder="Jess"
            placeholderTextColor={colors.faint}
            autoCapitalize="words"
            style={ui.input}
          />
        </Field>

        <Field label="Pages they’ll see">
          <View style={styles.chips}>
            {people?.map((person) => (
              <Chip key={person.id} label={person.name} selected={chosen.includes(person.id)} onPress={() => toggle(person.id)} />
            ))}
            <Chip label="Our home" selected={house} onPress={() => setHouse(!house)} />
            <Chip label="Emergency card" selected={emergency} onPress={() => setEmergency(!emergency)} />
          </View>
        </Field>

        <Field label="A note for tonight">
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Max skipped his nap, so he may be grumpy. Pizza money is on the counter."
            placeholderTextColor={colors.faint}
            multiline
            style={[ui.input, ui.multiline]}
          />
        </Field>

        <Field label="Link stops working">
          <Segmented value={expiry} onChange={setExpiry} options={EXPIRY} />
        </Field>
      </Card>

      <View style={{ gap: 12 }}>
        <Button
          title={sending ? 'Making the link…' : `Send ${to.trim() ? `${to.trim()} the` : 'the'} link`}
          icon="share"
          disabled={!sharingIsSetUp || sending || nothingChosen}
          onPress={send}
        />
        <Text size={13} color={colors.muted} style={styles.footnote}>
          They don’t need the app or an account. The pages are locked with a key that travels only in the link, and the copy is
          deleted when the link stops working.
        </Text>
      </View>

      {active.length > 0 && (
        <Animated.View entering={FadeIn} layout={LinearTransition.duration(240)}>
          <Card style={{ gap: 0 }}>
            <SectionTitle title="Links working now" />
            {active.map((link, i) => (
              <Animated.View key={link.id} exiting={FadeOut.duration(140)} layout={LinearTransition.duration(240)}>
                {i > 0 && <Hairline />}
                <View style={styles.link}>
                  <View style={{ flex: 1, gap: 1 }}>
                    <Text serif size={24} numberOfLines={1} style={{ lineHeight: 29 }}>
                      {link.name || 'Sitter link'}
                    </Text>
                    <Text size={14} color={colors.muted}>
                      Ends {when(link.expires_at)}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Send again"
                    onPress={() => Share.share({ message: link.url })}
                    hitSlop={6}
                    style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}>
                    <Icon name="share" size={20} color={colors.accentText} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => confirmStop(link)}
                    hitSlop={6}
                    style={({ pressed }) => [styles.stop, pressed && { opacity: 0.6 }]}>
                    <Text weight={700} size={14} color={colors.danger}>
                      Stop
                    </Text>
                  </Pressable>
                </View>
              </Animated.View>
            ))}
          </Card>
        </Animated.View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: { backgroundColor: colors.alert, borderRadius: radius.small, paddingVertical: 14, paddingHorizontal: 16, gap: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  footnote: { textAlign: 'center', lineHeight: 19, paddingHorizontal: 8 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 64, paddingVertical: 8 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  stop: { height: 44, paddingHorizontal: 8, justifyContent: 'center' },
});
