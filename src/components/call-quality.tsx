import { SymbolView } from 'expo-symbols';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

type Quality = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

const qualityConfig: Record<Quality, { icon: string; color: string; label: string }> = {
  excellent: { icon: 'wifi', color: '#34C759', label: 'Excellent' },
  good: { icon: 'wifi', color: '#30D158', label: 'Good' },
  fair: { icon: 'wifi.exclamationmark', color: '#FF9F0A', label: 'Fair' },
  poor: { icon: 'wifi.exclamationmark', color: '#FF453A', label: 'Poor' },
  unknown: { icon: 'wifi.slash', color: '#8E8E93', label: 'Unknown' },
};

export function CallQualityIndicator({ quality }: { quality: Quality }) {
  const theme = useTheme();
  const config = qualityConfig[quality];

  return (
    <View style={styles.container}>
      <SymbolView
        name={config.icon as any}
        size={12}
        tintColor={config.color}
      />
      <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
        {config.label}
      </ThemedText>
    </View>
  );
}

export function getQualityFromStats(stats?: {
  txPacketLossRate?: number;
  rxPacketLossRate?: number;
  lastMileDelay?: number;
}): Quality {
  if (!stats) return 'unknown';

  const loss = Math.max(stats.txPacketLossRate ?? 0, stats.rxPacketLossRate ?? 0);
  const delay = stats.lastMileDelay ?? 0;

  if (loss > 15 || delay > 400) return 'poor';
  if (loss > 8 || delay > 250) return 'fair';
  if (loss > 3 || delay > 120) return 'good';
  return 'excellent';
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
});
