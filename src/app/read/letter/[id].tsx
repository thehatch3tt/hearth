import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { BackButton, Eyebrow, Screen, Text } from '@/components/ui';
import { VoiceNotes } from '@/components/Voice';
import { opensText, useData } from '@/lib/store';
import { colors } from '@/lib/theme';

/** A letter as the person it's for will read it (from the preview). */
export default function ReadLetter() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = useData();
  const letter = data.letters.find((item) => item.id === id);
  if (!letter) return null;
  const from = data.name.trim();

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton />
        <Text size={13} color={colors.faint} style={{ flex: 1 }}>
          {opensText(letter.opens)}
        </Text>
      </View>

      <View style={{ gap: 2 }}>
        <Text size={13} color={colors.muted}>
          {from ? `From ${from}` : 'A letter'}
        </Text>
        <Text size={28} weight={400}>{`To ${letter.to || 'you'}`}</Text>
      </View>

      <Text size={17} color="#EDE9F2" style={{ lineHeight: 29 }}>
        {letter.body.trim() || 'This letter hasn’t been written yet.'}
      </Text>

      {(letter.voice ?? []).length > 0 && (
        <View style={{ gap: 8 }}>
          <Eyebrow>In their own voice</Eyebrow>
          <VoiceNotes notes={letter.voice ?? []} readOnly />
        </View>
      )}
    </Screen>
  );
}
