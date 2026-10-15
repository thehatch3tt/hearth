/**
 * The bottom menu: Home, Handbook, Family, Letters, Settings, floating in a glass pill over the page,
 * the current one in champagne on a soft pill of its own. Apple's Liquid Glass on iOS 26 and later; a
 * frosted plum elsewhere.
 */
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { type Tabs } from 'expo-router';
import { type ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { TAB_BAR_HEIGHT, Text, tabBarBottom } from '@/components/ui';
import { colors } from '@/lib/theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Home', icon: 'home' },
  handbook: { label: 'Handbook', icon: 'book' },
  family: { label: 'Family', icon: 'people' },
  letters: { label: 'Letters', icon: 'mail' },
  settings: { label: 'Settings', icon: 'settings' },
};

const glass = Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { bottom: tabBarBottom(insets.bottom) }]}>
      {glass ? <GlassView glassEffectStyle="regular" colorScheme="dark" style={[StyleSheet.absoluteFill, styles.shape]} /> : <View style={[StyleSheet.absoluteFill, styles.shape, styles.frosted]} />}
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === index;
        const color = focused ? colors.accent : colors.muted;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
            }}
            style={[styles.tab, focused && styles.current]}>
            <Icon name={tab.icon} size={22} color={color} strokeWidth={focused ? 2 : 1.7} />
            <Text weight={500} size={10} color={color} style={{ lineHeight: 13 }}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, height: TAB_BAR_HEIGHT, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, gap: 2 },
  shape: { borderRadius: TAB_BAR_HEIGHT / 2 },
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
  tab: { flex: 1, height: TAB_BAR_HEIGHT - 12, borderRadius: (TAB_BAR_HEIGHT - 12) / 2, alignItems: 'center', justifyContent: 'center', gap: 2 },
  current: { backgroundColor: 'rgba(214,183,126,0.14)' },
});
