import { Image, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Stable per-user avatar colors, so a person looks the same everywhere. */
const AVATAR_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'] as const;

export type AvatarProps = {
  name: string;
  /** Diameter; the initial and the status dot scale with it. */
  size?: number;
  /** Shows the green online dot. */
  isOnline?: boolean;
  /** Picks a stable colour for this person. Omit for a neutral surface. */
  colorIndex?: number;
  /** Profile photo URL. When set, shows the photo instead of the initial. */
  photoUrl?: string | null;
};

export function Avatar({ name, size = 44, isOnline = false, colorIndex, photoUrl }: AvatarProps) {
  const theme = useTheme();
  const dot = Math.round(size * 0.25);
  const color = colorIndex == null ? undefined : AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
  const borderRadius = size / 2;

  return (
    <ThemedView
      type={color == null ? 'backgroundSelected' : undefined}
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius },
        color != null && { backgroundColor: color },
      ]}>
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={{ width: size, height: size, borderRadius }}
          resizeMode="cover"
        />
      ) : (
        <ThemedText
          style={[
            styles.initial,
            { fontSize: size * 0.6, lineHeight: size * 0.75 },
            color != null && styles.initialOnColor,
          ]}>
          {name.charAt(0).toUpperCase()}
        </ThemedText>
      )}

      {isOnline && (
        <ThemedView
          style={[
            styles.onlineDot,
            {
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              right: -dot * 0.1,
              bottom: -dot * 0.1,
              backgroundColor: theme.success,
              borderColor: theme.background,
            },
          ]}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initial: {
    fontFamily: Fonts.rounded,
    fontWeight: '700',
  },
  initialOnColor: {
    color: '#FFFFFF',
  },
  onlineDot: {
    position: 'absolute',
    borderWidth: 2,
  },
});
