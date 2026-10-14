import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Icon, type IconName } from '@/components/Icon';
import { Button, Card, Eyebrow, Screen, Segmented, Text } from '@/components/ui';
import { FIRST_WORDS, PAGES, SECTIONS } from '@/lib/content';
import { getData, pageState, progress, useData } from '@/lib/store';
import { colors } from '@/lib/theme';

/** Good morning / afternoon / evening, by the clock. */
const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
};

/** Opens a short page that hasn't been started, picked at random (any page, if they're all begun). */
const smallQuestion = () => {
  const pages = getData().pages;
  const open = PAGES.filter((page) => pageState(pages[page.id]) === 'empty');
  const short = open.filter((page) => page.minutes <= 5);
  const pool = short.length ? short : open.length ? open : PAGES;
  const page = pool[Math.floor(Math.random() * pool.length)];
  router.push({ pathname: '/page/[id]', params: { id: page.id } });
};

/** Home: My handbook (progress, the sections, the first words) or Shared with me. */
export default function Home() {
  const data = useData();
  const [tab, setTab] = useState<'mine' | 'shared'>('mine');
  const { done, total, next } = progress(data);
  const ring = 2 * Math.PI * 28;

  return (
    <Screen tabs>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="heart" size={20} />
          <Text weight={500} size={17}>
            Left in Love
          </Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => router.navigate('/settings')} style={styles.avatar}>
          <Text weight={500}>{(data.name.trim()[0] ?? '·').toUpperCase()}</Text>
        </Pressable>
      </View>

      <Text size={28} weight={400}>{`${greeting()}${data.name.trim() ? `, ${data.name.trim()}` : ''}`}</Text>

      <Segmented
        label="Handbooks"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'mine', label: 'My handbook' },
          { value: 'shared', label: 'Shared with me' },
        ]}
      />

      {tab === 'mine' ? (
        <>
          <Card style={styles.progress}>
            <Svg width={68} height={68} viewBox="0 0 68 68">
              <Circle cx={34} cy={34} r={28} fill="none" stroke="#2F2C3A" strokeWidth={5} />
              <Circle cx={34} cy={34} r={28} fill="none" stroke={colors.accent} strokeWidth={5} strokeLinecap="round" strokeDasharray={`${(ring * done) / total} ${ring}`} transform="rotate(-90 34 34)" />
            </Svg>
            <View style={styles.ringText} pointerEvents="none">
              <Text size={16} weight={400}>{`${Math.round((done / total) * 100)}%`}</Text>
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text size={17} weight={500}>{`${done} of ${total} pages written`}</Text>
              <Text size={14} color={colors.muted}>
                {next ? `Next: ${next.title}, about ${next.minutes} min` : 'Every page is written. Look it over now and then.'}
              </Text>
            </View>
            {next && (
              <Pressable accessibilityRole="button" accessibilityLabel={`Continue: ${next.title}`} onPress={() => router.push({ pathname: '/page/[id]', params: { id: next.id } })} style={styles.go}>
                <Icon name="arrow" size={18} color={colors.onAccent} strokeWidth={2.2} />
              </Pressable>
            )}
          </Card>

          <View style={styles.tiles}>
            {SECTIONS.map((section) => {
              const written = section.pages.filter((page) => pageState(data.pages[page.id]) === 'done').length;
              return (
                <Tile key={section.id} icon={section.icon as IconName} name={section.short} note={`${written} of ${section.pages.length}`} onPress={() => router.navigate({ pathname: '/handbook', params: { section: section.id } })} />
              );
            })}
            <Tile icon="mail" name="Letters" note={data.letters.length === 1 ? '1 written' : `${data.letters.length} written`} onPress={() => router.navigate('/letters')} />
          </View>

          <Pressable accessibilityRole="button" onPress={smallQuestion} style={({ pressed }) => [styles.small, pressed && { borderColor: colors.accent }]}>
            <Icon name="sprout" size={18} />
            <View style={{ flex: 1 }}>
              <Text weight={400}>Not sure where to start?</Text>
              <Text size={13} color={colors.faint}>
                Try one small, easy question
              </Text>
            </View>
            <Icon name="chevron" size={16} color="#5E5A6B" strokeWidth={2} />
          </Pressable>

          <Card style={{ padding: 16, gap: 6 }}>
            <Eyebrow color={colors.accent} style={{ paddingHorizontal: 0 }}>
              What your family reads first
            </Eyebrow>
            <Text size={15} color={colors.soft} style={{ lineHeight: 23 }}>
              {FIRST_WORDS}
            </Text>
          </Card>
        </>
      ) : (
        <>
          <Card style={{ padding: 18, gap: 8 }}>
            <Text size={18} weight={400}>
              Nothing shared with you yet
            </Text>
            <Text size={15} color={colors.muted} style={{ lineHeight: 22 }}>
              When someone leaves you their handbook, it will appear here. It opens only when they choose.
            </Text>
          </Card>
          <Button label="Preview what your family will see" kind="outline" icon="eye" onPress={() => router.push('/preview')} />
        </>
      )}
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
      <Text size={12} color={colors.muted}>
        {note}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16 },
  ringText: { position: 'absolute', left: 16, top: 16, width: 68, height: 68, alignItems: 'center', justifyContent: 'center' },
  go: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  small: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.selected },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '31.5%', flexGrow: 1, backgroundColor: colors.card, borderRadius: 18, padding: 12, gap: 8 },
  tileIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' },
});
