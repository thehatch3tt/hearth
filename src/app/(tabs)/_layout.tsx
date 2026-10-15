import { Redirect, Tabs } from 'expo-router';

import { TabBar } from '@/components/TabBar';
import { useData } from '@/lib/store';
import { colors } from '@/lib/theme';

/** The three tabs (family and settings are on app/you, from Home). Someone new sees the welcome first. */
export default function TabsLayout() {
  const { welcomed } = useData();
  if (!welcomed) return <Redirect href="/welcome" />;
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="handbook" options={{ title: 'Handbook' }} />
      <Tabs.Screen name="letters" options={{ title: 'Letters' }} />
    </Tabs>
  );
}
