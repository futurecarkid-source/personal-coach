import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, useTheme } from '../../theme';
import { AppText } from './AppText';
import { GlassButton } from './GlassButton';
import { GlassSurface } from './GlassSurface';
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
  /** Título de la pantalla; en la web (sin barra nativa de iOS) se dibuja arriba con botón de volver. */
  title?: string;
  /** Pantalla a la que se llega desde otra (muestra "Atrás" en la web). */
  back?: boolean;
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
function WebHeader({ title, back }: { title: string; back: boolean }): React.JSX.Element {
  const router = useRouter();
  const canBack = back && router.canGoBack();
  return (
    <View style={styles.webHeader}>
      {canBack ? <GlassButton label="Atrás" icon="chevron.left" size="compact" haptic="light" onPress={() => router.back()} /> : null}
      <AppText variant="largeTitle">{title}</AppText>
    </View>
  );
}

export function Screen({ children, scroll = true, tabBarSpace = true, nativeHeader = false, plain = false, wide = false, title, back = false, contentStyle }: ScreenProps): React.JSX.Element {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const maxWidth = wide ? 1100 : 760;
  const [locked, setLocked] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lock = useCallback(() => setLocked(true), []);
  const unlock = useCallback(() => setLocked(false), []);
  const scrollLock = useMemo<ScrollLock>(() => ({ lock, unlock }), [lock, unlock]);
  const paddingBottom = (tabBarSpace ? FLOATING_TAB_BAR_CLEARANCE : 0) + insets.bottom + spacing.lg;

  const body = (
    <View style={[styles.inner, { maxWidth, paddingBottom, paddingTop: nativeHeader ? spacing.md : plain ? spacing.lg : insets.top + spacing.md }, contentStyle]}>{Platform.OS === 'web' && title ? <WebHeader title={title} back={back} /> : null}
      {children}
    </View>
  );

  return (
    <ScrollLockContext.Provider value={scrollLock}>
      <View style={[styles.root, { backgroundColor: plain ? 'transparent' : colors.background }]}>
        {/* El ScrollView va primero: así iOS lo reconoce para el título grande y el ajuste automático del espacio. */}
        {scroll ? (
          <ScrollView
            scrollEnabled={!locked}
            onScroll={Platform.OS === 'web' && title ? (e) => setScrolled(e.nativeEvent.contentOffset.y > 56) : undefined}
            scrollEventThrottle={32}
            contentInsetAdjustmentBehavior={nativeHeader ? 'automatic' : 'never'}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={styles.scrollContent}
          >
            {body}
          </ScrollView>
        ) : (
          <View style={styles.scrollContent}>{body}</View>
        )}
        {Platform.OS === 'web' && title && scrolled ? (
          <View pointerEvents="none" style={[styles.compact, { paddingTop: insets.top }]}>
            <GlassSurface radius={0} variant="regular" flat style={styles.compactGlass}>
              <AppText variant="headline" style={styles.compactTitle}>{title}</AppText>
            </GlassSurface>
          </View>
        ) : null}
        {plain ? null : (
          <>
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.behind, { backgroundColor: colors.background }]} />
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
  compact: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5 },
  compactGlass: { paddingVertical: spacing.md },
  compactTitle: { textAlign: 'center' },
  webHeader: { gap: spacing.sm, alignItems: 'flex-start' },
  scrollContent: { flexGrow: 1, alignItems: 'center' },
  inner: { width: '100%', paddingHorizontal: spacing.lg, gap: spacing.lg },
});
