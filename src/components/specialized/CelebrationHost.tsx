import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useAppDispatch, useAppState } from '../../context';
import { levelFromXp } from '../../core/gamification';
import { newlyMet, rankFor } from '../../core/progression';
import { haptics, radii, spacing, useTheme } from '../../theme';
import { AppText } from '../common/AppText';
import { GlassButton } from '../common/GlassButton';
import { GlassSurface } from '../common/GlassSurface';
import { Icon, type IconName } from '../common/Icon';
import { Confetti } from './Confetti';

export interface Celebration {
  id: string;
  kind: 'logro' | 'nivel' | 'mision';
  title: string;
  subtitle: string;
  icon: IconName;
  xp?: number;
}

interface CelebrateApi {
  celebrate: (c: Celebration) => void;
}

const CelebrateContext = createContext<CelebrateApi>({ celebrate: () => undefined });

export function useCelebrate(): CelebrateApi {
  return useContext(CelebrateContext);
}

/**
 * Cola de celebraciones (logros, subidas de nivel, misiones) con confeti y vibración.
 * También detecta por sí sola los logros que se cumplen y las subidas de nivel.
 */
export function CelebrationHost({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { state, hydrated } = useAppState();
  const dispatch = useAppDispatch();
  const [queue, setQueue] = useState<Celebration[]>([]);
  const [burst, setBurst] = useState(0);
  const seen = useRef(new Set<string>());

  const celebrate = useCallback((c: Celebration) => {
    if (seen.current.has(c.id)) return;
    seen.current.add(c.id);
    setQueue((q) => [...q, c]);
  }, []);

  const current = queue[0] ?? null;
  useEffect(() => {
    if (!current) return;
    haptics.success();
    // La ráfaga de confeti se dispara al aparecer cada celebración.
    const id = setTimeout(() => setBurst((b) => b + 1), 0);
    return () => clearTimeout(id);
  }, [current]);

  // Logros nuevos
  useEffect(() => {
    if (!hydrated || !state.player) return;
    const fresh = newlyMet(state);
    for (const def of fresh) {
      dispatch({ type: 'UNLOCK_ACHIEVEMENT', id: def.id, at: new Date().toISOString(), xp: def.xp });
      celebrate({ id: `logro:${def.id}`, kind: 'logro', title: def.title, subtitle: def.description, icon: def.icon as IconName, xp: def.xp });
    }
  }, [hydrated, state, dispatch, celebrate]);

  // Subidas de nivel
  const level = levelFromXp(state.gamification.xp);
  useEffect(() => {
    if (!hydrated || !state.player) return;
    if (level > state.gamification.celebratedLevel) {
      const rank = rankFor(level);
      celebrate({ id: `nivel:${level}`, kind: 'nivel', title: `¡Nivel ${level}!`, subtitle: `${rank.name} · ${rank.blurb}`, icon: 'arrow.up.circle.fill' });
      dispatch({ type: 'ACK_LEVEL', level });
    }
  }, [hydrated, level, state.gamification.celebratedLevel, state.player, dispatch, celebrate]);

  const api = useMemo<CelebrateApi>(() => ({ celebrate }), [celebrate]);
  const next = (): void => setQueue((q) => q.slice(1));

  return (
    <CelebrateContext.Provider value={api}>
      {children}
      <CelebrationCard item={current} burst={burst} onClose={next} />
    </CelebrateContext.Provider>
  );
}

function CelebrationCard({ item, burst, onClose }: { item: Celebration | null; burst: number; onClose: () => void }): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <Modal visible={item !== null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Cerrar">
        {item ? (
          <>
            <Confetti trigger={burst} />
            <GlassSurface radius={radii.sheet} variant="regular" style={styles.card}>
              <View style={styles.inner}>
                <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                  <Icon name={item.icon} size={38} color="#FFFFFF" />
                </View>
                <AppText variant="label" tone="accent">{item.kind === 'logro' ? 'Logro desbloqueado' : item.kind === 'nivel' ? 'Subiste de nivel' : 'Misión cumplida'}</AppText>
                <AppText variant="largeTitle" style={styles.center}>{item.title}</AppText>
                <AppText variant="body" tone="secondary" style={styles.center}>{item.subtitle}</AppText>
                {item.xp ? <AppText variant="digits" tone="volt">+{item.xp} XP</AppText> : null}
                <GlassButton label="¡Vamos!" variant="primary" haptic="medium" fullWidth onPress={onClose} />
              </View>
            </GlassSurface>
          </>
        ) : null}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(8,10,14,0.55)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  card: { width: '100%', maxWidth: 360 },
  inner: { alignItems: 'center', gap: spacing.md, padding: spacing.xl },
  badge: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
});
