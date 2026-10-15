import { Outfit_200ExtraLight, Outfit_300Light, Outfit_400Regular, Outfit_500Medium, useFonts } from '@expo-google-fonts/outfit';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { LockGate } from '@/components/LockGate';
import { colors } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();
// The window behind every screen, so nothing white shows at the edges while screens slide.
SystemUI.setBackgroundColorAsync(colors.background);

/** The navigators' own colors (the default theme is white). */
const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, primary: colors.accent, background: colors.background, card: colors.background, text: colors.ink, border: colors.line },
};

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
    <ThemeProvider value={theme}>
      <KeyboardProvider>
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
      </KeyboardProvider>
    </ThemeProvider>
  );
}
