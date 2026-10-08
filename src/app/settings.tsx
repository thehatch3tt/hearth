import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { SettingRow } from '@/components/SettingInput';
import { Card, Hairline, Masthead, PillButton, Screen, SectionTitle, Segmented, Text, Title } from '@/components/ui';
import { saveSetting, useSettings } from '@/lib/db';
import { useTheme } from '@/lib/theme';

type Appearance = 'system' | 'light' | 'dark';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const db = useSQLiteContext();
  const settings = useSettings();
  const appearance: Appearance = settings.appearance === 'light' || settings.appearance === 'dark' ? settings.appearance : 'system';

  return (
    <Screen>
      <Masthead back label="Hearth" right={<PillButton title="Done" onPress={() => router.back()} />} />
      <Title size={56}>Settings</Title>

      <Card style={{ gap: 0 }}>
        <SectionTitle title="The handbook" />
        <SettingRow settings={settings} name="family_name" label="Family name" placeholder="Carter" autoCapitalize="words" />
        <Hairline />
        <SettingRow settings={settings} name="my_name" label="Your name" placeholder="Sam" autoCapitalize="words" />
        <Text size={13} color={colors.muted} style={{ lineHeight: 18, paddingTop: 6 }}>
          {settings.family_name?.trim()
            ? `The top of Today reads “The ${settings.family_name.trim()} Family Handbook”. `
            : ''}
          Your name is saved when you mark a medicine given.
        </Text>
      </Card>

      <Card style={{ gap: 12 }}>
        <SectionTitle title="Appearance" />
        <Segmented<Appearance>
          value={appearance}
          onChange={(value) => saveSetting(db, 'appearance', value)}
          options={[
            { value: 'system', label: 'Like the phone' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
      </Card>

      <Text serif italic size={18} color={colors.muted} style={{ lineHeight: 24 }}>
        Everything in Hearth is saved on this phone. Only a sitter link you choose to send ever leaves it.
      </Text>
    </Screen>
  );
}
