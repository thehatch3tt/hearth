import { router } from 'expo-router';

import { Hint, ListEditor } from '@/components/ListEditor';
import { SettingInput } from '@/components/SettingInput';
import { Card, Masthead, PillButton, Screen, SectionTitle, Title } from '@/components/ui';
import { contactLabels } from '@/lib/choices';
import { type Contact, useQuery, useSettings } from '@/lib/db';
import { colors } from '@/lib/theme';

/** The address and phone numbers on the emergency card. (Allergies come from each person's page.) */
export default function EditEmergencyScreen() {
  const settings = useSettings();
  const contacts = useQuery<Contact>('SELECT * FROM contacts ORDER BY sort, id');

  return (
    <Screen>
      <Masthead back label="Emergency" color={colors.danger} right={<PillButton title="Done" onPress={() => router.back()} />} />
      <Title size={56} deck="What a helper needs if something goes wrong.">
        The emergency card
      </Title>

      <Card style={{ gap: 16 }}>
        <SectionTitle title="Where you are" />
        <SettingInput settings={settings} name="address" label="Address" placeholder="1428 Maple Ridge Dr, Springfield" autoCapitalize="words" />
        <SettingInput settings={settings} name="address_note" label="How to find it" placeholder="Cross street: Oak Ave · White house, blue door" />
      </Card>

      <Card style={{ gap: 14 }}>
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
        <SectionTitle title="At the bottom" />
        <SettingInput
          settings={settings}
          name="emergency_note"
          label="A last line"
          placeholder="First aid kit: hall closet, top shelf."
        />
        <Hint>Allergies and warnings come from each person’s page.</Hint>
      </Card>
    </Screen>
  );
}
