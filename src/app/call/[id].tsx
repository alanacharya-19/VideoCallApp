import { SymbolView } from 'expo-symbols';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { env } from '@/config/env';
import { useTheme } from '@/hooks/use-theme';
import { useSocial } from '@/providers/social-provider';

type CallState = 'connecting' | 'connected' | 'ended';

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const controls = [
  { key: 'mute', icon: { ios: 'mic.fill', android: 'mic', web: 'mic' }, off: { ios: 'mic.slash.fill', android: 'mic_off', web: 'mic_off' }, label: 'Mute' },
  { key: 'video', icon: { ios: 'video.fill', android: 'videocam', web: 'videocam' }, off: { ios: 'video.slash.fill', android: 'videocam_off', web: 'videocam_off' }, label: 'Camera' },
  { key: 'speaker', icon: { ios: 'speaker.wave.2.fill', android: 'volume_up', web: 'volume_up' }, off: { ios: 'speaker.slash.fill', android: 'volume_off', web: 'volume_off' }, label: 'Speaker' },
] as const;

type ControlKey = (typeof controls)[number]['key'];

/**
 * Active call surface. The provider SDK is not wired up yet, so this runs the
 * real call lifecycle (connect → connected → end) and owns the screen state.
 * `src/services/call-service.ts` is where the SDK gets plugged in.
 */
export default function CallScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{ id: string; mode?: string }>();
  const { friends, directory, recordCall } = useSocial();

  const peer = useMemo(
    () => [...friends, ...directory].find((person) => person.id === params.id),
    [friends, directory, params.id]
  );

  const [state, setState] = useState<CallState>('connecting');
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState<Record<ControlKey, boolean>>({
    mute: false,
    video: false,
    speaker: false,
  });
  const startedAt = useRef(new Date().toISOString());
  const recorded = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setState('connected'), 900);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (state !== 'connected') return;
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [state]);

  // Leaving the screen by any route (back gesture, minimise, close) must still
  // end the call and write it to history, exactly once.
  useEffect(() => {
    return () => {
      if (recorded.current) return;
      recorded.current = true;
      if (peer == null) return;
      void recordCall({
        peerId: peer.id,
        peerName: peer.name,
        peerColorIndex: peer.colorIndex,
        direction: 'outgoing',
        outcome: seconds > 0 ? 'completed' : 'missed',
        mode: params.mode === 'video' ? 'video' : 'audio',
        startedAt: startedAt.current,
        durationSeconds: seconds,
      });
    };
  }, [peer, recordCall, seconds, params.mode]);

  function hangUp() {
    setState('ended');
    router.back();
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Minimise call"
            style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}>
            <SymbolView
              name={{ ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' }}
              size={18}
              tintColor={theme.text}
            />
          </Pressable>
        </View>

        <View style={styles.stage}>
          <View style={styles.peer}>
            <Avatar name={peer?.name ?? '?'} size={112} colorIndex={peer?.colorIndex} />

            <ThemedText style={styles.peerName}>{peer?.name ?? 'Unknown'}</ThemedText>

            <ThemedText themeColor="textSecondary" style={styles.status}>
              {state === 'connecting' && 'Connecting…'}
              {state === 'connected' && formatDuration(seconds)}
              {state === 'ended' && 'Call ended'}
            </ThemedText>
          </View>

          {state === 'connecting' && (
            <View style={styles.badge}>
              <ThemedText type="small" themeColor="textSecondary">
                {env.hasCallCredentials
                  ? 'Securing a connection…'
                  : 'Add credentials to .env to connect'}
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.controls}>
          {controls.map((control) => {
            const isOn = muted[control.key];
            return (
              <View key={control.key} style={styles.control}>
                <Pressable
                  onPress={() =>
                    setMuted((current) => ({ ...current, [control.key]: !current[control.key] }))
                  }
                  accessibilityRole="button"
                  accessibilityState={{ selected: isOn }}
                  accessibilityLabel={`${isOn ? 'Turn on' : 'Turn off'} ${control.label.toLowerCase()}`}
                  style={({ pressed }) => [pressed && styles.pressed]}>
                  <ThemedView type={isOn ? 'backgroundSelected' : 'backgroundElement'} style={styles.controlButton}>
                    <SymbolView
                      name={isOn ? control.off : control.icon}
                      size={22}
                      tintColor={theme.text}
                    />
                  </ThemedView>
                </Pressable>
                <ThemedText type="small" themeColor="textSecondary">
                  {control.label}
                </ThemedText>
              </View>
            );
          })}

          <View style={styles.control}>
            <Pressable
              onPress={hangUp}
              accessibilityRole="button"
              accessibilityLabel="End call"
              style={({ pressed }) => [pressed && styles.pressed]}>
              <ThemedView style={[styles.controlButton, styles.hangUp]}>
                <SymbolView
                  name={{ ios: 'phone.down.fill', android: 'call_end', web: 'call_end' }}
                  size={24}
                  tintColor={theme.background}
                />
              </ThemedView>
            </Pressable>
            <ThemedText type="small" themeColor="textSecondary">
              End
            </ThemedText>
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
    paddingVertical: Spacing.three,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  peer: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  peerName: {
    fontFamily: Fonts.rounded,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  status: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
  },
  badge: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.four,
  },
  control: {
    alignItems: 'center',
    gap: Spacing.one,
    width: 72,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hangUp: {
    backgroundColor: '#E5484D',
  },
  pressed: {
    opacity: 0.6,
  },
});
