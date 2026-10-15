/**
 * The bottom menu: Home, Handbook and Letters, floating in a glass pill over the page, the current one
 * in champagne on a soft pill of its own. Family and settings are behind your initial on Home (app/you).
 */
import { type Tabs } from 'expo-router';
import { type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassPill } from '@/components/Glass';
import { Icon, type IconName } from '@/components/Icon';
import { TAB_BAR_HEIGHT, Text, tabBarBottom } from '@/components/ui';
import { colors } from '@/lib/theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Home', icon: 'home' },
  handbook: { label: 'Handbook', icon: 'book' },
  letters: { label: 'Letters', icon: 'mail' },
};

export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: tabBarBottom(insets.bottom) }]}>
      <GlassPill height={TAB_BAR_HEIGHT} style={styles.bar}>
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
      </GlassPill>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  bar: { width: 288, paddingHorizontal: 6, gap: 2 },
  tab: { flex: 1, height: TAB_BAR_HEIGHT - 12, borderRadius: (TAB_BAR_HEIGHT - 12) / 2, alignItems: 'center', justifyContent: 'center', gap: 2 },
  current: { backgroundColor: 'rgba(214,183,126,0.14)' },
});
