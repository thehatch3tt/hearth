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

import { ThemeProvider } from '@/components/ThemeProvider';
import { DATABASE_NAME, setUpDatabase } from '@/lib/db';
import { emergency, useTheme } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

/**
 * The tabs (Today, Family, Our home, Share) sit at the bottom of the stack; a person's page, the
 * whole day, editing, settings and the emergency card slide over them. Every screen draws its own
 * header. The splash screen stays up until the fonts and the light/dark choice have loaded.
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

  if (!fontsLoaded && !fontError) return null;

  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={setUpDatabase}>
      <ThemeProvider>
        <Screens />
      </ThemeProvider>
    </SQLiteProvider>
  );
}

function Screens() {
  const { colors, scheme } = useTheme();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="person/[id]" />
        <Stack.Screen name="person/edit" />
        <Stack.Screen name="day" />
        <Stack.Screen
          name="emergency"
          options={{ animation: 'slide_from_bottom', contentStyle: { backgroundColor: emergency.background } }}
        />
        <Stack.Screen name="emergency-edit" />
        <Stack.Screen name="settings" />
      </Stack>
    </>
  );
}
