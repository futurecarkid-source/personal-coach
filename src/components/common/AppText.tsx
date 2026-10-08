import React from 'react';
import { StyleSheet, Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '../../theme';

export type TextVariant = 'largeTitle' | 'title' | 'headline' | 'body' | 'callout' | 'caption' | 'digits' | 'digitsLarge';

const variants: Record<TextVariant, TextStyle> = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700', letterSpacing: 0.4 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: 0.3 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' },
  callout: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500', letterSpacing: 0.2 },
  digits: { fontSize: 22, lineHeight: 28, fontWeight: '700', fontVariant: ['tabular-nums'] },
  digitsLarge: { fontSize: 64, lineHeight: 72, fontWeight: '700', fontVariant: ['tabular-nums'], letterSpacing: -1 },
};

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: 'primary' | 'secondary' | 'accent' | 'onAccent' | 'danger' | 'success';
  style?: StyleProp<TextStyle>;
}

/** Texto con la tipografía del sistema (San Francisco), escala dinámica y colores del tema. */
export function AppText({ variant = 'body', tone = 'primary', style, ...rest }: AppTextProps): React.JSX.Element {
  const { colors } = useTheme();
  const color =
    tone === 'primary'
      ? colors.text
      : tone === 'secondary'
        ? colors.textSecondary
        : tone === 'accent'
          ? colors.accent
          : tone === 'onAccent'
            ? colors.textOnAccent
            : tone === 'danger'
              ? colors.danger
              : colors.success;
  return <Text maxFontSizeMultiplier={1.4} {...rest} style={[styles.base, variants[variant], { color }, style]} />;
}

const styles = StyleSheet.create({
  base: { includeFontPadding: false },
});
