import { useEffect } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Radius, Shadows, Spacing } from '@/constants/theme';

type AnimatedCardProps = ViewProps & {
  children: React.ReactNode;
  delay?: number;
  onPress?: () => void;
};

const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);

export function AnimatedCard({ children, delay = 0, onPress, style, ...rest }: AnimatedCardProps) {
  const theme = useTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(1);

  // Entrance animation
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    translateY.value = withSpring(0, { damping: 15, stiffness: 100 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  function handlePressIn() {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  }

  function handlePressOut() {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }

  return (
    <AnimatedThemedView
      type="card"
      style={[
        styles.card,
        Shadows.light.medium,
        style,
        animatedStyle,
      ]}
      {...rest}>
      {children}
    </AnimatedThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.large,
    padding: Spacing.four,
  },
});
