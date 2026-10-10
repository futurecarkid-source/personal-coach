import React from 'react';
import { Platform, StyleSheet, Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '../../theme';

export type TextVariant = 'largeTitle' | 'title' | 'headline' | 'body' | 'callout' | 'caption' | 'digits' | 'digitsLarge' | 'label';

const variants: Record<TextVariant, TextStyle> = {
  largeTitle: { fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -0.4 },
  title: { fontSize: 22, lineHeight: 27, fontWeight: '800', letterSpacing: -0.2 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '700' },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' },
  callout: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.3 },
  label: { fontSize: 11, lineHeight: 14, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  digits: { fontSize: 22, lineHeight: 28, fontWeight: '800', fontVariant: ['tabular-nums'] },
  digitsLarge: { fontSize: 64, lineHeight: 70, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: -1 },
};

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: 'primary' | 'secondary' | 'accent' | 'onAccent' | 'danger' | 'success' | 'volt';
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
              : tone === 'volt'
                ? colors.volt
                : colors.success;
  return <Text maxFontSizeMultiplier={1.4} {...rest} style={[styles.base, variants[variant], { color }, style]} />;
}

const styles = StyleSheet.create({
  base: { includeFontPadding: false, ...(Platform.OS === 'web' ? { fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif' } : {}) },
});
