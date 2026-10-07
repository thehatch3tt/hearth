/** The small pieces every screen is built from, in the mockups' look. */
import { router } from 'expo-router';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
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

import { Icon, type IconName } from '@/components/Icon';
import { colors, fonts, personColor, radius, type Weight } from '@/lib/theme';

export function Text({
  weight = 500,
  size = 15,
  color = colors.ink,
  style,
  ...props
}: TextProps & { weight?: Weight; size?: number; color?: string }) {
  return (
    <RNText
      {...props}
      style={[{ fontFamily: fonts[weight], fontSize: size, color }, style]}
    />
  );
}

/** A small uppercase label ("COMFORT", "READ THIS TO THE OPERATOR"). */
export function Label({ children, color = colors.muted }: { children: ReactNode; color?: string }) {
  return (
    <Text weight={700} size={12} color={color} style={styles.label}>
      {children}
    </Text>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** A scrolling page on the gray background, with room for the phone's notch and home bar. */
export function Screen({
  children,
  header,
  background = colors.background,
}: {
  children: ReactNode;
  /** Drawn edge to edge above the content, scrolling with it. */
  header?: ReactNode;
  background?: string;
}) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: background }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets>
      {header ?? <View style={{ height: insets.top + 12 }} />}
      <View style={styles.screenBody}>{children}</View>
    </ScrollView>
  );
}

/** A colored band at the top of a person's page or a sub-page, with a round back button. */
export function PageHeader({
  background = colors.background,
  right,
  children,
}: {
  background?: string;
  right?: ReactNode;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.pageHeader, { backgroundColor: background, paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        <RoundButton icon="back" label="Back" onPress={() => router.back()} />
        <View style={{ flex: 1 }} />
        {right}
      </View>
      {children}
    </View>
  );
}

/** A white 44 px circle with an icon. */
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

/** A white pill with a word on it ("Edit", "Done"). */
export function PillButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.pill, pressed && styles.pressed]}>
      <Text weight={700} size={14}>
        {title}
      </Text>
    </Pressable>
  );
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
        quiet ? { borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card } : { backgroundColor: color },
        (pressed || props.disabled) && styles.pressed,
        style,
      ]}>
      {icon && <Icon name={icon} size={18} color={textColor} strokeWidth={2.2} />}
      <Text weight={700} size={15} color={textColor}>
        {title}
      </Text>
    </Pressable>
  );
}

/** A text link in the accent color ("+ Add"). */
export function LinkButton({ title, onPress, color = colors.accentText }: { title: string; onPress: () => void; color?: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={10}>
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
      <Text weight={800} size={size * 0.38} color={solid ? '#FFFFFF' : c.strong}>
        {name.trim().charAt(0).toUpperCase() || '?'}
      </Text>
    </View>
  );
}

/** A small tag. */
export function Chip({ title, background = colors.chip, color = colors.chipText, strong }: { title: string; background?: string; color?: string; strong?: boolean }) {
  return (
    <View style={[styles.chip, { backgroundColor: background }]}>
      <Text weight={strong ? 700 : 600} size={12} color={color} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

export function SectionTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={[styles.row, { justifyContent: 'space-between' }]}>
      <Text weight={800} size={16}>
        {title}
      </Text>
      {right}
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

/** A label over a text box. */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text weight={700} size={13} color={colors.muted}>
        {label}
      </Text>
      {children}
      {hint ? (
        <Text size={12} color={colors.muted}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { letterSpacing: 0.7, textTransform: 'uppercase' },
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: 16, gap: 12 },
  screenBody: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  pageHeader: { paddingHorizontal: 20, paddingBottom: 20, gap: 16 },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  pill: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, flexShrink: 1 },
  input: {
    minHeight: 44,
    borderRadius: radius.small,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts[500],
    fontSize: 15,
    color: colors.ink,
  },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  pressed: { opacity: 0.6 },
});
