/**
 * Pick lists: a box with a ▾ that opens a short sheet from the bottom of the screen. Built to need
 * little or no scrolling:
 * - `Select`: choices as chips that wrap, plus optionally typing your own.
 * - `TimeSelect`: a grid of hours, then minutes and am/pm.
 * - `DaySelect`: a month calendar.
 */
import { type ReactNode, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Button, tap, Text, useInputStyle } from '@/components/ui';
import { radius, useTheme } from '@/lib/theme';
import { formatTime, longDay, todayKey, type Option } from '@/lib/time';

type BoxProps = {
  value: string;
  onChange: (value: string) => void;
  /** Shown in the box when nothing is chosen. */
  placeholder: string;
  /** The heading on the sheet. */
  title: string;
  style?: StyleProp<ViewStyle>;
};

/** Choose from a few words (shown as chips), or type your own. */
export function Select({
  options,
  custom,
  clearLabel,
  ...box
}: BoxProps & {
  options: Option[];
  /** Allows typing your own; this is the typing box's placeholder. */
  custom?: string;
  /** A first choice that clears the value. */
  clearLabel?: string;
}) {
  const shown = options.find((o) => o.value === box.value)?.label ?? box.value;
  return (
    <PickerBox {...box} shown={shown}>
      {(choose) => <ChoiceSheet value={box.value} options={options} custom={custom} clearLabel={clearLabel} onChoose={choose} />}
    </PickerBox>
  );
}

/** Choose a time ("HH:MM"). */
export function TimeSelect({
  clearLabel,
  suggest = '07:00',
  ...box
}: BoxProps & {
  /** A choice meaning "no time", e.g. medicine given as needed. */
  clearLabel?: string;
  /** With nothing chosen yet, the sheet starts at this time (e.g. "18:00" for bedtime). */
  suggest?: string;
}) {
  return (
    <PickerBox {...box} shown={box.value ? formatTime(box.value) : ''}>
      {(choose) => <TimeSheet value={box.value || suggest} clearLabel={clearLabel} onChoose={choose} />}
    </PickerBox>
  );
}

/** Choose a day ("YYYY-MM-DD"). */
export function DaySelect(box: BoxProps) {
  return (
    <PickerBox {...box} shown={box.value ? longDay(box.value) : ''}>
      {(choose) => <DaySheet value={box.value} onChoose={choose} />}
    </PickerBox>
  );
}

/** The box that looks like a text field, and the sheet it opens. */
function PickerBox({
  value,
  onChange,
  placeholder,
  title,
  style,
  shown,
  children,
}: BoxProps & { shown: string; children: (choose: (value: string) => void) => ReactNode }) {
  const { colors } = useTheme();
  const input = useInputStyle();
  const [open, setOpen] = useState(false);
  const choose = (choice: string) => {
    setOpen(false);
    if (choice !== value) onChange(choice);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${shown || 'not chosen'}`}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [input, styles.box, style, pressed && { opacity: 0.7 }]}>
        <Text size={15} weight={shown ? 600 : 500} color={shown ? colors.ink : colors.faint} numberOfLines={1} style={{ flex: 1 }}>
          {shown || placeholder}
        </Text>
        <Icon name="down" size={16} color={colors.muted} strokeWidth={2.4} />
      </Pressable>
      {open && (
        <BottomSheet title={title} onClose={() => setOpen(false)}>
          {children(choose)}
        </BottomSheet>
      )}
    </>
  );
}

/** A sheet that slides up from the bottom, with a title and Cancel. Draw it only while open. */
export function BottomSheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <Pressable accessibilityLabel="Close" style={[styles.backdrop, { backgroundColor: colors.backdrop }]} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap} pointerEvents="box-none">
        <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.grabber, { backgroundColor: colors.border }]} />
          <View style={styles.header}>
            <Text serif size={28} numberOfLines={1} style={{ flex: 1, lineHeight: 33 }}>
              {title}
            </Text>
            <Pressable accessibilityRole="button" onPress={onClose} hitSlop={10}>
              <Text weight={700} size={15} color={colors.accentText}>
                Cancel
              </Text>
            </Pressable>
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** A small rounded button that can be selected. */
export function Chip({ label, selected, onPress, style }: { label: string; selected?: boolean; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.chip,
        selected ? { backgroundColor: colors.accent, borderColor: colors.accent } : { backgroundColor: colors.card, borderColor: colors.border },
        pressed && { opacity: 0.7 },
        style,
      ]}>
      <Text weight={selected ? 700 : 600} size={15} color={selected ? colors.onAccent : colors.ink}>
        {label}
      </Text>
    </Pressable>
  );
}

function ChoiceSheet({
  value,
  options,
  custom,
  clearLabel,
  onChoose,
}: {
  value: string;
  options: Option[];
  custom?: string;
  clearLabel?: string;
  onChoose: (value: string) => void;
}) {
  const { colors } = useTheme();
  const input = useInputStyle();
  const isPreset = options.some((o) => o.value === value);
  const [typed, setTyped] = useState(isPreset ? '' : value);
  return (
    <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 14 }} keyboardShouldPersistTaps="handled">
      <View style={styles.wrap}>
        {clearLabel && <Chip label={clearLabel} selected={value === ''} onPress={() => onChoose('')} />}
        {options.map((option) => (
          <Chip key={option.value} label={option.label} selected={option.value === value} onPress={() => onChoose(option.value)} />
        ))}
      </View>
      {custom !== undefined && (
        <View style={styles.custom}>
          <TextInput
            value={typed}
            onChangeText={setTyped}
            placeholder={custom}
            placeholderTextColor={colors.faint}
            returnKeyType="done"
            onSubmitEditing={() => typed.trim() && onChoose(typed.trim())}
            style={[input, { flex: 1 }]}
          />
          <Pressable
            accessibilityRole="button"
            disabled={!typed.trim()}
            onPress={() => onChoose(typed.trim())}
            style={[styles.use, { backgroundColor: colors.accent }, !typed.trim() && { opacity: 0.4 }]}>
            <Text weight={700} size={15} color={colors.onAccent}>
              Use
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');

function TimeSheet({ value, clearLabel, onChoose }: { value: string; clearLabel?: string; onChoose: (value: string) => void }) {
  const [h, m] = value.split(':').map(Number);
  const [hour, setHour] = useState(h % 12 === 0 ? 12 : h % 12);
  const [minute, setMinute] = useState(m);
  const [pm, setPm] = useState(h >= 12);
  const minutes = [0, 15, 30, 45].includes(m) ? [0, 15, 30, 45] : [0, 15, 30, 45, m].sort((a, b) => a - b);
  const time = `${pad((hour % 12) + (pm ? 12 : 0))}:${pad(minute)}`;

  return (
    <View style={{ gap: 14 }}>
      <Text serif size={48} style={{ textAlign: 'center', lineHeight: 54 }}>
        {formatTime(time)}
      </Text>
      <View style={styles.wrap}>
        {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => (
          <Chip key={n} label={String(n)} selected={n === hour} onPress={() => setHour(n)} style={styles.hour} />
        ))}
      </View>
      <View style={styles.row}>
        {minutes.map((n) => (
          <Chip key={n} label={`:${pad(n)}`} selected={n === minute} onPress={() => setMinute(n)} style={{ flex: 1 }} />
        ))}
      </View>
      <View style={styles.row}>
        <Chip label="am" selected={!pm} onPress={() => setPm(false)} style={{ flex: 1 }} />
        <Chip label="pm" selected={pm} onPress={() => setPm(true)} style={{ flex: 1 }} />
      </View>
      <View style={styles.row}>
        {clearLabel && <Button quiet title={clearLabel} onPress={() => onChoose('')} style={{ flex: 1 }} />}
        <Button title="Set time" onPress={() => onChoose(time)} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function DaySheet({ value, onChoose }: { value: string; onChoose: (value: string) => void }) {
  const { colors } = useTheme();
  const today = todayKey();
  const start = (value || today).split('-').map(Number);
  const [month, setMonth] = useState({ year: start[0], month: start[1] - 1 });
  const first = new Date(month.year, month.month, 1);
  const daysInMonth = new Date(month.year, month.month + 1, 0).getDate();
  // Blank cells before the 1st, so it lands under its weekday.
  const cells: (number | null)[] = [...Array(first.getDay()).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const keyOf = (day: number) => `${month.year}-${pad(month.month + 1)}-${pad(day)}`;
  const step = (by: number) => {
    const next = new Date(month.year, month.month + by, 1);
    setMonth({ year: next.getFullYear(), month: next.getMonth() });
  };
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.row}>
        <Chip label="Today" selected={value === today} onPress={() => onChoose(today)} style={{ flex: 1 }} />
        <Chip label="Tomorrow" selected={value === todayKey(tomorrow)} onPress={() => onChoose(todayKey(tomorrow))} style={{ flex: 1 }} />
      </View>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => step(-1)} hitSlop={8} style={styles.arrow}>
          <Icon name="back" size={20} />
        </Pressable>
        <Text serif size={24} style={{ lineHeight: 29 }}>
          {first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => step(1)} hitSlop={8} style={styles.arrow}>
          <Icon name="chevron" size={20} />
        </Pressable>
      </View>
      <View style={styles.calendar}>
        {WEEKDAYS.map((name, i) => (
          <View key={`w${i}`} style={styles.cell}>
            <Text weight={700} size={11} color={colors.muted}>
              {name}
            </Text>
          </View>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <View key={`b${i}`} style={styles.cell} />;
          const key = keyOf(day);
          const selected = key === value;
          const past = key < today;
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={longDay(key)}
              accessibilityState={{ selected }}
              onPress={() => onChoose(key)}
              style={styles.cell}>
              <View
                style={[
                  styles.day,
                  key === today && { borderWidth: 2, borderColor: colors.accent },
                  selected && { backgroundColor: colors.accent },
                ]}>
                <Text weight={selected ? 700 : 500} size={16} color={selected ? colors.onAccent : past ? colors.faint : colors.ink}>
                  {day}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: radius.big,
    borderTopRightRadius: radius.big,
    paddingHorizontal: 18,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Six hours to a row.
  hour: { flexBasis: '14%', flexGrow: 1, paddingHorizontal: 0 },
  custom: { flexDirection: 'row', gap: 8 },
  use: { height: 44, paddingHorizontal: 18, borderRadius: radius.small, justifyContent: 'center' },
  arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  calendar: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, height: 44, alignItems: 'center', justifyContent: 'center' },
  day: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
