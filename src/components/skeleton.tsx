import { View, StyleSheet, type ViewProps } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

type SkeletonProps = ViewProps & {
  width?: number | string;
  height?: number;
  borderRadius?: number;
};

export function Skeleton({ width = '100%', height = 16, borderRadius, style, ...rest }: SkeletonProps) {
  const theme = useTheme();
  const radius = borderRadius ?? height / 2;

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius: radius,
          backgroundColor: theme.backgroundElement,
        },
        style,
      ]}
      {...rest}
    />
  );
}

export function SkeletonRow() {
  return (
    <View style={styles.row}>
      <Skeleton width={44} height={44} borderRadius={22} />
      <View style={styles.text}>
        <Skeleton width={120} height={14} borderRadius={7} />
        <Skeleton width={80} height={12} borderRadius={6} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  text: {
    flex: 1,
    gap: 4,
  },
  list: {
    alignSelf: 'stretch',
  },
});
