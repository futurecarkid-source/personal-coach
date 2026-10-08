import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Host, Picker, Text as SwiftText, Toggle } from '@expo/ui/swift-ui';
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';
import { AppText } from '../common/AppText';
import { Chip } from '../common/Chip';
import { SegmentedControl } from '../common/SegmentedControl';

/** Si un control nativo falla al dibujarse, se muestra el equivalente hecho con React Native. */
class Fallback extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override render(): React.ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export interface NativeToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

/** Interruptor real de iOS (SwiftUI), con el vidrio y la animación del sistema. */
export function NativeToggle({ label, description, value, onChange }: NativeToggleProps): React.JSX.Element {
  const fallback = (
    <View style={styles.row}>
      <View style={styles.flex}>
        <AppText variant="headline">{label}</AppText>
      </View>
      <Chip label={value ? 'Sí' : 'No'} selected={value} onPress={() => onChange(!value)} />
    </View>
  );
  return (
    <View style={styles.block}>
      {Platform.OS === 'ios' ? (
        <Fallback fallback={fallback}>
          <Host matchContents={{ vertical: true }} style={styles.host}>
            <Toggle isOn={value} label={label} onIsOnChange={onChange} />
          </Host>
        </Fallback>
      ) : (
        fallback
      )}
      {description ? <AppText variant="caption" tone="secondary">{description}</AppText> : null}
    </View>
  );
}

export interface NativeSegmentedProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** Selector segmentado real de iOS (SwiftUI). */
export function NativeSegmented<T extends string>({ options, value, onChange }: NativeSegmentedProps<T>): React.JSX.Element {
  const fallback = <SegmentedControl options={options} value={value} onChange={onChange} />;
  if (Platform.OS !== 'ios') return fallback;
  return (
    <Fallback fallback={fallback}>
      <Host matchContents={{ vertical: true }} style={styles.host}>
        <Picker selection={value} onSelectionChange={(next: T) => onChange(next)} modifiers={[pickerStyle('segmented')]}>
          {options.map((o) => (
            <SwiftText key={o.value} modifiers={[tag(o.value)]}>
              {o.label}
            </SwiftText>
          ))}
        </Picker>
      </Host>
    </Fallback>
  );
}

const styles = StyleSheet.create({
  block: { gap: 4 },
  host: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  flex: { flex: 1 },
});
