import { Outfit_200ExtraLight, Outfit_300Light, Outfit_400Regular, Outfit_500Medium, useFonts } from '@expo-google-fonts/outfit';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { LockGate } from '@/components/LockGate';
import { colors } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

/**
 * Left in Love: the welcome (first time only), the tabs, and the screens that slide over them
 * (writing a page or a letter, and the preview of what your family will see), behind the lock if it's on.
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Outfit_200ExtraLight, Outfit_300Light, Outfit_400Regular, Outfit_500Medium });
  const ready = fontsLoaded || fontError;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <LockGate>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="welcome" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="page/[id]" />
        <Stack.Screen name="letter/[id]" />
        <Stack.Screen name="preview" />
      </Stack>
    </LockGate>
  );
}
