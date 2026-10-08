import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
  useFonts,
} from '@expo-google-fonts/instrument-sans';
import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { DATABASE_NAME, setUpDatabase } from '@/lib/db';
import { colors, emergency } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

/**
 * The tabs (Today, Family, Our home, Share) sit at the bottom of the stack; a person's page,
 * editing, settings and the emergency card slide over them. Every screen draws its own header.
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
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
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="person/[id]" />
        <Stack.Screen name="person/edit" />
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
