import { Redirect } from 'expo-router';

import AppTabs from '@/components/app-tabs';
import { useAuth } from '@/providers/auth-provider';

/** Signed-out visitors are pushed to sign in and never see the tabs. */
export default function TabsLayout() {
  const { status } = useAuth();

  if (status === 'signed-out') {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <AppTabs />;
}
