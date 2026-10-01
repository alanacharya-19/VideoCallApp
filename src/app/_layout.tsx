import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import type { ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { SocialProvider } from '@/providers/social-provider';

/**
 * While the session is being restored there is nothing to show, and rendering
 * the app first would flash the sign-in screen at a signed-in user.
 */
function Gate({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === 'loading') return null;
  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <SafeAreaProvider>
      <ThemeProvider value={theme}>
        <AuthProvider>
          <SocialProvider>
            <Gate>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: theme.colors.background },
                }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="call/[id]"
                  options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }}
                />
                <Stack.Screen
                  name="incoming-call"
                  options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }}
                />

              </Stack>
            </Gate>
          </SocialProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
