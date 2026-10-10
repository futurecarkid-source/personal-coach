import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { radii, spacing, useTheme, type HapticKind } from '../../theme';
import { AppText } from './AppText';
import { GlassSurface } from './GlassSurface';
import { HapticTouch, type HapticTouchProps } from './HapticTouch';
import { Icon, type IconName } from './Icon';

export interface GlassButtonProps extends Omit<HapticTouchProps, 'children' | 'style'> {
  label: string;
  icon?: IconName;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'regular' | 'compact';
  fullWidth?: boolean;
  haptic?: HapticKind;
  style?: StyleProp<ViewStyle>;
}

/** Botón de vidrio. El principal se tiñe de naranja; el secundario es vidrio neutro. */
export function GlassButton({
  label,
  icon,
  variant = 'secondary',
  size = 'regular',
  fullWidth = false,
  haptic = 'medium',
  style,
  ...rest
}: GlassButtonProps): React.JSX.Element {
  const { colors } = useTheme();
  const compact = size === 'compact';
  const tint = variant === 'primary' ? colors.accent : variant === 'danger' ? colors.danger : undefined;
  const textTone = variant === 'primary' ? 'accent' : variant === 'danger' ? 'danger' : variant === 'ghost' ? 'accent' : 'primary';
  const iconColor = variant === 'primary' ? colors.accent : variant === 'danger' ? colors.danger : variant === 'ghost' ? colors.accent : colors.text;

  const inner = (
    <View style={[styles.row, { minHeight: 44, paddingVertical: compact ? spacing.sm : spacing.md, paddingHorizontal: compact ? spacing.md : spacing.lg }]}>
      {icon ? <Icon name={icon} size={compact ? 16 : 18} color={iconColor} /> : null}
      <AppText variant={compact ? 'callout' : 'headline'} tone={textTone} numberOfLines={1} style={styles.label}>
        {label}
      </AppText>
    </View>
  );

  return (
    <HapticTouch haptic={haptic} accessibilityLabel={label} style={[fullWidth ? styles.full : styles.auto, style]} {...rest}>
      {variant === 'ghost' ? (
        inner
      ) : (
        <GlassSurface
          radius={radii.button}
          variant="regular"
          tint={tint}
          interactive
          flat={variant === 'secondary'}
          style={styles.surface}
        >
          {inner}
        </GlassSurface>
      )}
    </HapticTouch>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  label: { fontWeight: '600' },
  full: { alignSelf: 'stretch' },
  auto: { alignSelf: 'flex-start' },
  surface: { alignSelf: 'stretch' },
});
