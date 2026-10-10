import React, { useEffect, useState } from 'react';
import { ActionSheetIOS, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { haptics, radii, spacing, useTheme } from '../../theme';
import { AppText } from './AppText';
import { GlassSurface } from './GlassSurface';

export interface ActionOption {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

export interface ActionSheetRequest {
  title?: string;
  options: ActionOption[];
}

type Listener = (req: ActionSheetRequest | null) => void;
let listener: Listener | null = null;

/** Hoja de acciones al mantener pulsado (como el menú contextual de iOS). En la app nativa usa la de iOS; en la web, una propia. */
export function showActionSheet(req: ActionSheetRequest): void {
  haptics.medium();
  if (Platform.OS === 'ios') {
    const labels = [...req.options.map((o) => o.label), 'Cancelar'];
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: req.title,
        options: labels,
        cancelButtonIndex: labels.length - 1,
        destructiveButtonIndex: req.options.findIndex((o) => o.destructive) >= 0 ? req.options.findIndex((o) => o.destructive) : undefined,
      },
      (index) => req.options[index]?.onPress(),
    );
    return;
  }
  listener?.(req);
}

/** Se monta una sola vez en la raíz para la versión web. */
export function ActionSheetHost(): React.JSX.Element | null {
  const { colors } = useTheme();
  const [req, setReq] = useState<ActionSheetRequest | null>(null);
  useEffect(() => {
    listener = setReq;
    return () => {
      listener = null;
    };
  }, []);
  if (Platform.OS === 'ios') return null;
  const close = (): void => setReq(null);
  return (
    <Modal visible={req !== null} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Cerrar">
        <View style={styles.sheet}>
          <GlassSurface radius={radii.card} variant="regular" style={styles.group}>
            {req?.title ? <AppText variant="caption" tone="secondary" style={styles.title}>{req.title}</AppText> : null}
            {req?.options.map((o, i) => (
              <Pressable
                key={o.label}
                accessibilityRole="button"
                onPress={() => {
                  close();
                  o.onPress();
                }}
                style={[styles.row, i > 0 || req.title ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator } : null]}
              >
                <AppText variant="headline" tone={o.destructive ? 'danger' : 'primary'} style={styles.center}>{o.label}</AppText>
              </Pressable>
            ))}
          </GlassSurface>
          <GlassSurface radius={radii.card} variant="regular" style={styles.group}>
            <Pressable accessibilityRole="button" onPress={close} style={styles.row}>
              <AppText variant="headline" style={styles.center}>Cancelar</AppText>
            </Pressable>
          </GlassSurface>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { padding: spacing.md, gap: spacing.sm, width: '100%', maxWidth: 520, alignSelf: 'center' },
  group: { overflow: 'hidden' },
  title: { textAlign: 'center', paddingTop: spacing.md },
  row: { paddingVertical: spacing.lg, alignItems: 'center' },
  center: { textAlign: 'center' },
});
