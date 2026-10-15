import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { BackButton, Button, Card, Eyebrow, Screen, Text } from '@/components/ui';
import { SECTIONS } from '@/lib/content';
import { sharePdf, type Part } from '@/lib/pdf';
import { isWritten, useData } from '@/lib/store';
import { colors } from '@/lib/theme';

/** Make a PDF (mockup 14): pick what goes in; logins and letters stay out unless chosen. */
export default function Pdf() {
  const data = useData();
  const [parts, setParts] = useState<Set<Part>>(() => new Set(SECTIONS.map((section) => section.id)));
  const [busy, setBusy] = useState(false);

  const written = (ids: string[]) => ids.filter((id) => isWritten(data.pages[id])).length;
  const options: { id: Part; title: string; note: string }[] = [
    ...SECTIONS.map((section) => {
      const ids = section.pages.filter((page) => page.id !== 'logins').map((page) => page.id);
      return { id: section.id as Part, title: section.title, note: `${written(ids)} of ${ids.length} pages written` };
    }),
    { id: 'logins', title: 'Phone, logins and accounts', note: 'Left out unless you choose it' },
    { id: 'letters', title: 'Letters', note: `${data.letters.length} written · stay sealed unless you include them` },
  ];

  const toggle = (id: Part) =>
    setParts((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const make = async () => {
    setBusy(true);
    try {
      await sharePdf(data, parts);
    } catch {
      Alert.alert('Couldn’t make the PDF', 'Please try again.');
    }
    setBusy(false);
  };

  return (
    <Screen
      footer={
        busy ? (
          <View style={{ flex: 1, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <ActivityIndicator color={colors.accent} />
            <Text color={colors.muted}>Making your PDF…</Text>
          </View>
        ) : (
          <Button label="Make PDF and share" icon="upload" onPress={make} style={{ flex: 1 }} />
        )
      }>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton />
        <Text size={26} weight={400}>
          Make a PDF
        </Text>
      </View>
      <Text color={colors.muted} style={{ lineHeight: 23 }}>
        To print for a binder, keep with your will, or send to someone who doesn&apos;t use the app.
      </Text>

      <View style={{ gap: 8 }}>
        <Eyebrow>Include</Eyebrow>
        <Card>
          {options.map((option, i) => {
            const on = parts.has(option.id);
            return (
              <Pressable key={option.id} accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => toggle(option.id)} style={[styles.row, i > 0 && styles.line]}>
                <View style={[styles.box, on && { backgroundColor: colors.accent, borderColor: colors.accent }]}>{on && <Icon name="check" size={12} color={colors.onAccent} strokeWidth={3.4} />}</View>
                <View style={{ flex: 1 }}>
                  <Text weight={400}>{option.title}</Text>
                  <Text size={12} color={colors.faint}>
                    {option.note}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </Card>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 4 }}>
        <Icon name="warn" size={18} />
        <Text size={13} color="#C9C4D3" style={{ flex: 1, lineHeight: 20 }}>
          A PDF isn&apos;t sealed like the app. Anyone who has the file can read it, so keep it somewhere safe. Voice notes and photos stay in the app.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 11 },
  line: { borderTopWidth: 1, borderTopColor: colors.line },
  box: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: '#5E5A6B', alignItems: 'center', justifyContent: 'center' },
});
