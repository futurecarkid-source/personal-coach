import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedProps, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Line, Polygon, Polyline } from 'react-native-svg';
import { FORMATIONS, layoutFormation } from '../../core/formations';
import { arrowHeadPoints, clamp01, distance, snapToGrid, zigzagPoints } from '../../core/drawing';
import { newId } from '../../core/dates';
import { haptics, radii, spacing, springs, useTheme } from '../../theme';
import type { Drawing, DrawingKind, GameFormat, NormPoint, PlayFrame, Token } from '../../types';
import { AppText } from '../common/AppText';
import { useScrollLock } from '../common/Screen';
import { Chip } from '../common/Chip';
import { GlassButton } from '../common/GlassButton';
import { SegmentedControl } from '../common/SegmentedControl';
import { PITCH_L, PITCH_W, PitchSvg } from './PitchSvg';

type Tool = 'mover' | DrawingKind;

const TOKEN_SIZE = 30;
const SNAP_COLS = 7;
const SNAP_ROWS = 5;

const AnimatedLine = Animated.createAnimatedComponent(Line);

export interface TacticalBoardProps {
  /** Fotograma inicial (por ejemplo, una jugada guardada). */
  initialFrame?: PlayFrame;
  initialFormat?: GameFormat;
  initialFormation?: string;
  onChange?: (frame: PlayFrame, meta: { format: GameFormat; formation: string }) => void;
}

function buildTokens(formation: string, rivalFormation: string | null): Token[] {
  const own = layoutFormation(formation, 'propio').map<Token>((pos, i) => ({
    id: `own-${i}`,
    team: 'propio',
    label: i === 0 ? 'P' : String(i + 1),
    pos,
  }));
  const rival = rivalFormation
    ? layoutFormation(rivalFormation, 'rival').map<Token>((pos, i) => ({
        id: `rival-${i}`,
        team: 'rival',
        label: i === 0 ? 'P' : String(i + 1),
        pos,
      }))
    : [];
  const ball: Token = { id: 'ball', team: 'balon', label: '', pos: { x: 0.5, y: 0.5 } };
  return [...own, ...rival, ball];
}

/**
 * Pizarra táctica: campo vectorizado, fichas arrastrables con físicas de muelle (hilo de interfaz),
 * cambio de formación animado y herramientas de dibujo (pase, carrera, conducción).
 */
export function TacticalBoard({ initialFrame, initialFormat = 'f11', initialFormation = '4-3-3', onChange }: TacticalBoardProps): React.JSX.Element {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const [format, setFormat] = useState<GameFormat>(initialFormat);
  const [formation, setFormation] = useState(initialFormation);
  const [showRival, setShowRival] = useState(!initialFrame);
  const [tool, setTool] = useState<Tool>('mover');
  const [tokens, setTokens] = useState<Token[]>(() => initialFrame?.tokens ?? buildTokens(initialFormation, initialFormation));
  const [drawings, setDrawings] = useState<Drawing[]>(() => initialFrame?.drawings ?? []);
  const history = useRef<PlayFrame[]>([]);

  const boardHeight = (width * PITCH_W) / PITCH_L;

  const emit = useCallback(
    (nextTokens: Token[], nextDrawings: Drawing[], nextFormation: string, nextFormat: GameFormat) => {
      onChange?.({ tokens: nextTokens, drawings: nextDrawings }, { format: nextFormat, formation: nextFormation });
    },
    [onChange],
  );

  const pushHistory = useCallback(() => {
    history.current.push({ tokens, drawings });
    if (history.current.length > 50) history.current.shift();
  }, [tokens, drawings]);

  const applyFormation = useCallback(
    (nextFormation: string, nextFormat: GameFormat, withRival: boolean) => {
      pushHistory();
      const next = buildTokens(nextFormation, withRival ? nextFormation : null);
      setTokens(next);
      setDrawings([]);
      setFormation(nextFormation);
      setFormat(nextFormat);
      emit(next, [], nextFormation, nextFormat);
    },
    [emit, pushHistory],
  );

  const changeFormat = (next: GameFormat): void => {
    const first = FORMATIONS[next][0] ?? '4-3-3';
    applyFormation(first, next, showRival);
  };

  const moveToken = useCallback(
    (id: string, pos: NormPoint) => {
      pushHistory();
      const next = tokens.map((t) => (t.id === id ? { ...t, pos } : t));
      setTokens(next);
      emit(next, drawings, formation, format);
    },
    [drawings, emit, format, formation, pushHistory, tokens],
  );

  const addDrawing = useCallback(
    (kind: DrawingKind, from: NormPoint, to: NormPoint) => {
      pushHistory();
      const next = [...drawings, { id: newId('d'), kind, from, to }];
      setDrawings(next);
      emit(tokens, next, formation, format);
      haptics.medium();
    },
    [drawings, emit, format, formation, pushHistory, tokens],
  );

  const addExtra = (team: 'balon' | 'cono'): void => {
    pushHistory();
    const next = [...tokens, { id: newId(team), team, label: '', pos: { x: 0.5, y: 0.5 } } satisfies Token];
    setTokens(next);
    emit(next, drawings, formation, format);
  };

  const undo = (): void => {
    const previous = history.current.pop();
    if (!previous) return;
    haptics.light();
    setTokens(previous.tokens);
    setDrawings(previous.drawings);
    emit(previous.tokens, previous.drawings, formation, format);
  };

  const clearDrawings = (): void => {
    if (drawings.length === 0) return;
    pushHistory();
    setDrawings([]);
    emit(tokens, [], formation, format);
  };

  const toggleRival = (): void => {
    const next = !showRival;
    setShowRival(next);
    applyFormation(formation, format, next);
  };

  const onLayout = (event: LayoutChangeEvent): void => setWidth(event.nativeEvent.layout.width);

  return (
    <View style={styles.wrapper}>
      <SegmentedControl
        options={[
          { value: 'f11', label: 'Fútbol 11' },
          { value: 'f8', label: 'Fútbol 8' },
          { value: 'f7', label: 'Fútbol 7' },
          { value: 'futsal', label: 'Futsal' },
        ]}
        value={format}
        onChange={changeFormat}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {FORMATIONS[format].map((id) => (
          <Chip key={id} label={id} selected={id === formation} onPress={() => applyFormation(id, format, showRival)} />
        ))}
      </ScrollView>

      <View style={[styles.board, { borderRadius: radii.card, borderColor: colors.glassBorder }]} onLayout={onLayout}>
        {width > 0 ? (
          <>
            <PitchSvg width={width}>
              <Drawings drawings={drawings} />
            </PitchSvg>
            <DrawingLayer enabled={tool !== 'mover'} kind={tool === 'mover' ? 'pase' : tool} width={width} height={boardHeight} onCommit={addDrawing} />
            {tokens.map((token) => (
              <DraggableToken
                key={token.id}
                token={token}
                width={width}
                height={boardHeight}
                enabled={tool === 'mover'}
                onCommit={moveToken}
              />
            ))}
          </>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="Mover" selected={tool === 'mover'} onPress={() => setTool('mover')} />
        <Chip label="Pase" selected={tool === 'pase'} onPress={() => setTool('pase')} />
        <Chip label="Carrera" selected={tool === 'carrera'} onPress={() => setTool('carrera')} />
        <Chip label="Conducción" selected={tool === 'conduccion'} onPress={() => setTool('conduccion')} />
      </ScrollView>

      <View style={styles.actions}>
        <GlassButton label="Deshacer" icon="arrow.uturn.backward" size="compact" haptic="light" onPress={undo} />
        <GlassButton label="Borrar trazos" icon="eraser" size="compact" haptic="light" onPress={clearDrawings} />
        <GlassButton label="Balón" icon="soccerball" size="compact" haptic="light" onPress={() => addExtra('balon')} />
        <GlassButton label="Cono" icon="triangle.fill" size="compact" haptic="light" onPress={() => addExtra('cono')} />
        <GlassButton label={showRival ? 'Quitar rival' : 'Poner rival'} size="compact" haptic="light" onPress={toggleRival} />
      </View>
      <AppText variant="caption" tone="secondary">
        Mover: arrastra las fichas. Pase, carrera y conducción: dibuja un trazo con el dedo.
      </AppText>
    </View>
  );
}

function Drawings({ drawings }: { drawings: readonly Drawing[] }): React.JSX.Element {
  return (
    <>
      {drawings.map((d) => {
        const from = { x: d.from.x * PITCH_L, y: d.from.y * PITCH_W };
        const to = { x: d.to.x * PITCH_L, y: d.to.y * PITCH_W };
        const head = arrowHeadPoints(from, to, 2.4);
        const color = d.kind === 'pase' ? '#FFFFFF' : d.kind === 'carrera' ? '#FFD479' : '#9FD8FF';
        return (
          <React.Fragment key={d.id}>
            {d.kind === 'conduccion' ? (
              <Polyline points={zigzagPoints(from, to, 0.9, 3.2).map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={color} strokeWidth={0.5} />
            ) : (
              <Line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={color} strokeWidth={0.55} strokeDasharray={d.kind === 'carrera' ? '1.6 1.2' : undefined} />
            )}
            <Polygon points={head.map((p) => `${p.x},${p.y}`).join(' ')} fill={color} />
          </React.Fragment>
        );
      })}
    </>
  );
}

interface DrawingLayerProps {
  enabled: boolean;
  kind: DrawingKind;
  width: number;
  height: number;
  onCommit: (kind: DrawingKind, from: NormPoint, to: NormPoint) => void;
}

/** Capa transparente que recoge el trazo y muestra una vista previa mientras se dibuja. */
function DrawingLayer({ enabled, kind, width, height, onCommit }: DrawingLayerProps): React.JSX.Element {
  const { lock, unlock } = useScrollLock();
  const x1 = useSharedValue(0);
  const y1 = useSharedValue(0);
  const x2 = useSharedValue(0);
  const y2 = useSharedValue(0);
  const visible = useSharedValue(0);

  const commit = useCallback(
    (ax: number, ay: number, bx: number, by: number) => {
      const from = { x: clamp01(ax / width), y: clamp01(ay / height) };
      const to = { x: clamp01(bx / width), y: clamp01(by / height) };
      if (distance({ x: ax, y: ay }, { x: bx, y: by }) > 24) onCommit(kind, from, to);
    },
    [height, kind, onCommit, width],
  );

  const gesture = Gesture.Pan()
    .enabled(enabled)
    .minDistance(2)
    .onBegin((e) => {
      x1.set(e.x);
      y1.set(e.y);
      x2.set(e.x);
      y2.set(e.y);
      visible.set(1);
      scheduleOnRN(lock);
    })
    .onUpdate((e) => {
      x2.set(e.x);
      y2.set(e.y);
    })
    .onEnd(() => {
      scheduleOnRN(commit, x1.value, y1.value, x2.value, y2.value);
    })
    .onFinalize(() => {
      visible.set(0);
      scheduleOnRN(unlock);
    });

  const previewProps = useAnimatedProps(() => ({
    x1: x1.value,
    y1: y1.value,
    x2: x2.value,
    y2: y2.value,
    opacity: visible.value,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View style={[StyleSheet.absoluteFill]} pointerEvents={enabled ? 'auto' : 'none'}>
        <Svg width={width} height={height} pointerEvents="none">
          <AnimatedLine animatedProps={previewProps} stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeDasharray="6 6" />
        </Svg>
      </View>
    </GestureDetector>
  );
}

interface DraggableTokenProps {
  token: Token;
  width: number;
  height: number;
  enabled: boolean;
  onCommit: (id: string, pos: NormPoint) => void;
}

function DraggableToken({ token, width, height, enabled, onCommit }: DraggableTokenProps): React.JSX.Element {
  const { colors } = useTheme();
  const { lock, unlock } = useScrollLock();
  const size = token.team === 'balon' ? 20 : token.team === 'cono' ? 18 : TOKEN_SIZE;
  const x = useSharedValue(token.pos.x * width);
  const y = useSharedValue(token.pos.y * height);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const lifted = useSharedValue(0);

  // Cuando la formación o el tamaño cambian, la ficha viaja a su nueva posición con muelle.
  useEffect(() => {
    x.set(withSpring(token.pos.x * width, springs.heavy));
    y.set(withSpring(token.pos.y * height, springs.heavy));
  }, [height, token.pos.x, token.pos.y, width, x, y]);

  const finish = useCallback(
    (px: number, py: number) => {
      const snapped = snapToGrid({ x: clamp01(px / width), y: clamp01(py / height) }, SNAP_COLS * 3, SNAP_ROWS * 3);
      // Se ajusta solo si queda muy cerca de una intersección; si no, se respeta la posición exacta.
      const exact = { x: clamp01(px / width), y: clamp01(py / height) };
      const near = Math.abs(snapped.x - exact.x) < 0.012 && Math.abs(snapped.y - exact.y) < 0.012;
      onCommit(token.id, near ? snapped : exact);
    },
    [height, onCommit, token.id, width],
  );

  const gesture = Gesture.Pan()
    .enabled(enabled)
    .onBegin(() => {
      startX.set(x.value);
      startY.set(y.value);
      lifted.set(withSpring(1, springs.snappy));
      scheduleOnRN(lock);
      scheduleOnRN(haptics.selection);
    })
    .onUpdate((e) => {
      x.set(Math.max(0, Math.min(width, startX.value + e.translationX)));
      y.set(Math.max(0, Math.min(height, startY.value + e.translationY)));
    })
    .onEnd(() => {
      scheduleOnRN(finish, x.value, y.value);
      scheduleOnRN(haptics.soft);
    })
    .onFinalize(() => {
      lifted.set(withSpring(0, springs.bouncy));
      scheduleOnRN(unlock);
    });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value - size / 2 }, { translateY: y.value - size / 2 }, { scale: 1 + lifted.value * 0.22 }],
    shadowOpacity: 0.15 + lifted.value * 0.3,
    zIndex: lifted.value > 0.05 ? 10 : 1,
  }));

  const bg =
    token.team === 'propio' ? colors.accent : token.team === 'rival' ? colors.deepBlue : token.team === 'balon' ? '#FFFFFF' : '#FFC857';

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        accessible
        accessibilityLabel={token.team === 'balon' ? 'Balón' : token.team === 'cono' ? 'Cono' : `Ficha ${token.team} ${token.label}`}
        style={[
          styles.token,
          { width: size, height: size, borderRadius: token.team === 'cono' ? 4 : size / 2, backgroundColor: bg, shadowColor: '#000' },
          style,
        ]}
      >
        {token.label ? (
          <AppText variant="caption" tone="onAccent" style={styles.tokenLabel}>
            {token.label}
          </AppText>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.md },
  chips: { gap: spacing.sm, paddingVertical: 2 },
  board: { width: '100%', overflow: 'hidden', borderWidth: 1 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  token: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  tokenLabel: { fontWeight: '700' },
});
