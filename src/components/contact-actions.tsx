import { SymbolView } from 'expo-symbols';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

const options = [
  {
    key: 'call',
    label: 'Call',
    icon: { ios: 'phone.fill', android: 'call', web: 'call' },
  },
  {
    key: 'video',
    label: 'Video',
    icon: { ios: 'video.fill', android: 'videocam', web: 'videocam' },
  },
] as const;

export type ContactActionsProps = {
  /** The tapped contact, or null when the card is closed. */
  name: string | null;
  onClose: () => void;
  onCall: (name: string) => void;
  onVideo: (name: string) => void;
};

/** Compact card offering the two ways to reach a contact. */
export function ContactActions({ name, onClose, onCall, onVideo }: ContactActionsProps) {
  const theme = useTheme();
  const scheme = useColorScheme();
  // A black scrim disappears on a dark background, so lighten it instead.
  const isDark = scheme === 'dark' || scheme === 'unspecified';
  const scrim = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.35)';

  return (
    <Modal
      visible={name != null}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: scrim }]} onPress={onClose}>
        {/* Swallow presses so they do not fall through to the backdrop. */}
        <Pressable
          style={[styles.card, { backgroundColor: theme.backgroundSelected }]}
          onPress={() => {}}>
          <ThemedText numberOfLines={1} style={styles.name}>
            {name}
          </ThemedText>

          <View style={styles.options}>
            {options.map((option) => (
              <Pressable
                key={option.key}
                onPress={() => {
                  if (option.key === 'call') onCall(name ?? '');
                  else onVideo(name ?? '');
                  onClose();
                }}
                style={({ pressed }) => [styles.option, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`${option.label} ${name ?? ''}`.trim()}>
                <ThemedView style={styles.optionIcon}>
                  <SymbolView name={option.icon} size={22} tintColor={theme.text} />
                </ThemedView>
                <ThemedText type="small" style={styles.optionLabel}>
                  {option.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Cancel">
            <ThemedText type="small" themeColor="textSecondary">
              Cancel
            </ThemedText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  card: {
    width: 260,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
    gap: Spacing.three,
  },
  name: {
    fontFamily: Fonts.sans,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  options: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.18)',
  },
  optionLabel: {
    fontWeight: '600',
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  pressed: {
    opacity: 0.6,
  },
});
