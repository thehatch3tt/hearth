import { router } from 'expo-router';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text as RNText, View, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
import { KeyboardAvoidingView, KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { colors, fonts, type Weight } from '@/lib/theme';

/** Outfit text: light by default, as the look wants. */
export function Text({ weight = 300, size = 16, color = colors.ink, style, ...props }: TextProps & { weight?: Weight; size?: number; color?: string }) {
  return <RNText {...props} style={[{ fontFamily: fonts[weight], fontSize: size, color, lineHeight: Math.round(size * 1.4) }, style]} />;
}

/** A small uppercase label over a group. */
export function Eyebrow({ children, color = colors.faint, style }: { children: ReactNode; color?: string; style?: StyleProp<TextStyle> }) {
  return (
    <Text weight={500} size={12} color={color} style={[{ letterSpacing: 1.2, textTransform: 'uppercase', paddingHorizontal: 4 }, style]}>
      {children}
    </Text>
  );
}

/** The floating tab bar: its height, and how far it sits above the bottom of the screen. */
export const TAB_BAR_HEIGHT = 64;
export const tabBarBottom = (insetsBottom: number) => (insetsBottom > 0 ? insetsBottom - 6 : 12);

/**
 * A page: scrolls (with no scroll bar), clears the status bar, and leaves just enough room at the foot
 * for the floating tab bar (`tabs`) or a bottom bar of buttons (`footer`, kept in view). The field
 * being typed in, and the line being typed, stay above the keyboard.
 */
export function Screen({ children, tabs, footer, gap = 16 }: { children: ReactNode; tabs?: boolean; footer?: ReactNode; gap?: number }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAwareScrollView
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        alwaysBounceVertical={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 18, paddingBottom: tabs ? tabBarBottom(insets.bottom) + TAB_BAR_HEIGHT + 20 : footer ? 20 : insets.bottom + 20, gap }}>
        {children}
      </KeyboardAwareScrollView>
      {footer && <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>{footer}</View>}
    </View>
  );
}

/** What goes inside a bottom sheet's Modal (the backdrop, then the sheet): it rises with the keyboard. */
export function SheetFrame({ children }: { children: ReactNode }) {
  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      {children}
    </KeyboardAvoidingView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** A round icon tile, as used beside rows. */
export function IconTile({ name, size = 34 }: { name: IconName; size?: number }) {
  return (
    <View style={[styles.tile, { width: size, height: size, borderRadius: size * 0.32 }]}>
      <Icon name={name} size={size * 0.53} />
    </View>
  );
}

export function Button({ label, onPress, kind = 'primary', icon, style }: { label: string; onPress: () => void; kind?: 'primary' | 'outline' | 'quiet'; icon?: IconName; style?: StyleProp<ViewStyle> }) {
  const color = kind === 'primary' ? colors.onAccent : kind === 'outline' ? colors.ink : colors.muted;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, kind === 'primary' && { backgroundColor: colors.accent }, kind === 'outline' && styles.outline, kind === 'quiet' && { height: 44 }, pressed && { opacity: 0.7 }, style]}>
      {icon && <Icon name={icon} size={18} color={color} strokeWidth={1.9} />}
      <Text weight={kind === 'primary' ? 500 : 400} size={kind === 'quiet' ? 16 : 17} color={color}>
        {label}
      </Text>
    </Pressable>
  );
}

/** An on/off switch drawn in the look (the system one is green). */
export function Toggle({ value, onChange, label }: { value: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      onPress={() => onChange(!value)}
      hitSlop={6}
      style={[styles.toggle, { backgroundColor: value ? colors.accent : colors.selected, alignItems: value ? 'flex-end' : 'flex-start' }]}>
      <View style={[styles.knob, { backgroundColor: value ? colors.background : colors.muted }]} />
    </Pressable>
  );
}

/** Two or three choices side by side, one picked, as pills. */
export function Segmented<T extends string | number>({ options, value, onChange, label }: { options: { value: T; label: string }[]; value: T; onChange: (value: T) => void; label: string }) {
  return (
    <View accessibilityRole="tablist" accessibilityLabel={label} style={styles.segmented}>
      {options.map((option) => {
        const on = option.value === value;
        return (
          <Pressable key={String(option.value)} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => onChange(option.value)} style={[styles.segment, on && { backgroundColor: colors.selected }]}>
            <Text weight={on ? 500 : 400} size={15} color={on ? colors.ink : colors.muted}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** A round back button. */
export function BackButton({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))} style={styles.round}>
      <Icon name="back" size={18} color={colors.ink} strokeWidth={2} />
    </Pressable>
  );
}

/** Step dots for the welcome. */
export function Dots({ step, total }: { step: number; total: number }) {
  return (
    <View accessibilityLabel={`Step ${step} of ${total}`} style={{ flexDirection: 'row', gap: 6 }}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={{ width: i + 1 === step ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i + 1 === step ? colors.accent : colors.outline }} />
      ))}
    </View>
  );
}

/** A tappable row inside a card: icon, words, and an arrow. */
export function Row({ icon, title, note, right, onPress, first }: { icon?: IconName; title: string; note?: string; right?: ReactNode; onPress?: () => void; first?: boolean }) {
  const body = (
    <>
      {icon && <IconTile name={icon} />}
      <View style={{ flex: 1, gap: 1 }}>
        <Text size={16} weight={400}>
          {title}
        </Text>
        {note ? (
          <Text size={13} color={colors.faint}>
            {note}
          </Text>
        ) : null}
      </View>
      {right}
      {onPress && <Icon name="chevron" size={16} color="#5E5A6B" strokeWidth={2} />}
    </>
  );
  const style = [styles.row, !first && styles.rowLine];
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [style, pressed && { backgroundColor: colors.raised }]}>
      {body}
    </Pressable>
  ) : (
    <View style={style}>{body}</View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 20, overflow: 'hidden' },
  tile: { backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' },
  button: { height: 52, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18 },
  outline: { borderWidth: 1, borderColor: colors.outline },
  toggle: { width: 51, height: 31, borderRadius: 16, padding: 2, justifyContent: 'center' },
  knob: { width: 27, height: 27, borderRadius: 14 },
  segmented: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 999, padding: 4, gap: 4 },
  segment: { flex: 1, height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  round: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  rowLine: { borderTopWidth: 1, borderTopColor: colors.line },
  footer: { paddingHorizontal: 18, paddingTop: 12, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.line, flexDirection: 'row', gap: 10 },
});
