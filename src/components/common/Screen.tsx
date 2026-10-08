import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, useTheme } from '../../theme';
import { FLOATING_TAB_BAR_CLEARANCE } from '../../navigation/constants';

interface ScrollLock {
  lock: () => void;
  unlock: () => void;
}

const ScrollLockContext = createContext<ScrollLock>({ lock: () => undefined, unlock: () => undefined });

/**
 * Los gestos de arrastre (fichas de la pizarra, dibujo) bloquean el scroll de la pantalla mientras duran,
 * para que arrastrar hacia arriba o abajo no desplace la página.
 */
export function useScrollLock(): ScrollLock {
  return useContext(ScrollLockContext);
}

export interface ScreenProps {
  children: React.ReactNode;
  /** Si es `false` no hay scroll (pantallas con gestos propios, como la pizarra). */
  scroll?: boolean;
  /** Reserva espacio para la barra flotante inferior. */
  tabBarSpace?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Fondo de las pantallas: degradado suave con manchas de color. El vidrio líquido necesita
 * contenido detrás para verse (sobre blanco liso casi no se distingue), por eso hay color de fondo.
 */
export function Screen({ children, scroll = true, tabBarSpace = true, contentStyle }: ScreenProps): React.JSX.Element {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const maxWidth = 760;
  const [locked, setLocked] = useState(false);
  const lock = useCallback(() => setLocked(true), []);
  const unlock = useCallback(() => setLocked(false), []);
  const scrollLock = useMemo<ScrollLock>(() => ({ lock, unlock }), [lock, unlock]);
  const paddingBottom = (tabBarSpace ? FLOATING_TAB_BAR_CLEARANCE : 0) + insets.bottom + spacing.lg;

  const body = (
    <View style={[styles.inner, { maxWidth, paddingBottom, paddingTop: insets.top + spacing.md }, contentStyle]}>{children}</View>
  );

  return (
    <ScrollLockContext.Provider value={scrollLock}>
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        pointerEvents="none"
        colors={isDark ? ['#17171A', '#0E0E10'] : ['#FBFBFD', '#EDEDF2']}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={[styles.blob, { backgroundColor: colors.accent, opacity: isDark ? 0.22 : 0.2, top: -width * 0.25, right: -width * 0.3, width: width * 0.9, height: width * 0.9 }]} />
      <View pointerEvents="none" style={[styles.blob, { backgroundColor: colors.deepBlue, opacity: isDark ? 0.25 : 0.12, top: width * 0.7, left: -width * 0.4, width: width * 0.8, height: width * 0.8 }]} />
      {scroll ? (
        <ScrollView
          scrollEnabled={!locked}
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {body}
        </ScrollView>
      ) : (
        <View style={styles.scrollContent}>{body}</View>
      )}
    </View>
    </ScrollLockContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  blob: { position: 'absolute', borderRadius: 999 },
  scrollContent: { flexGrow: 1, alignItems: 'center' },
  inner: { width: '100%', paddingHorizontal: spacing.lg, gap: spacing.lg },
});
