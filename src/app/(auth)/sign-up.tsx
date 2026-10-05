import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedButton } from '@/components/animated-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';

const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(30);

  Animated.useAnimatedReaction(
    () => true,
    () => {
      logoOpacity.value = withTiming(1, { duration: 600 });
      logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });
      formOpacity.value = withTiming(1, { duration: 600 });
      formTranslateY.value = withSpring(0, { damping: 15, stiffness: 80 });
    },
    []
  );

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  async function handleSubmit() {
    if (name.trim().length < 2) {
      setError('Please enter your name');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await signUp({ name: name.trim(), email: email.trim(), password });
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
            <AnimatedThemedView style={[styles.hero, logoStyle]}>
              <View style={styles.logoContainer}>
                <Animated.View style={[styles.logoCircle, logoStyle]}>
                  <ThemedText style={styles.logoText}>M</ThemedText>
                </Animated.View>
              </View>
              <ThemedText style={styles.wordmark}>
                Create account
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.tagline}>
                Join MeetNow and start calling.
              </ThemedText>
            </AnimatedThemedView>

            <Animated.View style={[styles.form, formStyle]}>
              <TextField
                label="Full name"
                value={name}
                onChangeText={setName}
                placeholder="John Doe"
                autoCapitalize="words"
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
                placeholder="••••••••"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="go"
                onSubmitEditing={handleSubmit}
                error={error ?? undefined}
              />

              <AnimatedButton label="Create account" onPress={handleSubmit} loading={loading} />
            </Animated.View>

            <View style={styles.footer}>
              <View style={styles.footerRow}>
                <ThemedText type="small" themeColor="textSecondary">
                  Already have an account?
                </ThemedText>
                <Link href="/(auth)/sign-in" asChild>
                  <Pressable
                    style={({ pressed }) => pressed && styles.pressed}
                    accessibilityRole="link"
                    accessibilityLabel="Sign in">
                    <ThemedText type="smallBold" style={{ color: '#4F46E5' }}>
                      Sign in
                    </ThemedText>
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
    gap: Spacing.three,
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  logoContainer: {
    marginBottom: Spacing.two,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontFamily: Fonts.rounded,
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  wordmark: {
    fontFamily: Fonts.rounded,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  form: {
    gap: Spacing.three,
  },
  footer: {
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
