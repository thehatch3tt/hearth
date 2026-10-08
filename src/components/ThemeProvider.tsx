/**
 * Applies the light or dark colors: the phone's own setting, unless Settings picks one. Holds the
 * splash screen until the choice has loaded, so the app doesn't flash the wrong colors.
 */
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { type ReactNode, useEffect, useMemo } from 'react';
import { Appearance, useColorScheme } from 'react-native';

import { useQuery } from '@/lib/db';
import { makeTheme, type Scheme, ThemeContext } from '@/lib/theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const rows = useQuery<{ value: string }>("SELECT value FROM settings WHERE key = 'appearance'");
  const choice = rows?.[0]?.value;
  const forced: Scheme | null = choice === 'light' || choice === 'dark' ? choice : null;
  const system = useColorScheme();
  const scheme: Scheme = forced ?? (system === 'dark' ? 'dark' : 'light');
  const theme = useMemo(() => makeTheme(scheme), [scheme]);
  const loaded = rows !== undefined;

  // Also sets the keyboard, alerts and Liquid Glass to match.
  useEffect(() => {
    Appearance.setColorScheme(forced ?? 'unspecified');
  }, [forced]);

  // The color behind every screen, seen during transitions and the keyboard opening.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.background).catch(() => {});
  }, [theme]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;
  return <ThemeContext value={theme}>{children}</ThemeContext>;
}
