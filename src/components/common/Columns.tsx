import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { spacing } from '../../theme';

export const TWO_COLUMN_MIN_WIDTH = 900;

/** En iPad (ancho suficiente) pone `left` y `right` en dos columnas; en iPhone los apila. */
export function Columns({ left, right }: { left: React.ReactNode; right: React.ReactNode }): React.JSX.Element {
  const { width } = useWindowDimensions();
  if (width < TWO_COLUMN_MIN_WIDTH) {
    return (
      <View style={styles.stack}>
        {left}
        {right}
      </View>
    );
  }
  return (
    <View style={styles.row}>
      <View style={styles.col}>{left}</View>
      <View style={styles.col}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg },
  col: { flex: 1, gap: spacing.lg },
});
