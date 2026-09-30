import { SymbolView } from 'expo-symbols';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Avatar } from '@/components/avatar';
import { CallQualityIndicator, getQualityFromStats } from '@/components/call-quality';
import { LocalVideoView, RemoteVideoView } from '@/components/video-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { env } from '@/config/env';
import { useTheme } from '@/hooks/use-theme';
import { useSocial } from '@/providers/social-provider';
import { createCallService, type CallService } from '@/services/call-service';

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
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [quality, setQuality] = useState<'excellent' | 'good' | 'fair' | 'poor' | 'unknown'>('unknown');
  const [showLocalVideo, setShowLocalVideo] = useState(true);

  const startedAt = useRef(new Date().toISOString());
  const recorded = useRef(false);
  const callService = useRef<CallService | null>(null);
  const channelName = useMemo(() => `call-${params.id}-${Date.now()}`, [params.id]);
  const uid = useMemo(() => Math.floor(Math.random() * 100000), []);

  // Initialize Agora and join channel
  useEffect(() => {
    if (!env.hasCallCredentials) {
      // Fallback: simulate connection for demo
      const timer = setTimeout(() => setState('connected'), 900);
      return () => clearTimeout(timer);
    }

    const service = createCallService();
    callService.current = service;

    service.on('connectionStateChanged', (connectionState) => {
      if (connectionState === 3) {
        // ConnectionStateConnected
        setState('connected');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    });

    service.on('userJoined', (joinedUid) => {
      setRemoteUid(joinedUid);
    });

    service.on('userOffline', () => {
      setRemoteUid(null);
    });

    service.on('networkQuality', (_tx, rx) => {
      const q = rx <= 1 ? 'excellent' : rx <= 2 ? 'good' : rx <= 3 ? 'fair' : 'poor';
      setQuality(q);
    });

    service.on('callEnded', () => {
      // Call ended
    });

    service.on('error', (_err, msg) => {
      console.warn('Agora error:', _err, msg);
    });

    void service.join(channelName, env.AGORA_TOKEN, uid);

    return () => {
      void service.leave();
      service.destroy();
      callService.current = null;
    };
  }, [channelName, uid]);

  // Duration timer
  useEffect(() => {
    if (state !== 'connected') return;
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [state]);

  // Record call on unmount
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

  const toggleControl = useCallback(
    (key: ControlKey) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setMuted((current) => {
        const next = { ...current, [key]: !current[key] };
        if (callService.current) {
          if (key === 'mute') callService.current.muteAudio(next.mute);
          if (key === 'video') callService.current.muteVideo(next.video);
          if (key === 'speaker') callService.current.setSpeakerEnabled(next.speaker);
        }
        return next;
      });
    },
    []
  );

  function hangUp() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setState('ended');
    router.back();
  }

  const isVideo = params.mode === 'video';
  const hasRemoteVideo = remoteUid != null && isVideo && !muted.video;

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

          {state === 'connected' && (
            <View style={styles.topBarRight}>
              <CallQualityIndicator quality={quality} />
            </View>
          )}
        </View>

        <View style={styles.stage}>
          {hasRemoteVideo && remoteUid != null ? (
            <View style={styles.remoteVideo}>
              <RemoteVideoView uid={remoteUid} channelId={channelName} />
              {showLocalVideo && (
                <View style={styles.localVideo}>
                  <LocalVideoView uid={uid} channelId={channelName} />
                </View>
              )}
            </View>
          ) : (
            <View style={styles.peer}>
              <Avatar name={peer?.name ?? '?'} size={112} colorIndex={peer?.colorIndex} />
              <ThemedText style={styles.peerName}>{peer?.name ?? 'Unknown'}</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.status}>
                {state === 'connecting' && 'Connecting…'}
                {state === 'connected' && formatDuration(seconds)}
                {state === 'ended' && 'Call ended'}
              </ThemedText>
            </View>
          )}

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
                  onPress={() => toggleControl(control.key)}
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
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
  remoteVideo: {
    flex: 1,
    alignSelf: 'stretch',
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  localVideo: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.three,
    width: 100,
    height: 140,
    borderRadius: Spacing.two,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFF',
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
