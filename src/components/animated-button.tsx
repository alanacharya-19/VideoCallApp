import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Fonts, Radius, Shadows, Spacing } from '@/constants/theme';

type AnimatedButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AnimatedButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  style,
}: AnimatedButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const isDisabled = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  function handlePressIn() {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    opacity.value = withTiming(0.9, { duration: 100 });
  }

  function handlePressOut() {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    opacity.value = withTiming(1, { duration: 100 });
  }

  const backgroundColor = isDisabled
    ? theme.backgroundSelected
    : variant === 'primary'
      ? theme.primary
      : variant === 'danger'
        ? theme.danger
        : variant === 'secondary'
          ? theme.backgroundElement
          : 'transparent';

  const textColor = isDisabled
    ? theme.textSecondary
    : variant === 'primary' || variant === 'danger'
      ? '#FFFFFF'
      : variant === 'secondary'
        ? theme.text
        : theme.primary;

  const height = size === 'small' ? 40 : size === 'large' ? 56 : 48;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={isDisabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        styles.button,
        {
          backgroundColor,
          height,
          borderRadius: Radius.large,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: theme.separator,
          ...(variant === 'primary' ? Shadows.light.medium : {}),
        },
        style,
        animatedStyle,
      ]}>
      {loading ? (
        <View style={styles.loadingRow}>
          <Animated.View
            style={[
              styles.spinner,
              { borderTopColor: textColor },
            ]}
          />
        </View>
      ) : (
        <ThemedText
          type="smallBold"
          style={[
            styles.label,
            { color: textColor, fontSize: size === 'small' ? 13 : size === 'large' ? 17 : 15 },
          ]}>
          {label}
        </ThemedText>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  label: {
    fontFamily: Fonts.sans,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderTopColor: '#fff',
    borderColor: 'transparent',
  },
});
