import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Button, Card, Label, RoundButton, Screen, Text } from '@/components/ui';
import { type Alert, type Contact, type Person, useQuery, useSettings } from '@/lib/db';
import { emergency, radius, useTheme } from '@/lib/theme';

const call = (phone: string) => Linking.openURL(`tel:${phone.replace(/[^\d+*#]/g, '')}`);

/** The dark card for when something goes wrong. Everything on it is on the phone, so it works offline. */
export default function EmergencyScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const settings = useSettings();
  const contacts = useQuery<Contact>("SELECT * FROM contacts WHERE phone != '' ORDER BY sort, id");
  const people = useQuery<Person>('SELECT * FROM people ORDER BY sort, id');
  const alerts = useQuery<Alert>("SELECT * FROM alerts WHERE title != '' ORDER BY sort, id");

  const address = settings.address?.trim();
  const nothingYet = !address && contacts?.length === 0;

  return (
    <Screen
      background={emergency.background}
      header={
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <RoundButton icon="close" label="Close" onPress={() => router.back()} background={emergency.card} color="#FFFFFF" />
          <Text weight={700} size={11} color={emergency.heading} numberOfLines={1} style={styles.title}>
            Emergency card
          </Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/emergency-edit')} hitSlop={8} style={styles.edit}>
            <Text weight={700} size={15} color={emergency.label}>
              Edit
            </Text>
          </Pressable>
        </View>
      }>
      <StatusBar style="light" />

      <Pressable
        accessibilityRole="button"
        onPress={() => call('911')}
        style={({ pressed }) => [styles.callButton, pressed && { opacity: 0.8 }]}>
        <Icon name="phone" size={26} color="#FFFFFF" strokeWidth={2.2} />
        <Text weight={700} size={26} color="#FFFFFF">
          Call 911
        </Text>
      </Pressable>

      {address ? (
        <Card boxed style={{ gap: 6 }}>
          <Label>Read this to the operator</Label>
          <Text serif size={30} style={{ lineHeight: 35 }} selectable>
            {address}
          </Text>
          {settings.address_note?.trim() ? (
            <Text size={15} color={colors.muted} style={{ lineHeight: 21 }}>
              {settings.address_note.trim()}
            </Text>
          ) : null}
        </Card>
      ) : null}

      {nothingYet && (
        <Card boxed style={{ gap: 14 }}>
          <Text serif italic size={22} style={{ lineHeight: 27 }}>
            Add your address and the numbers a helper should call: you, a neighbor, the doctor.
          </Text>
          <Button title="Fill in the emergency card" onPress={() => router.push('/emergency-edit')} />
        </Card>
      )}

      {contacts && contacts.length > 0 && (
        <View style={styles.grid}>
          {contacts.map((contact) => (
            <Pressable
              key={contact.id}
              accessibilityRole="button"
              accessibilityLabel={`Call ${[contact.label, contact.name].filter(Boolean).join(' ')}`}
              onPress={() => call(contact.phone)}
              style={({ pressed }) => [styles.contact, pressed && { opacity: 0.7 }]}>
              <Text weight={700} size={11} color={emergency.label} numberOfLines={1} style={styles.caps}>
                {contact.label || 'Call'}
              </Text>
              {contact.name ? (
                <Text serif size={22} color="#FFFFFF" numberOfLines={1} style={{ lineHeight: 26 }}>
                  {contact.name}
                </Text>
              ) : null}
              <Text weight={700} size={16} color="#FFFFFF" numberOfLines={1} adjustsFontSizeToFit style={{ fontVariant: ['tabular-nums'] }}>
                {contact.phone}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {people && people.length > 0 && (
        <View style={styles.medical}>
          <Label color={emergency.label}>Medical</Label>
          {people.map((person) => {
            const theirs = alerts?.filter((a) => a.person_id === person.id) ?? [];
            return (
              <View key={person.id} style={styles.patient}>
                <Text serif size={24} color="#FFFFFF" style={{ lineHeight: 28 }}>
                  {person.name}
                </Text>
                {theirs.length === 0 ? (
                  <Text size={14} color={emergency.text}>
                    No allergies listed
                  </Text>
                ) : (
                  theirs.map((alert) => (
                    <View key={alert.id} style={{ gap: 2 }}>
                      <Text weight={700} size={15} color={emergency.heading}>
                        {alert.title}
                      </Text>
                      {alert.details ? (
                        <Text size={14} color={emergency.text} style={{ lineHeight: 20 }}>
                          {alert.details}
                        </Text>
                      ) : null}
                    </View>
                  ))
                )}
              </View>
            );
          })}
        </View>
      )}

      <Text serif italic size={17} color={emergency.footnote} style={{ textAlign: 'center', lineHeight: 22 }}>
        {['Works offline.', settings.emergency_note?.trim()].filter(Boolean).join(' ')}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: { flex: 1, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center' },
  caps: { letterSpacing: 1.5, textTransform: 'uppercase' },
  edit: { width: 44, height: 44, alignItems: 'flex-end', justifyContent: 'center' },
  callButton: {
    height: 76,
    borderRadius: radius.big,
    backgroundColor: emergency.call,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 6,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  contact: { flexGrow: 1, flexBasis: '45%', backgroundColor: emergency.card, borderRadius: radius.card, padding: 16, gap: 4 },
  medical: { backgroundColor: emergency.card, borderRadius: radius.big, paddingVertical: 18, paddingHorizontal: 18, gap: 14 },
  patient: { gap: 4 },
});
