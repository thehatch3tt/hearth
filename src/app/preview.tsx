import { router } from 'expo-router';
import { View } from 'react-native';

import { Icon } from '@/components/Icon';
import { BackButton, Card, Eyebrow, Row, Screen, Text } from '@/components/ui';
import { CARE_MESSAGE, FIRST_WORDS, SECTIONS } from '@/lib/content';
import { pageState, useData, type PageData } from '@/lib/store';
import { colors } from '@/lib/theme';

/** The first line of some writing, shortened for a row. */
const summary = (text: string) => {
  const line = text.trim().split('\n')[0] ?? '';
  return line.length > 70 ? `${line.slice(0, 68).trimEnd()}…` : line;
};

/** What a page holds, for its row ("3 entries · 2 photos · a voice note"). */
function pageNote(page: PageData | undefined) {
  const count = (n: number, one: string, many: string) => (n === 1 ? one : `${n} ${many}`);
  const entries = (page?.entries ?? []).filter((entry) => entry.title.trim()).length;
  const parts = [
    entries ? count(entries, '1 entry', 'entries') : page?.body?.trim() ? summary(page.body) : '',
    page?.photos?.length ? count(page.photos.length, 'a photo', 'photos') : '',
    page?.voice?.length ? count(page.voice.length, 'a voice note', 'voice notes') : '',
  ];
  return parts.filter(Boolean).join(' · ');
}

/**
 * What your family sees when your handbook opens (mockups 3 and 4), built from what you've written:
 * your note, the things for the first day, who helps with what, the letters that open with the
 * handbook, then every page that has something on it (each opens read-only, in app/read/).
 */
export default function Preview() {
  const data = useData();
  const name = data.name.trim() || 'You';
  const note = data.pages.note?.body?.trim();
  const today = (data.pages.today?.entries ?? []).filter((entry) => entry.title.trim());
  const helpers = (data.pages.helpers?.entries ?? []).filter((entry) => entry.title.trim());
  const write = (id: string) => router.push({ pathname: '/page/[id]', params: { id } });
  const written = SECTIONS.map((section) => ({ section, pages: section.pages.filter((page) => pageState(data.pages[page.id]) !== 'empty') })).filter((item) => item.pages.length);
  const letters = data.letters.filter((letter) => letter.opens.kind === 'handbook' && (letter.body.trim() || letter.voice?.length));
  const waiting = data.letters.filter((letter) => letter.opens.kind !== 'handbook' && (letter.body.trim() || letter.voice?.length)).length;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton />
        <Text size={13} color={colors.faint} style={{ flex: 1 }}>
          A preview of what your family will see
        </Text>
      </View>

      <View style={{ gap: 2 }}>
        <Text size={13} color={colors.muted}>{`Left for you by ${name}`}</Text>
        <Text size={26} weight={400}>{`${name}'s handbook`}</Text>
      </View>

      <Card style={{ padding: 16, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Icon name="mail" size={18} />
          <Eyebrow color={colors.accent} style={{ paddingHorizontal: 0 }}>{`A note from ${name}`}</Eyebrow>
        </View>
        {note ? (
          <Text size={16} color="#E4E0EA" style={{ lineHeight: 25 }}>
            {note}
          </Text>
        ) : (
          <Text size={15} color={colors.faint} onPress={() => write('note')}>
            You haven&apos;t written your note yet. Tap to write it.
          </Text>
        )}
      </Card>

      <View style={{ gap: 8 }}>
        <Eyebrow>Only these, today</Eyebrow>
        <Card>
          {today.length ? (
            today.map((entry, i) => <Row key={entry.id} first={i === 0} icon="check" title={entry.title} note={entry.note} />)
          ) : (
            <Row first title="Nothing listed yet" note="Tap to add the first day's few things" onPress={() => write('today')} />
          )}
        </Card>
      </View>

      <Card style={{ padding: 18, gap: 8 }}>
        <Text size={18} weight={500}>
          Be gentle with yourself
        </Text>
        <Text size={15} color={colors.soft} style={{ lineHeight: 24 }}>
          {CARE_MESSAGE}
        </Text>
        <Text size={15} color={colors.muted} style={{ lineHeight: 24 }}>
          {FIRST_WORDS}
        </Text>
      </Card>

      <Card>
        <Row first icon="sprout" title="Ways to grieve" note="There’s no right way. A few gentle ideas, and where to find help" onPress={() => router.push('/grieve')} />
      </Card>

      <View style={{ gap: 8 }}>
        <Eyebrow>Let others carry these</Eyebrow>
        <Card>
          {helpers.length ? (
            helpers.map((entry, i) => <Row key={entry.id} first={i === 0} icon="people" title={entry.title} note={entry.note} />)
          ) : (
            <Row first title="No jobs handed off yet" note="Tap to list who helps with what" onPress={() => write('helpers')} />
          )}
        </Card>
      </View>

      {letters.length > 0 && (
        <View style={{ gap: 8 }}>
          <Eyebrow>Letters for you</Eyebrow>
          <Card>
            {letters.map((letter, i) => (
              <Row key={letter.id} first={i === 0} icon="mail" title={`To ${letter.to || 'someone'}`} note={summary(letter.body)} onPress={() => router.push({ pathname: '/read/letter/[id]', params: { id: letter.id } })} />
            ))}
          </Card>
          {waiting > 0 && (
            <Text size={13} color={colors.faint} style={{ paddingHorizontal: 4 }}>
              {waiting === 1 ? '1 more letter waits for its date or moment.' : `${waiting} more letters wait for their date or moment.`}
            </Text>
          )}
        </View>
      )}

      <Eyebrow style={{ paddingTop: 8 }}>The whole handbook</Eyebrow>
      {written.length ? (
        written.map(({ section, pages }) => (
          <View key={section.id} style={{ gap: 8 }}>
            <Text size={13} color={colors.muted} style={{ paddingHorizontal: 4 }}>
              {section.title}
            </Text>
            <Card>
              {pages.map((page, i) => (
                <Row key={page.id} first={i === 0} title={page.title} note={pageNote(data.pages[page.id])} onPress={() => router.push({ pathname: '/read/[id]', params: { id: page.id } })} />
              ))}
            </Card>
          </View>
        ))
      ) : (
        <Card>
          <Row first title="Nothing else written yet" note="Pages you write will appear here, a section at a time" />
        </Card>
      )}
    </Screen>
  );
}
