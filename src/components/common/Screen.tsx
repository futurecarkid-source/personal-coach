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
  /** La pantalla tiene barra de título nativa (título grande de iOS): el sistema ajusta el espacio superior. */
  nativeHeader?: boolean;
  /** Permite usar el ancho de la tablet (dos columnas con `Columns`). */
  wide?: boolean;
  /** Sin degradado ni manchas de fondo (hojas, donde se ve el material del sistema). */
  plain?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Fondo de las pantallas: degradado suave con manchas de color. El vidrio líquido necesita
 * contenido detrás para verse (sobre blanco liso casi no se distingue), por eso hay color de fondo.
 */
export function Screen({ children, scroll = true, tabBarSpace = true, nativeHeader = false, plain = false, wide = false, contentStyle }: ScreenProps): React.JSX.Element {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const maxWidth = wide ? 1100 : 760;
  const [locked, setLocked] = useState(false);
  const lock = useCallback(() => setLocked(true), []);
  const unlock = useCallback(() => setLocked(false), []);
  const scrollLock = useMemo<ScrollLock>(() => ({ lock, unlock }), [lock, unlock]);
  const paddingBottom = (tabBarSpace ? FLOATING_TAB_BAR_CLEARANCE : 0) + insets.bottom + spacing.lg;

  const body = (
    <View style={[styles.inner, { maxWidth, paddingBottom, paddingTop: nativeHeader ? spacing.md : plain ? spacing.lg : insets.top + spacing.md }, contentStyle]}>{children}</View>
  );

  return (
    <ScrollLockContext.Provider value={scrollLock}>
      <View style={[styles.root, { backgroundColor: plain ? 'transparent' : colors.background }]}>
        {/* El ScrollView va primero: así iOS lo reconoce para el título grande y el ajuste automático del espacio. */}
        {scroll ? (
          <ScrollView
            scrollEnabled={!locked}
            contentInsetAdjustmentBehavior={nativeHeader ? 'automatic' : 'never'}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {body}
          </ScrollView>
        ) : (
          <View style={styles.scrollContent}>{body}</View>
        )}
        {plain ? null : (
          <>
            <LinearGradient
              pointerEvents="none"
              colors={isDark ? ['#12151A', '#090B0E'] : ['#F2F5F8', '#E3E8ED']}
              style={[StyleSheet.absoluteFill, styles.behind]}
            />
            {/* Franjas diagonales: dan color y movimiento detrás del vidrio. */}
            <View pointerEvents="none" style={[styles.stripe, styles.behind, { backgroundColor: colors.accent, opacity: isDark ? 0.32 : 0.28, top: -width * 0.1, right: -width * 0.28, width: width * 0.75, height: width * 0.34 }]} />
            <View pointerEvents="none" style={[styles.stripe, styles.behind, { backgroundColor: colors.accent, opacity: isDark ? 0.18 : 0.14, top: width * 0.12, right: -width * 0.45, width: width * 0.9, height: width * 0.16 }]} />
            <View pointerEvents="none" style={[styles.stripe, styles.behind, { backgroundColor: colors.graphite, opacity: isDark ? 0.55 : 0.2, top: width * 0.95, left: -width * 0.5, width: width * 1.1, height: width * 0.4 }]} />
          </>
        )}
      </View>
    </ScrollLockContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  behind: { zIndex: -1 },
  stripe: { position: 'absolute', borderRadius: 28, transform: [{ rotate: '-24deg' }] },
  scrollContent: { flexGrow: 1, alignItems: 'center' },
  inner: { width: '100%', paddingHorizontal: spacing.lg, gap: spacing.lg },
});
