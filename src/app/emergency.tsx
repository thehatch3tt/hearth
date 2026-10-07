import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Button, Card, Label, RoundButton, Screen, Text } from '@/components/ui';
import { type Alert, type Contact, type Person, useQuery, useSettings } from '@/lib/db';
import { colors, emergency, radius } from '@/lib/theme';

const call = (phone: string) => Linking.openURL(`tel:${phone.replace(/[^\d+*#]/g, '')}`);

/** The dark card for when something goes wrong. Everything on it is on the phone, so it works offline. */
export default function EmergencyScreen() {
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
          <Text weight={800} size={13} color={emergency.heading} style={styles.title}>
            Emergency
          </Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/emergency-edit')} hitSlop={8} style={styles.edit}>
            <Text weight={700} size={14} color={emergency.label}>
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
        <Text weight={800} size={26} color="#FFFFFF">
          Call 911
        </Text>
      </Pressable>

      {address ? (
        <Card style={{ borderRadius: radius.big, gap: 4 }}>
          <Label>Read this to the operator</Label>
          <Text weight={800} size={22} style={{ lineHeight: 28 }} selectable>
            {address}
          </Text>
          {settings.address_note?.trim() ? (
            <Text size={14} color="#3A4256">
              {settings.address_note.trim()}
            </Text>
          ) : null}
        </Card>
      ) : null}

      {nothingYet && (
        <Card style={{ borderRadius: radius.big, gap: 14 }}>
          <Text size={14} color={colors.muted} style={{ lineHeight: 20 }}>
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
              <Text weight={700} size={12} color={emergency.label} numberOfLines={1}>
                {[contact.label, contact.name].filter(Boolean).join(' · ') || 'Call'}
              </Text>
              <Text weight={800} size={15} color="#FFFFFF" style={{ fontVariant: ['tabular-nums'] }}>
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
            if (theirs.length === 0) {
              return (
                <Text key={person.id} weight={800} size={15} color="#FFFFFF">
                  {person.name} · <Text weight={600} size={15} color={emergency.text}>no allergies listed</Text>
                </Text>
              );
            }
            return theirs.map((alert) => (
              <View key={alert.id} style={{ gap: 2 }}>
                <Text weight={800} size={15} color="#FFFFFF">
                  {person.name} · {alert.title}
                </Text>
                {alert.details ? (
                  <Text size={13} color={emergency.text} style={{ lineHeight: 18 }}>
                    {alert.details}
                  </Text>
                ) : null}
              </View>
            ));
          })}
        </View>
      )}

      <Text size={12} color={emergency.footnote} style={{ textAlign: 'center', marginTop: 4 }}>
        {['Works offline.', settings.emergency_note?.trim()].filter(Boolean).join(' ')}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { letterSpacing: 1.3, textTransform: 'uppercase' },
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
  contact: { flexGrow: 1, flexBasis: '45%', backgroundColor: emergency.card, borderRadius: radius.card, padding: 14, gap: 4 },
  medical: { backgroundColor: emergency.card, borderRadius: radius.big, paddingVertical: 16, paddingHorizontal: 18, gap: 12 },
});
