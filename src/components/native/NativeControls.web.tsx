import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../common/AppText';
import { IOSSwitch } from '../common/IOSSwitch';
import { SegmentedControl } from '../common/SegmentedControl';

/** Vista previa en navegador: sin SwiftUI, se usan los controles hechos con React Native. */
export function NativeToggle({ label, description, value, onChange }: { label: string; description?: string; value: boolean; onChange: (value: boolean) => void }): React.JSX.Element {
  return (
    <View style={styles.block}>
      <View style={styles.row}>
        <View style={styles.flex}>
          <AppText variant="headline">{label}</AppText>
        </View>
        <IOSSwitch label={label} value={value} onChange={onChange} />
      </View>
      {description ? <AppText variant="caption" tone="secondary">{description}</AppText> : null}
    </View>
  );
}

export function NativeSegmented<T extends string>({ options, value, onChange }: { options: readonly { value: T; label: string }[]; value: T; onChange: (value: T) => void }): React.JSX.Element {
  return <SegmentedControl options={options} value={value} onChange={onChange} />;
}

const styles = StyleSheet.create({
  block: { gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  flex: { flex: 1 },
});
