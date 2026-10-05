import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

import { AnimatedButton } from '@/components/animated-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';
import { backend } from '@/services';

const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Entrance animations
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(30);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 600 });
    logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    formOpacity.value = withTiming(1, { duration: 600 });
    formTranslateY.value = withSpring(0, { damping: 15, stiffness: 80 });
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

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

  async function handleGoogleSignIn() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGoogleLoading(true);
    setError(null);
    try {
      await (backend as any).signInWithGoogle();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Google sign-in failed');
      setGoogleLoading(false);
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
                Meet
                <ThemedText themeColor="textSecondary">Now</ThemedText>
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.tagline}>
                Connect with anyone, anywhere.
              </ThemedText>
            </AnimatedThemedView>

            <Animated.View style={[styles.form, formStyle]}>
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

              <AnimatedButton label="Sign in" onPress={handleSubmit} loading={loading} />
            </Animated.View>

            <View style={styles.footer}>
              <Link href="/(auth)/forgot-password" asChild>
                <Pressable
                  style={({ pressed }) => pressed && styles.pressed}
                  accessibilityRole="link"
                  accessibilityLabel="Forgot password">
                  <ThemedText type="small" themeColor="textSecondary">
                    Forgot password?
                  </ThemedText>
                </Pressable>
              </Link>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.dividerText}>
                or
              </ThemedText>
              <View style={styles.dividerLine} />
            </View>

            <AnimatedButton
              label={googleLoading ? 'Connecting…' : 'Continue with Google'}
              onPress={handleGoogleSignIn}
              loading={googleLoading}
              variant="secondary"
            />

            <View style={styles.footerRow}>
              <ThemedText type="small" themeColor="textSecondary">
                New here?
              </ThemedText>
              <Link href="/(auth)/sign-up" asChild>
                <Pressable
                  style={({ pressed }) => pressed && styles.pressed}
                  accessibilityRole="link"
                  accessibilityLabel="Create an account">
                  <ThemedText type="smallBold" style={{ color: '#4F46E5' }}>
                    Create an account
                  </ThemedText>
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
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '800',
    letterSpacing: -1,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(128,128,128,0.3)',
  },
  dividerText: {
    textTransform: 'uppercase',
    letterSpacing: 1,
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
