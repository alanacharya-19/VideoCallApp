import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';

/** Matches the diameter of a trailing `IconButton`, so the title stays centered. */
const SLOT = 40;

export type ScreenHeaderProps = {
  title: ReactNode;
  /** Trailing action, e.g. a primary call button. */
  action?: ReactNode;
};

export function ScreenHeader({ title, action }: ScreenHeaderProps) {
  return (
    <ThemedView style={styles.header}>
      <ThemedView style={styles.slot} />
      <ThemedText style={styles.title}>{title}</ThemedText>
      {action ?? <ThemedView style={styles.slot} />}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: Spacing.four,
  },
  slot: {
    width: SLOT,
  },
  title: {
    flex: 1,
    fontFamily: Fonts.rounded,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.8,
    textAlign: 'center',
  },
});
