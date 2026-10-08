import { Tabs } from 'expo-router';

import { TabBar } from '@/components/TabBar';
import { colors } from '@/lib/theme';

/** The four tabs, with the floating glass menu bar (components/TabBar.tsx) instead of the stock one. */
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}>
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="family" options={{ title: 'Family' }} />
      <Tabs.Screen name="house" options={{ title: 'Our home' }} />
      <Tabs.Screen name="share" options={{ title: 'Share' }} />
    </Tabs>
  );
}
