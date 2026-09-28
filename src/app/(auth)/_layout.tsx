import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/providers/auth-provider';

/** Signed-out visitors are pushed to sign in and can never see the tabs. */
export default function AuthLayout() {
  const { status } = useAuth();

  if (status === 'signed-in') {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}
