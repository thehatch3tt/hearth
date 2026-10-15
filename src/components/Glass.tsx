/**
 * A floating pill of glass, for the tab bar and a page's tool bar: Apple's Liquid Glass on iOS 26 and
 * later, a frosted plum with a soft shadow elsewhere.
 */
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { type ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

const glass = Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

export function GlassPill({ children, height, style }: { children: ReactNode; height: number; style?: StyleProp<ViewStyle> }) {
  const shape = { borderRadius: height / 2 };
  return (
    <View style={[{ height }, styles.row, style]}>
      {glass ? <GlassView glassEffectStyle="regular" colorScheme="dark" style={[StyleSheet.absoluteFill, shape]} /> : <View style={[StyleSheet.absoluteFill, shape, styles.frosted]} />}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  frosted: {
    backgroundColor: 'rgba(32,30,41,0.94)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
});
