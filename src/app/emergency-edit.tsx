import { router } from 'expo-router';

import { Hint, ListEditor } from '@/components/ListEditor';
import { SettingInput } from '@/components/SettingInput';
import { Card, PageHeader, PillButton, Screen, SectionTitle, Text } from '@/components/ui';
import { contactLabels } from '@/lib/choices';
import { type Contact, useQuery, useSettings } from '@/lib/db';

/** The address and phone numbers on the emergency card. (Allergies come from each person's page.) */
export default function EditEmergencyScreen() {
  const settings = useSettings();
  const contacts = useQuery<Contact>('SELECT * FROM contacts ORDER BY sort, id');

  return (
    <Screen
      header={
        <PageHeader right={<PillButton title="Done" onPress={() => router.back()} />}>
          <Text weight={800} size={28} style={{ letterSpacing: -0.5 }}>
            Emergency card
          </Text>
        </PageHeader>
      }>
      <Card style={{ gap: 16 }}>
        <SectionTitle title="Where you are" />
        <SettingInput settings={settings} name="address" label="Address" placeholder="1428 Maple Ridge Dr, Springfield" autoCapitalize="words" />
        <SettingInput settings={settings} name="address_note" label="How to find it" placeholder="Cross street: Oak Ave · White house, blue door" />
      </Card>

      <Card>
        <SectionTitle title="Who to call" />
        <Hint>Tap a number on the card to call it. Poison Control in the US is 1-800-222-1222.</Hint>
        <ListEditor
          table="contacts"
          rows={contacts}
          lines={[
            [
              { key: 'label', placeholder: 'Who', kind: 'choice', options: contactLabels },
              { key: 'name', placeholder: 'Name' },
            ],
            [{ key: 'phone', placeholder: '(555) 201-4417', kind: 'phone' }],
          ]}
          addLabel="Add a number"
        />
      </Card>

      <Card style={{ gap: 16 }}>
        <SettingInput
          settings={settings}
          name="emergency_note"
          label="A line at the bottom"
          placeholder="First aid kit: hall closet, top shelf."
        />
        <Hint>Allergies and warnings come from each person’s page.</Hint>
      </Card>
    </Screen>
  );
}
