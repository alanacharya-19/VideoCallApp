import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function TextField({ label, error, style, ...props }: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
        {label}
      </ThemedText>

      <TextInput
        {...props}
        onFocus={(event) => {
          setFocused(true);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          props.onBlur?.(event);
        }}
        placeholderTextColor={theme.textSecondary}
        selectionColor={theme.text}
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.backgroundElement,
            borderColor: error != null ? theme.danger : focused ? theme.text : 'transparent',
          },
          style,
        ]}
      />

      {error != null && (
        <ThemedText type="small" style={[styles.error, { color: theme.danger }]}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.one,
  },
  label: {
    fontWeight: '600',
    marginLeft: Spacing.two,
  },
  input: {
    height: 52,
    borderRadius: Spacing.three,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.three,
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '500',
  },
  error: {
    marginLeft: Spacing.two,
  },
});
