import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type AvatarProps = {
  name: string;
  /** Diameter; the initial and the status dot scale with it. */
  size?: number;
  /** Shows the green online dot. */
  isOnline?: boolean;
};

export function Avatar({ name, size = 44, isOnline = false }: AvatarProps) {
  const theme = useTheme();
  const dot = Math.round(size * 0.25);

  return (
    <ThemedView
      type="backgroundSelected"
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <ThemedText style={[styles.initial, { fontSize: size * 0.42, lineHeight: size * 0.54 }]}>
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
  onlineDot: {
    position: 'absolute',
    borderWidth: 2,
  },
});
