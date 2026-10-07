import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from '@expo-google-fonts/nunito';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { DATABASE_NAME, setUpDatabase } from '@/lib/db';
import { colors, emergency } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

/** Every screen draws its own header (the colored bands in the mockups), so the stack shows none. */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={setUpDatabase}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" options={{ title: 'Home' }} />
        <Stack.Screen name="person/[id]" />
        <Stack.Screen name="person/edit" />
        <Stack.Screen name="house" />
        <Stack.Screen
          name="emergency"
          options={{ animation: 'slide_from_bottom', contentStyle: { backgroundColor: emergency.background } }}
        />
        <Stack.Screen name="emergency-edit" />
        <Stack.Screen name="settings" />
      </Stack>
    </SQLiteProvider>
  );
}
