/**
 * Liquid glass for buttons and the menu bar that float over the page. On iOS 26 and later it's
 * Apple's real glass (expo-glass-effect); elsewhere (Android, older iPhones) it's a frosted
 * off-white surface with a thin edge and a soft shadow, so the look holds without the effect.
 */
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { type ReactNode } from 'react';
import { Platform, Pressable, Text, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { colors, fonts } from '@/lib/theme';

/** Some early iOS 26 builds report glass but crash using it, so both checks must pass. */
export const hasLiquidGlass = Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

export function Glass({
  tint,
  interactive,
  style,
  children,
}: {
  /** A color to tint the glass (the red Emergency button). */
  tint?: string;
  /** Lets iOS glass react to touch. */
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  if (hasLiquidGlass) {
    return (
      <GlassView glassEffectStyle="regular" colorScheme="light" tintColor={tint} isInteractive={interactive} style={style}>
        {children}
      </GlassView>
    );
  }
  return <View style={[styles.frost, tint ? { backgroundColor: tint, borderColor: tint } : null, style]}>{children}</View>;
}

/**
 * A glass pill with a word on it ("Mark it given →", "Edit", "Done"). Its text is plain React
 * Native text, so this file doesn't import components/ui.tsx (which imports it).
 */
export function GlassButton({
  title,
  onPress,
  color = colors.ink,
  height = 44,
}: {
  title: string;
  onPress: () => void;
  color?: string;
  height?: number;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={(44 - height) / 2 + 2} style={({ pressed }) => [styles.self, pressed && styles.pressed]}>
      <Glass interactive style={[styles.pill, { height, borderRadius: height / 2 }]}>
        <Text style={[styles.title, { color }]}>{title}</Text>
      </Glass>
    </Pressable>
  );
}

/** A glass circle with an icon (Settings). */
export function GlassIconButton({ icon, label, onPress, size = 40 }: { icon: IconName; label: string; onPress: () => void; size?: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={(44 - size) / 2 + 2}
      style={({ pressed }) => pressed && styles.pressed}>
      <Glass interactive style={[styles.round, { width: size, height: size, borderRadius: size / 2 }]}>
        <Icon name={icon} size={18} strokeWidth={1.9} />
      </Glass>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frost: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(20, 20, 20, 0.12)',
    shadowColor: '#141414',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  self: { alignSelf: 'flex-start' },
  pill: { paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts[700], fontSize: 15 },
  round: { alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.7 },
});
