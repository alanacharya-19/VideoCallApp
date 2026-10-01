import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Stable per-user avatar colors, so a person looks the same everywhere. */
const AVATAR_COLORS = ['#E8637A', '#3FB6A8', '#4A90D9', '#7C6BD6', '#E08A3C', '#3FA96B'] as const;

export type AvatarProps = {
  name: string;
  /** Diameter; the initial and the status dot scale with it. */
  size?: number;
  /** Shows the green online dot. */
  isOnline?: boolean;
  /** Picks a stable colour for this person. Omit for a neutral surface. */
  colorIndex?: number;
};

export function Avatar({ name, size = 44, isOnline = false, colorIndex }: AvatarProps) {
  const theme = useTheme();
  const dot = Math.round(size * 0.25);
  const color = colorIndex == null ? undefined : AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];

  return (
    <ThemedView
      type={color == null ? 'backgroundSelected' : undefined}
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
        color != null && { backgroundColor: color },
      ]}>
      <ThemedText
        style={[
          styles.initial,
          { fontSize: size * 0.6, lineHeight: size * 0.75 },
          color != null && styles.initialOnColor,
        ]}>
        {name.charAt(0).toUpperCase()}
      </ThemedText>

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
