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

/** Mirrors the rules in the service so the user gets instant feedback. */
function validate(name: string, email: string, password: string) {
  if (name.trim().length < 2) return 'Enter your name';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address';
  if (password.length < 8) return 'Password must be at least 8 characters';
  return null;
}

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const problem = validate(name, email, password);
    if (problem != null) {
      setError(problem);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await signUp({ name, email, password });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong');
      setLoading(false);
    }
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
              <ThemedText style={styles.title}>Create your account</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.tagline}>
                Find teammates and start a call in seconds.
              </ThemedText>
            </View>

            <View style={styles.form}>
              <TextField
                label="Full name"
                value={name}
                onChangeText={setName}
                placeholder="Ada Lovelace"
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
              />

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
                placeholder="At least 8 characters"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="go"
                onSubmitEditing={handleSubmit}
                error={error ?? undefined}
              />

              <PrimaryButton label="Create account" onPress={handleSubmit} loading={loading} />
            </View>

            <View style={styles.footerRow}>
              <ThemedText type="small" themeColor="textSecondary">
                Already have an account?
              </ThemedText>
              <Link href="/(auth)/sign-in" asChild>
                <Pressable
                  style={({ pressed }) => pressed && styles.pressed}
                  accessibilityRole="link"
                  accessibilityLabel="Go to sign in">
                  <ThemedText type="smallBold">Sign in</ThemedText>
                </Pressable>
              </Link>
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
  title: {
    fontFamily: Fonts.rounded,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  tagline: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 22,
  },
  form: {
    gap: Spacing.three,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.6,
  },
});
