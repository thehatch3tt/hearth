/**
 * The menu bar: a glass pill floating over the bottom of the page with the four tabs, and the
 * Emergency button as its own red glass circle beside it. Emergency opens the emergency card; it
 * never calls anyone by itself (Call 911 is a separate, large button on the card).
 */
import { router, type Tabs } from 'expo-router';
import { type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glass } from '@/components/Glass';
import { Icon, type IconName } from '@/components/Icon';
import { Text } from '@/components/ui';
import { colors, tabBar } from '@/lib/theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

/** The tabs, by route name, in the order the layout lists them. */
const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Today', icon: 'calendar' },
  family: { label: 'Family', icon: 'people' },
  house: { label: 'Our home', icon: 'home' },
  share: { label: 'Share', icon: 'share' },
};

export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom - 8, 14) }]}>
      <Glass style={styles.bar}>
        {state.routes.map((route, index) => {
          const tab = TABS[route.name];
          if (!tab) return null;
          const focused = state.index === index;
          const color = focused ? colors.accent : colors.ink;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.label}
              onPress={onPress}
              style={({ pressed }) => [styles.tab, focused && styles.current, pressed && styles.pressed]}>
              <Icon name={tab.icon} size={21} color={color} strokeWidth={1.9} />
              <Text weight={700} size={11} color={color}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </Glass>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Emergency"
        accessibilityHint="Opens the emergency card"
        onPress={() => router.push('/emergency')}
        style={({ pressed }) => pressed && styles.pressed}>
        <Glass tint={colors.danger} interactive style={styles.emergency}>
          <Icon name="phone" size={24} color="#FFFFFF" strokeWidth={2.1} />
        </Glass>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: tabBar.gap },
  bar: {
    flex: 1,
    height: tabBar.height,
    borderRadius: tabBar.height / 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tab: { flex: 1, height: tabBar.height - 12, borderRadius: (tabBar.height - 12) / 2, alignItems: 'center', justifyContent: 'center', gap: 2 },
  current: { backgroundColor: 'rgba(20, 20, 20, 0.07)' },
  emergency: { width: tabBar.height, height: tabBar.height, borderRadius: tabBar.height / 2, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.7 },
});
