import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';

export type SectionHeaderProps = {
  title: string;
  /** Optional trailing action, e.g. "Clear". */
  action?: string;
  onActionPress?: () => void;
};

export function SectionHeader({ title, action, onActionPress }: SectionHeaderProps) {
  return (
    <ThemedView style={styles.header}>
      <ThemedText style={styles.title}>{title}</ThemedText>

      {action != null && (
        <Pressable
          onPress={onActionPress ?? (() => {})}
          hitSlop={8}
          style={({ pressed }) => pressed && styles.pressed}
          accessibilityRole="button"
          accessibilityLabel={action}>
          <ThemedText type="small" themeColor="textSecondary">
            {action}
          </ThemedText>
        </Pressable>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: Spacing.three,
  },
  title: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.3,
    textAlign: 'left',
  },
  pressed: {
    opacity: 0.7,
  },
});
