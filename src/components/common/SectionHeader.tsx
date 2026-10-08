import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';

export function SectionHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }): React.JSX.Element {
  return (
    <View style={styles.row}>
      <View style={styles.texts}>
        <AppText variant="title">{title}</AppText>
        {subtitle ? <AppText variant="callout" tone="secondary">{subtitle}</AppText> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  texts: { flex: 1, gap: 2 },
});
