import { SymbolView } from 'expo-symbols';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSocial } from '@/providers/social-provider';

/**
 * Incoming call screen — shown when a push notification is tapped or when
 * the app receives a call signal. The caller info comes from the notification
 * payload via query params.
 */
export default function IncomingCallScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{ id: string; name: string; mode?: string }>();
  const { friends, directory } = useSocial();
  const pulse = useRef(new Animated.Value(1)).current;

  const peer = [...friends, ...directory].find((p) => p.id === params.id);
  const name = params.name ?? peer?.name ?? 'Unknown';
  const colorIndex = peer?.colorIndex ?? 0;
  const isVideo = params.mode === 'video';

  useEffect(() => {
    // Pulse animation for the avatar
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    // Vibrate repeatedly
    const interval = setInterval(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }, 2000);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    return () => clearInterval(interval);
  }, [pulse]);

  function accept() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.replace(`/call/${params.id}?mode=${params.mode ?? 'audio'}`);
  }

  function decline() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.back();
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
            {isVideo ? 'Incoming video call' : 'Incoming call'}
          </ThemedText>

          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <Avatar name={name} size={120} colorIndex={colorIndex} />
          </Animated.View>

          <ThemedText style={styles.name}>{name}</ThemedText>

          <View style={styles.actions}>
            <View style={styles.action}>
              <Pressable
                onPress={decline}
                accessibilityRole="button"
                accessibilityLabel="Decline call"
                style={({ pressed }) => [pressed && styles.pressed]}>
                <ThemedView style={[styles.actionButton, styles.decline]}>
                  <SymbolView
                    name={{ ios: 'phone.down.fill', android: 'call_end', web: 'call_end' }}
                    size={28}
                    tintColor="#FFF"
                  />
                </ThemedView>
              </Pressable>
              <ThemedText type="small" themeColor="textSecondary">
                Decline
              </ThemedText>
            </View>

            <View style={styles.action}>
              <Pressable
                onPress={accept}
                accessibilityRole="button"
                accessibilityLabel="Accept call"
                style={({ pressed }) => [pressed && styles.pressed]}>
                <ThemedView style={[styles.actionButton, styles.accept]}>
                  <SymbolView
                    name={{ ios: 'phone.fill', android: 'call', web: 'call' }}
                    size={28}
                    tintColor="#FFF"
                  />
                </ThemedView>
              </Pressable>
              <ThemedText type="small" themeColor="textSecondary">
                Accept
              </ThemedText>
            </View>
          </View>
        </View>
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
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  name: {
    fontFamily: Fonts.rounded,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.six,
    marginTop: Spacing.six,
  },
  action: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  actionButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accept: {
    backgroundColor: '#34C759',
  },
  decline: {
    backgroundColor: '#FF3B30',
  },
  pressed: {
    opacity: 0.6,
  },
});
