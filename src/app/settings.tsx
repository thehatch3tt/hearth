import { router } from 'expo-router';

import { SettingInput } from '@/components/SettingInput';
import { Card, Masthead, PillButton, Screen, Text, Title } from '@/components/ui';
import { useSettings } from '@/lib/db';
import { colors } from '@/lib/theme';

export default function SettingsScreen() {
  const settings = useSettings();
  return (
    <Screen>
      <Masthead back label="Hearth" right={<PillButton title="Done" onPress={() => router.back()} />} />
      <Title size={56}>Settings</Title>
      <Card style={{ gap: 18, paddingTop: 16 }}>
        <SettingInput
          settings={settings}
          name="family_name"
          label="Family name"
          hint={settings.family_name ? `Shows as “The ${settings.family_name} Family Handbook”.` : 'Shows at the top of the handbook.'}
          placeholder="Carter"
          autoCapitalize="words"
        />
        <SettingInput
          settings={settings}
          name="my_name"
          label="Your name"
          hint="Saved when you mark a medicine given."
          placeholder="Sam"
          autoCapitalize="words"
        />
      </Card>
      <Text serif italic size={18} color={colors.muted} style={{ lineHeight: 24 }}>
        Everything in Hearth is saved on this phone only. Nothing is sent anywhere.
      </Text>
    </Screen>
  );
}
