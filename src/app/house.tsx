import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Hint, ListEditor } from '@/components/ListEditor';
import { Button, Card, Label, PageHeader, PillButton, Screen, Text } from '@/components/ui';
import { houseLabels } from '@/lib/choices';
import { type HouseItem, useQuery } from '@/lib/db';
import { colors, radius } from '@/lib/theme';

/** Wi-Fi, the alarm, where things are. */
export default function HouseScreen() {
  const items = useQuery<HouseItem>('SELECT * FROM house_items ORDER BY sort, id');
  const [editing, setEditing] = useState(false);
  // Nothing saved yet: start straight in the editor.
  if (items?.length === 0 && !editing) setEditing(true);
  const filled = items?.filter((item) => item.label || item.value || item.secret) ?? [];

  return (
    <Screen
      header={
        <PageHeader right={<PillButton title={editing ? 'Done' : 'Edit'} onPress={() => setEditing(!editing)} />}>
          <Text weight={900} size={28} style={{ letterSpacing: -0.3 }}>
            Our home
          </Text>
        </PageHeader>
      }>
      {editing ? (
        <Card>
          <Hint>
            The things a helper asks about: the Wi-Fi, the alarm, where the spare key and the first aid kit
            are. Put passwords and codes in their own box: they’re hidden behind dots until someone taps them.
          </Hint>
          <ListEditor
            table="house_items"
            rows={items}
            lines={[
              [{ key: 'label', placeholder: 'What is it', kind: 'choice', options: houseLabels }],
              [{ key: 'value', placeholder: 'Details: network name, where it is...', multiline: true }],
              [{ key: 'secret', placeholder: 'Password or code (kept hidden)', kind: 'secret' }],
            ]}
            addLabel="Add something"
          />
          <Button title="Done" onPress={() => setEditing(false)} />
        </Card>
      ) : (
        filled.map((item) => (
          <Card key={item.id} style={{ gap: 8 }}>
            {item.label ? <Label>{item.label}</Label> : null}
            {item.value ? (
              <Text weight={600} size={16} selectable style={{ lineHeight: 22 }}>
                {item.value}
              </Text>
            ) : null}
            {item.secret ? <Secret label={item.label} secret={item.secret} /> : null}
          </Card>
        ))
      )}
    </Screen>
  );
}

/** A password or code as dots; tap to show it, tap again to hide. Back to dots each time the page opens. */
function Secret({ label, secret }: { label: string; secret: string }) {
  const [shown, setShown] = useState(false);
  const name = /wi-?fi|password/i.test(label) ? 'Password' : 'Code';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={shown ? `${name}: ${secret}. Tap to hide.` : `${name}, hidden. Tap to show.`}
      onPress={() => setShown(!shown)}
      style={({ pressed }) => [styles.secret, pressed && { opacity: 0.7 }]}>
      <View style={{ flex: 1 }}>
        <Text weight={700} size={12} color={colors.muted}>
          {name}
        </Text>
        {shown ? (
          <Text weight={800} size={18} selectable style={{ letterSpacing: 0.5 }}>
            {secret}
          </Text>
        ) : (
          <Text weight={800} size={18} color={colors.muted} style={{ letterSpacing: 3 }}>
            ••••••••
          </Text>
        )}
      </View>
      <View style={styles.reveal}>
        <Icon name={shown ? 'eyeOff' : 'eye'} size={18} color={colors.accentText} />
        <Text weight={800} size={13} color={colors.accentText}>
          {shown ? 'Hide' : 'Show'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  secret: {
    backgroundColor: colors.background,
    borderRadius: radius.small,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reveal: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
