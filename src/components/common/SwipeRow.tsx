import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { haptics, radii, spacing, useTheme } from '../../theme';
import { AppText } from './AppText';
import { HapticTouch } from './HapticTouch';
import { Icon } from './Icon';

export interface SwipeRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  deleteLabel?: string;
}

/**
 * Fila que se desliza hacia la izquierda para revelar "Borrar" (el gesto de iOS de Mail y Mensajes).
 * Con VoiceOver, la acción también está disponible como acción personalizada.
 */
export function SwipeRow({ children, onDelete, deleteLabel = 'Borrar' }: SwipeRowProps): React.JSX.Element {
  const { colors } = useTheme();
  const ref = useRef<SwipeableMethods | null>(null);
  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={2}
      rightThreshold={44}
      overshootRight={false}
      onSwipeableOpenStartDrag={() => haptics.selection()}
      renderRightActions={() => (
        <View style={styles.actionWrap}>
          <HapticTouch
            haptic="warning"
            accessibilityLabel={deleteLabel}
            onPress={() => {
              ref.current?.close();
              onDelete();
            }}
            style={[styles.action, { backgroundColor: colors.danger }]}
          >
            <Icon name="trash.fill" size={20} color="#FFFFFF" />
            <AppText variant="caption" style={styles.white}>{deleteLabel}</AppText>
          </HapticTouch>
        </View>
      )}
    >
      {children}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  actionWrap: { justifyContent: 'center', paddingLeft: spacing.sm },
  action: { width: 84, height: '100%', borderRadius: radii.card, alignItems: 'center', justifyContent: 'center', gap: 4 },
  white: { color: '#FFFFFF' },
});
