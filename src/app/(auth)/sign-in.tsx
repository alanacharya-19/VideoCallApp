import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';
import { DEMO_PASSWORD } from '@/services';

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      await signIn({ email, password });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong');
      setLoading(false);
    }
  }

  function useDemoAccount() {
    setEmail('ada@meetnow.app');
    setPassword(DEMO_PASSWORD);
    setError(null);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <View style={styles.hero}>
              <ThemedText style={styles.wordmark}>
                Meet
                <ThemedText themeColor="textSecondary">Now</ThemedText>
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.tagline}>
                Sign in to call the people you work with.
              </ThemedText>
            </View>

            <View style={styles.form}>
              <TextField
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@company.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
              />

              <TextField
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={handleSubmit}
                error={error ?? undefined}
              />

              <PrimaryButton label="Sign in" onPress={handleSubmit} loading={loading} />
            </View>

            <View style={styles.footer}>
              <Pressable
                onPress={useDemoAccount}
                accessibilityRole="button"
                accessibilityLabel="Fill demo account details"
                style={({ pressed }) => pressed && styles.pressed}>
                <ThemedText type="small" themeColor="textSecondary">
                  Use a demo account
                </ThemedText>
              </Pressable>

              <View style={styles.footerRow}>
                <ThemedText type="small" themeColor="textSecondary">
                  New here?
                </ThemedText>
                <Link href="/(auth)/sign-up" asChild>
                  <Pressable
                    style={({ pressed }) => pressed && styles.pressed}
                    accessibilityRole="link"
                    accessibilityLabel="Create an account">
                    <ThemedText type="smallBold">Create an account</ThemedText>
                  </Pressable>
                </Link>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    gap: Spacing.five,
  },
  hero: {
    gap: Spacing.two,
  },
  wordmark: {
    fontFamily: Fonts.rounded,
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '800',
    letterSpacing: -1,
  },
  tagline: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 22,
  },
  form: {
    gap: Spacing.three,
  },
  footer: {
    gap: Spacing.three,
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.6,
  },
});
