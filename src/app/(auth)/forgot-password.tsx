import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
// useEffect already imported
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedButton } from '@/components/animated-button';
import { IconButton } from '@/components/icon-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { backend } from '@/services';

const CODE_LENGTH = 6;
const EXPIRY_SECONDS = 60;
const RESEND_COOLDOWN = 30;

type Step = 'email' | 'code' | 'newPassword' | 'done';

const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(EXPIRY_SECONDS);
  const [expired, setExpired] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef<(TextInput | null)[]>([]);

  // Entrance animations
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(30);

  useEffect(() => {
    contentOpacity.value = withTiming(1, { duration: 500 });
    contentTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
  }, []);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  // Countdown timer for code expiry
  useEffect(() => {
    if (timeLeft <= 0) {
      setExpired(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  function handleDigit(value: string, index: number) {
    if (expired) return;
    if (value.length > 1) return;
    const next = [...code];
    next[index] = value;
    setCode(next);
    setError(null);

    if (value && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
      const next = [...code];
      next[index - 1] = '';
      setCode(next);
    }
  }

  const fullCode = code.join('');
  const isComplete = fullCode.length === CODE_LENGTH;
  const isPasswordValid = newPassword.length >= 6;

  async function handleSendCode() {
    if (!email.trim()) {
      setError('Enter your email address');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError(null);

    try {
      const client = (backend as any).getClient?.();
      if (client) {
        // Check if email exists in profiles first
        const { data: profile, error: profileError } = await client
          .from('profiles')
          .select('id')
          .eq('email', email.trim().toLowerCase())
          .single();

        if (profileError || !profile) {
          throw new Error('Incorrect email. This email is not registered.');
        }

        const { error: otpError } = await client.auth.signInWithOtp({
          email: email.trim(),
          options: {
            shouldCreateUser: false,
            emailRedirectTo: 'meetnow://auth/forgot-password',
          },
        });
        if (otpError) throw new Error(otpError.message);
      }
      setStep('code');
      setTimeLeft(EXPIRY_SECONDS);
      setCooldown(RESEND_COOLDOWN);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (cause) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(cause instanceof Error ? cause.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode() {
    if (!isComplete || !email || expired) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError(null);

    try {
      const client = (backend as any).getClient?.();
      if (client) {
        const { error: verifyError } = await client.auth.verifyOtp({
          email: email.trim(),
          token: fullCode,
          type: 'recovery',
        });
        if (verifyError) {
          if (verifyError.message.includes('expired') || verifyError.message.includes('invalid')) {
            throw new Error('Code has expired. Please request a new one.');
          }
          throw new Error(verifyError.message);
        }
      }
      setStep('newPassword');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (cause) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(cause instanceof Error ? cause.message : 'Invalid code');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!isPasswordValid) {
      setError('Password must be at least 6 characters');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError(null);

    try {
      const client = (backend as any).getClient?.();
      if (client) {
        const { error: updateError } = await client.auth.updateUser({
          password: newPassword,
        });
        if (updateError) throw new Error(updateError.message);
      }
      setStep('done');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (cause) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(cause instanceof Error ? cause.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || resending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setResending(true);
    try {
      const client = (backend as any).getClient?.();
      if (client) {
        await client.auth.signInWithOtp({
          email: email.trim(),
          options: {
            shouldCreateUser: false,
            emailRedirectTo: 'meetnow://auth/forgot-password',
          },
        });
      }
      setCode(Array(CODE_LENGTH).fill(''));
      setTimeLeft(EXPIRY_SECONDS);
      setExpired(false);
      setCooldown(RESEND_COOLDOWN);
      setError(null);
      inputs.current[0]?.focus();
    } catch {
      setError('Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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
            <View style={styles.header}>
              <IconButton
                name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
                onPress={() => (step === 'email' ? router.back() : setStep('email'))}
                accessibilityLabel="Back"
              />
            </View>

            <AnimatedThemedView style={[styles.hero, contentStyle]}>
              <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <ThemedText style={styles.iconText}>
                    {step === 'email' ? '🔑' : step === 'code' ? '✉' : step === 'newPassword' ? '🔒' : '✓'}
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={styles.wordmark}>
                {step === 'email' && 'Forgot password'}
                {step === 'code' && 'Enter code'}
                {step === 'newPassword' && 'New password'}
                {step === 'done' && 'Password reset'}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.tagline}>
                {step === 'email' && `Enter your email and we'll send you a ${CODE_LENGTH}-digit code to reset your password.`}
                {step === 'code' && `Enter the ${CODE_LENGTH}-digit code sent to ${email}`}
                {step === 'newPassword' && 'Enter a new password for your account.'}
                {step === 'done' && 'Your password has been reset successfully. Sign in with your new password.'}
              </ThemedText>
            </AnimatedThemedView>

            {step === 'email' && (
              <Animated.View style={[styles.form, contentStyle]}>
                <TextField
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@company.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="go"
                  onSubmitEditing={handleSendCode}
                  error={error ?? undefined}
                />
                <AnimatedButton label="Send code" onPress={handleSendCode} loading={loading} />
              </Animated.View>
            )}

            {step === 'code' && (
              <Animated.View style={[styles.codeSection, contentStyle]}>
                <View style={styles.codeRow}>
                  {code.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => { inputs.current[index] = ref; }}
                      style={[
                        styles.digitInput,
                        digit && styles.digitInputFilled,
                        expired && styles.digitInputExpired,
                      ]}
                      value={digit}
                      onChangeText={(value) => handleDigit(value, index)}
                      onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      textAlign="center"
                      selectTextOnFocus
                      editable={!expired}
                    />
                  ))}
                </View>

                <View style={styles.timerRow}>
                  {expired ? (
                    <ThemedText type="small" style={styles.expiredText}>
                      Code has expired
                    </ThemedText>
                  ) : (
                    <ThemedText type="small" themeColor="textSecondary" style={styles.timerText}>
                      Code expires in {formatTime(timeLeft)}
                    </ThemedText>
                  )}
                </View>

                {error && (
                  <ThemedText type="small" style={styles.error}>
                    {error}
                  </ThemedText>
                )}

                <AnimatedButton
                  label={expired ? 'Request new code' : 'Verify code'}
                  onPress={expired ? handleResend : handleVerifyCode}
                  loading={loading || resending}
                  disabled={expired ? cooldown > 0 : !isComplete}
                />

                <View style={styles.footer}>
                  <Pressable
                    onPress={handleResend}
                    disabled={cooldown > 0 || resending}
                    accessibilityRole="button"
                    accessibilityLabel="Resend code"
                    style={({ pressed }) => pressed && styles.pressed}>
                    <ThemedText type="small" themeColor="textSecondary">
                      {cooldown > 0
                        ? `Resend code in ${cooldown}s`
                        : resending
                          ? 'Sending…'
                          : 'Didn\'t receive code? Resend'}
                    </ThemedText>
                  </Pressable>
                </View>
              </Animated.View>
            )}

            {step === 'newPassword' && (
              <Animated.View style={[styles.form, contentStyle]}>
                <TextField
                  label="New password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete={"new-password" as any}
                  textContentType={"new-password" as any}
                  returnKeyType="go"
                  onSubmitEditing={handleResetPassword}
                  error={error ?? undefined}
                />
                <AnimatedButton
                  label="Reset password"
                  onPress={handleResetPassword}
                  loading={loading}
                  disabled={!isPasswordValid}
                />
              </Animated.View>
            )}

            {step === 'done' && (
              <Animated.View style={[styles.form, contentStyle]}>
                <AnimatedButton
                  label="Back to sign in"
                  onPress={() => router.replace('/(auth)/sign-in')}
                />
              </Animated.View>
            )}

            {step === 'email' && (
              <View style={styles.footer}>
                <Pressable
                  onPress={() => router.replace('/(auth)/sign-in')}
                  accessibilityRole="button"
                  accessibilityLabel="Back to sign in"
                  style={({ pressed }) => pressed && styles.pressed}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Remember your password? <ThemedText type="smallBold">Sign in</ThemedText>
                  </ThemedText>
                </Pressable>
              </View>
            )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  hero: {
    gap: Spacing.two,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: Spacing.two,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 32,
  },
  wordmark: {
    fontFamily: Fonts.rounded,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  form: {
    gap: Spacing.three,
  },
  codeSection: {
    gap: Spacing.four,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  digitInput: {
    width: 48,
    height: 56,
    borderRadius: Radius.medium,
    borderWidth: 2,
    borderColor: 'rgba(128,128,128,0.2)',
    fontFamily: Fonts.rounded,
    fontSize: 24,
    fontWeight: '700',
    backgroundColor: '#FFFFFF',
  },
  digitInputFilled: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  digitInputExpired: {
    borderColor: '#EF4444',
    opacity: 0.5,
  },
  timerRow: {
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  timerText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '500',
  },
  expiredText: {
    color: '#EF4444',
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '600',
  },
  error: {
    color: '#EF4444',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  pressed: {
    opacity: 0.6,
  },
});
