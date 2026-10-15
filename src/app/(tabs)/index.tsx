import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { Screen, Text } from '@/components/ui';
import { forFamily, SECTIONS } from '@/lib/content';
import { isWritten, progress, useData } from '@/lib/store';
import { colors } from '@/lib/theme';

/** Good morning / afternoon / evening, by the clock. */
const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
};

/**
 * Home (A+ on the "calmer looks" canvas): who it's written for, one question to think about (from the
 * first page with nothing on it yet), and a tile for each section and the letters.
 */
export default function Home() {
  const data = useData();
  const { next } = progress(data);
  const name = data.name.trim();
  const question = next?.prompts[0];

  return (
    <Screen tabs gap={22}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="heart" size={18} />
          <Text weight={400} size={15} color={colors.muted}>
            Left in Love
          </Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="You: who it’s for, privacy and settings" onPress={() => router.push('/you')} style={styles.avatar}>
          {name ? <Text weight={500}>{name[0].toUpperCase()}</Text> : <Icon name="people" size={18} color={colors.soft} />}
        </Pressable>
      </View>

      <View style={{ gap: 4, paddingHorizontal: 2 }}>
        <Text size={30} weight={200} style={{ lineHeight: 38 }}>{`${greeting()}${name ? `, ${name}` : ''}`}</Text>
        <Text size={15} color={colors.muted}>{`Written for ${forFamily(data.people.map((person) => person.name), 'the people you love')}.`}</Text>
      </View>

      {next && question ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`${question} Write it on ${next.title}`} onPress={() => router.push({ pathname: '/page/[id]', params: { id: next.id, ask: question } })} style={({ pressed }) => [styles.ask, pressed && { backgroundColor: colors.raised }]}>
          <Text size={13} weight={400} color={colors.accent}>
            Something to think about
          </Text>
          <Text size={22} style={{ lineHeight: 29 }}>
            {question}
          </Text>
          <View style={styles.askFoot}>
            <Text size={14} color={colors.faint} style={{ flex: 1 }}>
              {next.title}
            </Text>
            <View style={styles.write}>
              <Text size={15} weight={500} color={colors.onAccent}>
                Write it
              </Text>
            </View>
          </View>
        </Pressable>
      ) : (
        <Pressable accessibilityRole="button" onPress={() => router.push('/preview')} style={({ pressed }) => [styles.ask, pressed && { backgroundColor: colors.raised }]}>
          <Text size={13} weight={400} color={colors.accent}>
            Every page has something on it
          </Text>
          <Text size={20} style={{ lineHeight: 27 }}>
            Look it over now and then, and see it as they will.
          </Text>
        </Pressable>
      )}

      <View style={styles.tiles}>
        {SECTIONS.map((section) => {
          const written = section.pages.filter((page) => isWritten(data.pages[page.id])).length;
          return (
            <Tile key={section.id} icon={section.icon as IconName} name={section.short} note={written ? `${written} written` : 'Not yet'} onPress={() => router.navigate({ pathname: '/handbook', params: { section: section.id } })} />
          );
        })}
        <Tile
          icon="mail"
          name="Letters"
          note={data.letters.length === 1 ? `To ${data.letters[0].to.trim() || 'someone'}` : data.letters.length ? `${data.letters.length} letters` : 'Not yet'}
          onPress={() => router.navigate('/letters')}
        />
      </View>

      <Pressable accessibilityRole="button" onPress={() => router.push('/you')} style={styles.kept}>
        <Icon name="lock" size={14} color={colors.faint} strokeWidth={2} />
        <Text size={13} color={colors.faint}>
          Kept only on this phone
        </Text>
      </Pressable>
    </Screen>
  );
}

function Tile({ icon, name, note, onPress }: { icon: IconName; name: string; note: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${name}, ${note}`} onPress={onPress} style={({ pressed }) => [styles.tile, pressed && { backgroundColor: colors.raised }]}>
      <View style={styles.tileIcon}>
        <Icon name={icon} size={18} />
      </View>
      <Text size={14} weight={500}>
        {name}
      </Text>
      <Text size={12} color={colors.muted} numberOfLines={1}>
        {note}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' },
  ask: { gap: 12, padding: 20, borderRadius: 26, backgroundColor: colors.card },
  askFoot: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  write: { height: 40, paddingHorizontal: 18, borderRadius: 999, backgroundColor: colors.accent, justifyContent: 'center' },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '31.5%', flexGrow: 1, backgroundColor: colors.card, borderRadius: 20, padding: 12, gap: 8 },
  tileIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' },
  kept: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 6 },
});
