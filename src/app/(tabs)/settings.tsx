import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Fonts, MaxContentWidth, Radius, Shadows, Spacing, TopBarInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/providers/auth-provider';
import { useSocial } from '@/providers/social-provider';

type SettingRowProps = {
  icon: { ios: any; android: any; web: any };
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  showChevron?: boolean;
};

function SettingRow({ icon, label, value, onPress, destructive, showChevron }: SettingRowProps) {
  const theme = useTheme();
  const textColor = destructive ? theme.danger : theme.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}
      style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
      <ThemedView type="card" style={styles.row}>
        <SymbolView name={icon} size={20} tintColor={textColor} />
        <ThemedText style={[styles.rowLabel, { color: textColor }]}>{label}</ThemedText>
        <View style={styles.rowTrailing}>
          {value && (
            <ThemedText themeColor="textSecondary" style={styles.rowValue}>
              {value}
            </ThemedText>
          )}
          {showChevron && (
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              size={14}
              tintColor={theme.textSecondary}
            />
          )}
        </View>
      </ThemedView>
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      <ThemedView type="card" style={styles.sectionCard}>
        {children}
      </ThemedView>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { user, signOut } = useAuth();
  const { clearCallHistory } = useSocial();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  function handleSignOut() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => void signOut(),
      },
    ]);
  }

  function handleClearHistory() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Clear call history', 'This will permanently delete all call records.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => void clearCallHistory(),
      },
    ]);
  }

  function toggleNotifications() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotificationsEnabled((prev) => !prev);
  }

  function toggleHaptics() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHapticsEnabled((prev) => !prev);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <ScreenHeader title="Settings" />

          <Section title="Account">
            <SettingRow
              icon={{ ios: 'person.circle', android: 'account_circle', web: 'account_circle' }}
              label="Edit profile"
              showChevron
              onPress={() => router.push('/profile' as any)}
            />
            <SettingRow
              icon={{ ios: 'envelope', android: 'email', web: 'email' }}
              label="Email"
              value={user?.email}
            />
          </Section>

          <Section title="Preferences">
            <SettingRow
              icon={{ ios: 'bell', android: 'notifications', web: 'notifications' }}
              label="Push notifications"
              value={notificationsEnabled ? 'On' : 'Off'}
              onPress={toggleNotifications}
            />
            <SettingRow
              icon={{ ios: 'iphone.radiowaves.left.and.right', android: 'vibration', web: 'vibration' }}
              label="Haptic feedback"
              value={hapticsEnabled ? 'On' : 'Off'}
              onPress={toggleHaptics}
            />
          </Section>

          <Section title="Calls">
            <SettingRow
              icon={{ ios: 'clock.arrow.circlepath', android: 'history', web: 'history' }}
              label="Clear call history"
              onPress={handleClearHistory}
            />
          </Section>

          <Section title="About">
            <SettingRow
              icon={{ ios: 'info.circle', android: 'info', web: 'info' }}
              label="Version"
              value="1.0.0"
            />
            <SettingRow
              icon={{ ios: 'questionmark.circle', android: 'help', web: 'help' }}
              label="Help & FAQ"
              showChevron
              onPress={() => router.push('/help')}
            />
            <SettingRow
              icon={{ ios: 'doc.text', android: 'description', web: 'description' }}
              label="Privacy policy"
              showChevron
              onPress={() => {}}
            />
            <SettingRow
              icon={{ ios: 'doc.text', android: 'description', web: 'description' }}
              label="Terms of service"
              showChevron
              onPress={() => {}}
            />
          </Section>

          <Section title="Session">
            <SettingRow
              icon={{ ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' }}
              label="Sign out"
              destructive
              onPress={handleSignOut}
            />
          </Section>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: TopBarInset,
    maxWidth: MaxContentWidth,
  },
  contentScroll: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingBottom: BottomTabInset + Spacing.four,
  },
  section: {
    alignSelf: 'stretch',
    marginBottom: Spacing.five,
  },
  sectionTitle: {
    marginBottom: Spacing.two,
    marginLeft: Spacing.one,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCard: {
    borderRadius: Radius.large,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  rowLabel: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  rowTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  rowValue: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});
