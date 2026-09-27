import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

export type IconButtonProps = {
  name: SymbolViewProps['name'];
  onPress: () => void;
  accessibilityLabel: string;
  /**
   * - `filled` high contrast primary action
   * - `subtle` surface button that sits on the page
   * - `danger` destructive action, e.g. hanging up
   */
  variant?: 'filled' | 'subtle' | 'danger';
  size?: number;
  iconSize?: number;
  disabled?: boolean;
};

export function IconButton({
  name,
  onPress,
  accessibilityLabel,
  variant = 'subtle',
  size = 40,
  iconSize = 18,
  disabled = false,
}: IconButtonProps) {
  const theme = useTheme();
  const fill =
    variant === 'filled' ? theme.text : variant === 'danger' ? theme.danger : theme.backgroundElement;
  const tint = variant === 'subtle' ? theme.text : theme.background;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => [pressed && !disabled && styles.pressed, disabled && styles.disabled]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}>
      <ThemedView
        style={[
          styles.button,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: fill },
        ]}>
        <SymbolView name={name} size={iconSize} tintColor={tint} />
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
});
