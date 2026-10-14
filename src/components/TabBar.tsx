/** The bottom menu: Home, Handbook, Family, Letters, Settings, the current one in champagne. */
import { type Tabs } from 'expo-router';
import { type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { Text } from '@/components/ui';
import { colors } from '@/lib/theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Home', icon: 'home' },
  handbook: { label: 'Handbook', icon: 'book' },
  family: { label: 'Family', icon: 'people' },
  letters: { label: 'Letters', icon: 'mail' },
  settings: { label: 'Settings', icon: 'settings' },
};

export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === index;
        const color = focused ? colors.accent : colors.faint;
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
            style={styles.tab}>
            <Icon name={tab.icon} size={24} color={color} />
            <Text weight={500} size={11} color={color}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8, backgroundColor: colors.bar, borderTopWidth: 1, borderTopColor: colors.line },
  tab: { width: 68, alignItems: 'center', gap: 3, paddingVertical: 2 },
});
