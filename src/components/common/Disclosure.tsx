import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../../theme';
import { AppText } from './AppText';
import { GlassCard } from './GlassCard';
import { HapticTouch } from './HapticTouch';
import { Icon } from './Icon';

export interface DisclosureProps {
  title: string;
  /** Texto corto a la derecha del título cuando está cerrado (por ejemplo, un estado). */
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/** Bloque plegable: deja a la vista solo el título y abre el detalle cuando hace falta (menos ruido en pantalla). */
export function Disclosure({ title, summary, defaultOpen = false, children }: DisclosureProps): React.JSX.Element {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <GlassCard>
      <HapticTouch haptic="selection" onPress={() => setOpen((v) => !v)} accessibilityLabel={title} accessibilityState={{ expanded: open }} pressedScale={0.99}>
        <View style={styles.head}>
          <AppText variant="headline" style={styles.flex}>{title}</AppText>
          {!open && summary ? <AppText variant="callout" tone="secondary">{summary}</AppText> : null}
          <Icon name={open ? 'chevron.up' : 'chevron.down'} size={14} />
        </View>
      </HapticTouch>
      {open ? <View style={styles.body}>{children}</View> : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  body: { marginTop: spacing.lg, gap: spacing.md },
});
