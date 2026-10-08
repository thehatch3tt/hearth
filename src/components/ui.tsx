/** The small pieces every screen is built from, in the Editorial look (lib/theme.ts). */
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  type PressableProps,
  ScrollView,
  StyleSheet,
  Text as RNText,
  type TextProps,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassButton, GlassIconButton } from '@/components/Glass';
import { Icon, type IconName } from '@/components/Icon';
import { colors, fonts, personColor, radius, serif, TAB_BAR_SPACE, type Weight } from '@/lib/theme';
import { formatTime } from '@/lib/time';

/** A light tap under the finger when something is ticked off or chosen. */
export function tap() {
  if (Platform.OS === 'android') Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm).catch(() => {});
  else if (Platform.OS === 'ios') Haptics.selectionAsync().catch(() => {});
}

/**
 * Text in Instrument Sans. `serif` sets it in Instrument Serif (headlines, names, times), which has
 * one weight, so `weight` is ignored for it; `italic` picks its italic.
 */
export function Text({
  weight = 500,
  size = 15,
  color = colors.ink,
  serif: useSerif = false,
  italic = false,
  style,
  ...props
}: TextProps & { weight?: Weight; size?: number; color?: string; serif?: boolean; italic?: boolean }) {
  const family = useSerif ? (italic ? serif.italic : serif.regular) : fonts[weight];
  return <RNText {...props} style={[{ fontFamily: family, fontSize: size, color }, style]} />;
}

/** A small-caps label, widely spaced like a magazine's ("COMFORT", "READ THIS TO THE OPERATOR"). */
export function Label({ children, color = colors.muted, numberOfLines }: { children: ReactNode; color?: string; numberOfLines?: number }) {
  return (
    <Text weight={700} size={11} color={color} numberOfLines={numberOfLines} style={styles.label}>
      {children}
    </Text>
  );
}

/**
 * The strip at the top of every page, like a magazine's running head: a small-caps line over a
 * black rule, with a glass back button on the left of a sub-page and a button on the right.
 */
export function Masthead({
  label,
  back = false,
  right,
  color = colors.ink,
  rule = colors.ink,
}: {
  label: string;
  back?: boolean;
  right?: ReactNode;
  color?: string;
  rule?: string;
}) {
  return (
    <View style={[styles.masthead, { borderBottomColor: rule }]}>
      {back && <GlassIconButton icon="back" label="Back" onPress={() => router.back()} />}
      <Text weight={700} size={11} color={color} numberOfLines={1} style={[styles.label, { flex: 1 }]}>
        {label}
      </Text>
      {right}
    </View>
  );
}

/**
 * A page's title in serif, on one line: a long one shrinks to fit rather than wrapping or running
 * off the edge. `deck` is an italic line under it ("the seventh of October", "6 years old").
 */
export function Title({
  children,
  deck,
  size = 56,
  color = colors.ink,
  deckColor = colors.muted,
}: {
  children: ReactNode;
  deck?: ReactNode;
  size?: number;
  color?: string;
  deckColor?: string;
}) {
  return (
    <View style={styles.title}>
      <Text
        serif
        size={size}
        color={color}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.45}
        style={{ lineHeight: Math.round(size * 1.1), letterSpacing: -size / 60 }}>
        {children}
      </Text>
      {deck ? (
        <Text serif italic size={22} color={deckColor} numberOfLines={2} style={styles.deck}>
          {deck}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * A section of a page: no box, just a black rule across the top, like a magazine. `boxed` is a
 * white rounded card instead, for things that must stand apart (the emergency card's address).
 */
export function Card({ children, style, boxed }: { children: ReactNode; style?: StyleProp<ViewStyle>; boxed?: boolean }) {
  return <View style={[boxed ? styles.box : styles.card, style]}>{children}</View>;
}

/** A scrolling page on the paper background, with room for the phone's notch and home bar. */
export function Screen({
  children,
  header,
  background = colors.background,
  tabBar = false,
}: {
  children: ReactNode;
  /** Drawn edge to edge above the content, scrolling with it. */
  header?: ReactNode;
  background?: string;
  /** A tab page: leaves room so the end can scroll clear of the floating menu bar. */
  tabBar?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: background }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 + (tabBar ? TAB_BAR_SPACE : 0) }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets>
      {header ?? <View style={{ height: insets.top + 8 }} />}
      <View style={styles.screenBody}>{children}</View>
    </ScrollView>
  );
}

/** A solid 44 px circle with an icon (the emergency card's Close; elsewhere it's a glass button). */
export function RoundButton({
  icon,
  label,
  onPress,
  background = colors.card,
  color = colors.ink,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  background?: string;
  color?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.round, { backgroundColor: background }, pressed && styles.pressed]}>
      <Icon name={icon} color={color} strokeWidth={2.2} />
    </Pressable>
  );
}

/** A glass pill with a word on it ("Edit", "Done"). */
export function PillButton({ title, onPress }: { title: string; onPress: () => void }) {
  return <GlassButton title={title} onPress={onPress} height={40} />;
}

/** Main actions in the accent color; `quiet` is an outlined button for lesser ones. */
export function Button({
  title,
  icon,
  quiet,
  color = colors.accent,
  style,
  ...props
}: PressableProps & {
  title: string;
  icon?: IconName;
  quiet?: boolean;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const textColor = quiet ? color : '#FFFFFF';
  return (
    <Pressable
      accessibilityRole="button"
      {...props}
      style={({ pressed }) => [
        styles.button,
        quiet ? { borderWidth: 1, borderColor: color } : { backgroundColor: color },
        pressed && styles.pressed,
        props.disabled && styles.disabled,
        style,
      ]}>
      {icon && <Icon name={icon} size={18} color={textColor} strokeWidth={2.2} />}
      <Text weight={700} size={15} color={textColor} numberOfLines={1}>
        {title}
      </Text>
    </Pressable>
  );
}

/** A text link in the accent color ("+ Add"). */
export function LinkButton({ title, onPress, color = colors.accentText }: { title: string; onPress: () => void; color?: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={10} style={styles.link}>
      {({ pressed }) => (
        <Text weight={700} size={14} color={color} style={pressed && styles.pressed}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

/** A person's initial in a circle of their color. */
export function Avatar({ name, color, size = 46, solid }: { name: string; color: string; size?: number; solid?: boolean }) {
  const c = personColor(color);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: solid ? c.strong : c.soft,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text serif size={size * 0.5} color={solid ? '#FFFFFF' : c.strong} style={{ lineHeight: size * 0.6 }}>
        {name.trim().charAt(0).toUpperCase() || '?'}
      </Text>
    </View>
  );
}

/** A section's small-caps heading, with a note or link on the right ("2 of 3 given"). */
export function SectionTitle({ title, right, color }: { title: string; right?: ReactNode; color?: string }) {
  return (
    <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'baseline' }]}>
      <Text weight={700} size={11} color={color} numberOfLines={1} style={[styles.label, { flexShrink: 1 }]}>
        {title}
      </Text>
      {typeof right === 'string' ? (
        <Text weight={600} size={12} color={colors.muted}>
          {right}
        </Text>
      ) : (
        right
      )}
    </View>
  );
}

/** A thin rule between rows. */
export function Hairline() {
  return <View style={styles.hairline} />;
}

/** The square box beside something to tick off; inked in once it's done. */
export function TickBox({ checked, color = colors.ink }: { checked: boolean; color?: string }) {
  return (
    <View style={[styles.tick, { borderColor: checked ? colors.ink : color }, checked && styles.ticked]}>
      {checked && <Icon name="check" size={13} color="#FFFFFF" strokeWidth={3} />}
    </View>
  );
}

/**
 * One thing to tick off (a medicine, a routine step): an italic time, what it is, a line under it,
 * an optional small-caps note on the right, and the box. The whole row is the button.
 */
export function CheckRow({
  time,
  title,
  note,
  detail,
  detailColor = colors.muted,
  aside,
  checked,
  boxColor,
  label,
  onPress,
}: {
  /** "HH:MM", or empty for no set time. */
  time: string;
  title: string;
  /** Shown after the title, lighter ("likes bubbles"). */
  note?: string;
  /** A line under the title ("Given by Sam at 8:02 am"). */
  detail?: string;
  detailColor?: string;
  /** Small caps on the right (whose it is, on Today). */
  aside?: string;
  checked: boolean;
  /** The box's edge, to show it's due. */
  boxColor?: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.checkRow, pressed && styles.pressed]}>
      <Text serif italic size={20} color={colors.muted} numberOfLines={1} style={styles.time}>
        {time ? formatTime(time).slice(0, -3) : '—'}
        {time ? (
          <Text serif italic size={14} color={colors.muted}>
            {formatTime(time).slice(-3)}
          </Text>
        ) : null}
      </Text>
      <View style={{ flex: 1, gap: 1 }}>
        <Text weight={600} size={16} color={checked ? colors.muted : colors.ink} style={checked && styles.struck}>
          {title}
          {note ? (
            <Text weight={400} size={16} color={colors.muted}>
              {` — ${note}`}
            </Text>
          ) : null}
        </Text>
        {detail ? (
          <Text weight={600} size={13} color={detailColor}>
            {detail}
          </Text>
        ) : null}
      </View>
      {aside ? (
        <Text weight={700} size={11} color={colors.muted} numberOfLines={1} style={[styles.label, styles.aside]}>
          {aside}
        </Text>
      ) : null}
      <TickBox checked={checked} color={boxColor} />
    </Pressable>
  );
}

/** Two or three choices side by side, one picked ("A child" / "An adult I care for"). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segments}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => {
              if (selected) return;
              tap();
              onChange(option.value);
            }}
            style={[styles.segment, selected && styles.segmentSelected]}>
            <Text
              weight={selected ? 700 : 600}
              size={14}
              color={selected ? colors.ink : colors.muted}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * A text box that saves when you leave it (or press return on a single line). It keeps its own
 * text while you type, so give it a `key` that changes if the saved row changes underneath it.
 */
export function SavedInput({
  value,
  onSave,
  style,
  ...props
}: Omit<TextInputProps, 'value' | 'onChangeText'> & { value: string; onSave: (text: string) => void }) {
  const [text, setText] = useState(value);
  // The text last handed to onSave, so the same text isn't saved twice.
  const handled = useRef(value);
  const save = () => {
    if (text !== handled.current) {
      handled.current = text;
      onSave(text);
    }
  };
  // Also saves if the screen closes while you're still typing (a swipe back doesn't always blur).
  const latest = useRef({ text, onSave });
  useEffect(() => {
    latest.current = { text, onSave };
  });
  useEffect(
    () => () => {
      const last = latest.current;
      if (last.text !== handled.current) last.onSave(last.text);
    },
    [],
  );
  return (
    <TextInput
      placeholderTextColor={colors.faint}
      {...props}
      value={text}
      onChangeText={setText}
      onBlur={save}
      onSubmitEditing={props.multiline ? undefined : save}
      style={[styles.input, props.multiline && styles.multiline, style]}
    />
  );
}

/** A small-caps label over a text box. */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Label>{label}</Label>
      {children}
      {hint ? (
        <Text size={13} color={colors.muted} style={{ lineHeight: 18 }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { letterSpacing: 2, textTransform: 'uppercase' },
  masthead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  title: { gap: 0, marginTop: -4 },
  deck: { lineHeight: 27, paddingRight: 4 },
  card: { borderTopWidth: 1, borderTopColor: colors.ink, paddingTop: 10, gap: 10 },
  box: { backgroundColor: colors.card, borderRadius: radius.card, padding: 18, gap: 12 },
  screenBody: { paddingHorizontal: 20, gap: 22 },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  button: {
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  link: { alignSelf: 'flex-start', paddingVertical: 6 },
  hairline: { height: 1, backgroundColor: colors.track },
  tick: { width: 22, height: 22, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  ticked: { backgroundColor: colors.ink },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingVertical: 6 },
  time: { width: 64 },
  aside: { maxWidth: 96 },
  struck: { textDecorationLine: 'line-through' },
  segments: { flexDirection: 'row', backgroundColor: colors.chip, borderRadius: 12, padding: 3 },
  segment: { flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  segmentSelected: { backgroundColor: colors.card, boxShadow: '0 1px 3px rgba(20, 20, 20, 0.14)' },
  input: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: fonts[500],
    fontSize: 16,
    color: colors.ink,
  },
  multiline: { minHeight: 76, textAlignVertical: 'top' },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.4 },
});
