import { router } from 'expo-router';

import { SettingInput } from '@/components/SettingInput';
import { Card, PageHeader, PillButton, Screen, Text } from '@/components/ui';
import { useSettings } from '@/lib/db';
import { colors } from '@/lib/theme';

export default function SettingsScreen() {
  const settings = useSettings();
  return (
    <Screen
      header={
        <PageHeader right={<PillButton title="Done" onPress={() => router.back()} />}>
          <Text weight={800} size={28} style={{ letterSpacing: -0.5 }}>
            Settings
          </Text>
        </PageHeader>
      }>
      <Card style={{ gap: 16 }}>
        <SettingInput
          settings={settings}
          name="family_name"
          label="Family name"
          hint={settings.family_name ? `Shows as “The ${settings.family_name} family”.` : 'Shows at the top of the handbook.'}
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
      <Text size={13} color={colors.muted} style={{ lineHeight: 19, paddingHorizontal: 4 }}>
        Everything in Hearth is saved on this phone only. Nothing is sent anywhere.
      </Text>
    </Screen>
  );
}
