import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInLeft, FadeInRight } from 'react-native-reanimated';
import type { IconName } from '../components/common/Icon';
import { AppText, FieldSurface, GlassButton, GlassSurface, Icon, ProgressBar, Screen } from '../components/common';
import { Confetti } from '../components/specialized/Confetti';
import { PlanCreated } from '../components/specialized/PlanCreated';
import { PlayerCard3D } from '../components/specialized/PlayerCard3D';
import { ATTRIBUTE_LABELS, BODY_ZONE_LABELS, LEVEL_LABELS, POSITION_LABELS } from '../content/attributeLabels';
import { useAppDispatch } from '../context';
import { newId, toISODate } from '../core/dates';
import { planDays, startWithTraining } from '../core/planner';
import { estimateAttributes, headlineKeys, type SelfAssessment } from '../core/ovr';
import { ensureNotificationPermission } from '../services/reminders';
import { haptics, radii, spacing, useTheme } from '../theme';
import {
  AGE_BANDS,
  BODY_ZONES,
  EQUIPMENT,
  FEET,
  GOALS,
  LEVELS,
  POSITIONS,
  isMinor,
  type AgeBand,
  type BodyZone,
  type Equipment,
  type Foot,
  type Goal,
  type Level,
  type OutfieldAttributeKey,
  type Player,
  type Position,
} from '../types';

const AGE_LABELS: Record<AgeBand, string> = {
  menor13: 'Menos de 13 años',
  de13a15: '13 a 15 años',
  de16a17: '16 a 17 años',
  adulto: '18 años o más',
};

const COUNTRY_NAMES: Record<string, string> = { CO: 'Colombia', MX: 'México', AR: 'Argentina', CL: 'Chile', PE: 'Perú', EC: 'Ecuador', VE: 'Venezuela', UY: 'Uruguay', PY: 'Paraguay', BO: 'Bolivia', CR: 'Costa Rica', PA: 'Panamá', DO: 'Rep. Dominicana', GT: 'Guatemala', HN: 'Honduras', SV: 'El Salvador', NI: 'Nicaragua', ES: 'España', US: 'Estados Unidos', BR: 'Brasil' };
const COUNTRIES = ['CO', 'MX', 'AR', 'CL', 'PE', 'EC', 'VE', 'UY', 'PY', 'BO', 'CR', 'PA', 'DO', 'GT', 'HN', 'SV', 'NI', 'ES', 'US', 'BR'] as const;

const EQUIPMENT_LABELS: Record<Equipment, string> = {
  ninguno: 'Sin equipo',
  bandas: 'Bandas elásticas',
  mancuernas: 'Mancuernas',
  gimnasio: 'Gimnasio',
  balon: 'Balón',
  conos: 'Conos',
  escalera: 'Escalera de agilidad',
};

const GOAL_LABELS: Record<Goal, string> = {
  subir_nivel: 'Subir de nivel o fichar',
  prevenir_lesiones: 'Prevenir lesiones',
  mejorar_mentalidad: 'Mejorar mentalidad',
  mejorar_fisico: 'Mejorar mi físico',
  entender_juego: 'Entender mejor el juego',
  llevar_estadisticas: 'Llevar mis estadísticas',
};

const FOOT_LABELS: Record<Foot, string> = { izquierdo: 'Izquierdo', derecho: 'Derecho', ambos: 'Ambos' };

const APTITUDE_QUESTIONS = [
  '¿Un médico te ha dicho que tienes un problema del corazón o de la presión?',
  '¿Sientes dolor en el pecho cuando haces ejercicio?',
  '¿Te has mareado o desmayado haciendo ejercicio?',
  '¿Tienes una lesión de huesos o articulaciones que empeora con el ejercicio?',
] as const;

const GOAL_ICON: Record<Goal, IconName> = { subir_nivel: 'paperplane.fill', prevenir_lesiones: 'shield.fill', mejorar_mentalidad: 'brain.head.profile', mejorar_fisico: 'figure.run', entender_juego: 'sportscourt.fill', llevar_estadisticas: 'chart.bar.fill' };
const EQUIPMENT_ICON: Record<Equipment, IconName> = { ninguno: 'hand.raised.fill', bandas: 'lasso', mancuernas: 'dumbbell.fill', gimnasio: 'building.2.fill', balon: 'soccerball', conos: 'triangle.fill', escalera: 'line.3.horizontal' };
const PERSONAS = [
  { id: 'motivador', title: 'Motivador', text: 'Te anima y celebra cada paso.', icon: 'flame.fill' },
  { id: 'exigente', title: 'Exigente', text: 'Directo, te exige más.', icon: 'target' },
  { id: 'cientifico', title: 'Científico', text: 'Explica el porqué de todo.', icon: 'atom' },
  { id: 'calmado', title: 'Calmado', text: 'Sin presión, a tu ritmo.', icon: 'leaf.fill' },
] as const;
type Persona = (typeof PERSONAS)[number]['id'];
type Wearable = 'ninguno' | 'applewatch' | 'otro';

const RATING_WORD = (v: number): string => (v <= 3 ? 'Por mejorar' : v <= 6 ? 'Normal' : v <= 8 ? 'Bueno' : 'De élite');

function toggle<T>(list: readonly T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

interface Step {
  id: string;
  /** Pasos de una sola opción avanzan solos al elegir. */
  auto?: boolean;
}

/** Fila grande y tocable (vidrio), con muelle al pulsar y marca al estar elegida. */
function OptionCard({ label, hint, icon, badge, tint, selected, onPress, index = 0, compact = false }: { label: string; hint?: string; icon?: IconName; badge?: string; tint?: string; selected: boolean; onPress: () => void; index?: number; compact?: boolean }): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 45).springify().damping(18)} style={compact ? styles.compactCell : undefined}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={label}
        onPress={() => {
          haptics.selection();
          onPress();
        }}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <GlassSurface radius={radii.card} flat tint={selected ? colors.pitch : undefined} interactive>
          <View style={[styles.option, compact && styles.optionCompact, selected && { borderColor: colors.pitch }]}>
            {icon || badge ? (
              <View style={[styles.tile, { backgroundColor: tint ?? (selected ? colors.pitch : colors.surfaceStrong) }]}>
                {icon ? <Icon name={icon} size={18} color={tint || selected ? '#FFFFFF' : colors.text} /> : <AppText variant="caption" style={{ color: selected ? '#FFFFFF' : colors.text, fontWeight: '700' }}>{badge}</AppText>}
              </View>
            ) : null}
            <View style={styles.optionTexts}>
              <AppText variant="headline">{label}</AppText>
              {hint ? <AppText variant="caption" tone="secondary">{hint}</AppText> : null}
            </View>
            {selected ? <Icon name="checkmark" size={18} color={colors.pitch} /> : null}
          </View>
        </GlassSurface>
      </Pressable>
    </Animated.View>
  );
}

/**
 * Cuestionario inicial: una pregunta por pantalla, con animaciones, vibración y opciones grandes de vidrio.
 * Sin límite de preguntas porque cada una es un toque. Edad primero (define las salvaguardas) y sin pantalla de pago al final.
 * La tarjeta se revela al terminar.
 */
export function OnboardingScreen(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd');
  const [ageBand, setAgeBand] = useState<AgeBand | null>(null);
  const [answers, setAnswers] = useState<(boolean | null)[]>(APTITUDE_QUESTIONS.map(() => null));
  const [nickname, setNickname] = useState('');
  const [number, setNumber] = useState(10);
  const [country, setCountry] = useState<string>('CO');
  const [position, setPosition] = useState<Position | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [foot, setFoot] = useState<Foot | null>(null);
  const [days, setDays] = useState(3);
  const [minutes, setMinutes] = useState(40);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [zones, setZones] = useState<BodyZone[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [self, setSelf] = useState<SelfAssessment>({});
  const [sleep, setSleep] = useState(8);
  const [persona, setPersona] = useState<Persona>('motivador');
  const [wearable, setWearable] = useState<Wearable | null>(null);
  const [reminders, setReminders] = useState<boolean | null>(null);
  const [planReady, setPlanReady] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const anyYes = answers.some((a) => a === true);
  const headline = useMemo<OutfieldAttributeKey[]>(
    () => (position === null || position === 'POR' ? [] : headlineKeys(position).filter((k): k is OutfieldAttributeKey => k in ATTRIBUTE_LABELS)),
    [position],
  );
  const name = nickname.trim() || 'jugador';

  const steps = useMemo<Step[]>(
    () => [
      { id: 'bienvenida' },
      { id: 'edad', auto: true },
      ...APTITUDE_QUESTIONS.map((_, i) => ({ id: `salud${i}`, auto: true })),
      { id: 'aviso' },
      { id: 'apodo' },
      { id: 'numero' },
      { id: 'pais', auto: true },
      { id: 'posicion', auto: true },
      { id: 'pie', auto: true },
      { id: 'nivel', auto: true },
      { id: 'objetivos' },
      { id: 'dias' },
      { id: 'minutos' },
      { id: 'equipo' },
      { id: 'molestias' },
      ...headline.map((k) => ({ id: `auto-${k}` })),
      { id: 'sueno' },
      { id: 'coach', auto: true },
      { id: 'reloj', auto: true },
      { id: 'avisos', auto: true },
      { id: 'plan' },
      { id: 'tarjeta' },
    ],
    [headline],
  );
  const step = steps[Math.min(idx, steps.length - 1)]!;

  const go = (delta: 1 | -1): void => {
    setDir(delta === 1 ? 'fwd' : 'back');
    setIdx((i) => Math.max(0, Math.min(steps.length - 1, i + delta)));
  };
  const choose = (apply: () => void): void => {
    apply();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => go(1), 260);
  };

  const buildPlayer = (): Player | null => {
    if (!ageBand || !position || !level) return null;
    return {
      id: 'preview',
      nickname: name.slice(0, 24),
      number,
      country,
      position,
      secondaryPositions: [],
      level,
      foot: foot ?? 'derecho',
      club: null,
      ageBand,
      attributes: estimateAttributes({ position, level, selfAssessment: self }),
      selfAssessment: Object.fromEntries(Object.entries(self).filter((e): e is [string, number] => typeof e[1] === 'number')),
      createdAt: new Date().toISOString(),
    };
  };

  const finish = async (): Promise<void> => {
    const preview = buildPlayer();
    if (!preview) return;
    const notify = reminders === true ? await ensureNotificationPermission() : false;
    dispatch({ type: 'SET_SETTINGS', patch: { healthNoticeAccepted: true, sleepGoalHours: sleep, coachPersona: persona, wearable: wearable ?? 'ninguno', remindersEnabled: notify } });
    dispatch({
      type: 'SET_PLAN_PREFS',
      prefs: { daysPerWeek: days, minutesPerSession: minutes, equipment: equipment.length > 0 ? equipment : ['ninguno'], discomfortZones: zones, matchDates: [], goals },
    });
    dispatch({ type: 'SET_PLAYER', player: { ...preview, id: newId('player') } });
    haptics.success();
  };

    const needsButton = !step.auto;
  const canContinue =
    step.id === 'edad' ? ageBand !== null : step.id === 'apodo' ? nickname.trim().length > 0 : true;
  const total = steps.length - 1;
  const entering = dir === 'fwd' ? FadeInRight.springify().damping(20) : FadeInLeft.springify().damping(20);

  const title = ((): string => {
    switch (step.id) {
      case 'bienvenida': return '¡Hola! Vamos a crear tu tarjeta de jugador';
      case 'edad': return '¿Cuántos años tienes?';
      case 'aviso': return anyYes ? 'Cuida tu salud primero' : 'Todo claro';
      case 'apodo': return '¿Cómo te llamamos?';
      case 'numero': return `${name}, ¿qué número usas?`;
      case 'pais': return '¿De dónde eres?';
      case 'posicion': return `${name}, ¿en qué posición juegas?`;
      case 'pie': return '¿Con qué pie pegas?';
      case 'nivel': return '¿En qué nivel juegas?';
      case 'objetivos': return '¿Qué quieres lograr?';
      case 'dias': return '¿Cuántos días puedes entrenar?';
      case 'minutos': return '¿Cuánto tiempo por sesión?';
      case 'equipo': return '¿Con qué cuentas para entrenar?';
      case 'molestias': return '¿Te molesta algo ahora?';
      case 'sueno': return '¿Cuántas horas quieres dormir?';
      case 'coach': return '¿Cómo prefieres a tu coach?';
      case 'reloj': return '¿Tienes reloj o banda de pulso?';
      case 'avisos': return '¿Te avisamos para cuidar tu racha?';
      case 'plan': return '';
      case 'tarjeta': return `¡Lista, ${name}!`;
      default:
        if (step.id.startsWith('salud')) return 'Una pregunta de salud';
        if (step.id.startsWith('auto-')) return `¿Cómo te ves en ${ATTRIBUTE_LABELS[step.id.slice(5) as OutfieldAttributeKey].full.toLowerCase()}?`;
        return '';
    }
  })();
  const subtitle = ((): string | null => {
    switch (step.id) {
      case 'bienvenida': return 'Preguntas rápidas, de a una. Tarda unos 2 minutos.';
      case 'edad': return 'Con esto cuidamos tu entrenamiento.';
      case 'aviso': return 'Fulbito es una herramienta de entrenamiento, no un dispositivo médico: no diagnostica ni trata lesiones y no reemplaza a un médico o fisioterapeuta.';
      case 'apodo': return 'Saldrá en tu tarjeta.';
      case 'objetivos': return 'Elige los que quieras.';
      case 'dias': return 'Por semana. Siempre puedes cambiarlo.';
      case 'equipo': return 'Elige lo que tengas a mano.';
      case 'molestias': return 'Evitaremos esa zona en tu plan.';
      case 'sueno': return 'Tu meta de descanso cada noche.';
      case 'tarjeta': return 'Esta es tu tarjeta inicial. Crece con cada sesión.';
      default:
        if (step.id.startsWith('auto-')) return 'Puntúate de 1 a 10. Se corrige luego con tus partidos.';
        return null;
    }
  })();

  const body = ((): React.JSX.Element | null => {
    switch (step.id) {
      case 'bienvenida':
        return (
          <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.hero}>
            <Icon name="soccerball" size={110} color={colors.text} />
            <AppText variant="caption" tone="secondary" style={styles.copyright}>© {new Date().getFullYear()} Fulbito. Todos los derechos reservados.</AppText>
          </Animated.View>
        );
      case 'plan':
        return (
          <PlanCreated
            week={startWithTraining(planDays({ startDate: toISODate(new Date()), days: 7, daysPerWeek: days, minutesPerSession: minutes, equipment: equipment.length > 0 ? equipment : ['ninguno'], discomfortZones: zones, matchDates: [] }), false)}
            tasks={[
              `Ajustando a ${days} ${days === 1 ? 'día' : 'días'} por semana`,
              `Sesiones de unos ${minutes} minutos`,
              zones.length > 0 ? 'Evitando las zonas que te molestan' : 'Combinando fuerza, velocidad y técnica',
              goals.includes('prevenir_lesiones') ? 'Sumando prevención de lesiones' : 'Eligiendo ejercicios con tu equipo',
            ]}
            onReady={() => setPlanReady(true)}
          />
        );
      case 'edad':
        return (
          <View style={styles.list}>
            {AGE_BANDS.map((b, i) => (
              <OptionCard key={b} index={i} label={AGE_LABELS_FULL[b]} selected={ageBand === b} onPress={() => choose(() => setAgeBand(b))} />
            ))}
            {ageBand && isMinor(ageBand) ? (
              <AppText variant="callout" tone="secondary">Al ser menor de edad, algunas funciones (IA con fotos o video y compras) estarán desactivadas y se recomienda usar la app con un adulto responsable.</AppText>
            ) : null}
                      </View>
        );
      case 'aviso':
        return anyYes ? (
          <AppText variant="body" tone="danger">Por tus respuestas, consulta con un profesional de la salud antes de entrenar. Si te mareas, sientes dolor fuerte o falta de aire, para y busca atención.</AppText>
        ) : (
          <AppText variant="body" tone="secondary">Si algo te duele o te sientes mal, para y consulta a un profesional.</AppText>
        );
      case 'apodo':
        return (
          <FieldSurface>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="Tu apodo"
              placeholderTextColor={colors.textSecondary}
              maxLength={24}
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={() => nickname.trim() && go(1)}
              style={[styles.bigInput, { color: colors.text }]}
              accessibilityLabel="Apodo en la tarjeta"
            />
          </FieldSurface>
        );
      case 'numero':
        return <BigStepper value={number} min={1} max={99} onChange={setNumber} unit="" />;
      case 'pais':
        return (
          <View style={styles.grid}>
            {COUNTRIES.map((c, i) => (
              <OptionCard key={c} compact index={i} badge={c} label={COUNTRY_NAMES[c] ?? c} selected={country === c} onPress={() => choose(() => setCountry(c))} />
            ))}
          </View>
        );
      case 'posicion':
        return (
          <View style={styles.list}>
            {POSITIONS.map((p, i) => (
              <OptionCard key={p} index={i} label={`${p} · ${POSITION_LABELS[p]}`} selected={position === p} onPress={() => choose(() => setPosition(p))} />
            ))}
          </View>
        );
      case 'pie':
        return (
          <View style={styles.list}>
            {FEET.map((f, i) => (
              <OptionCard key={f} index={i} label={FOOT_LABELS[f]} selected={foot === f} onPress={() => choose(() => setFoot(f))} />
            ))}
          </View>
        );
      case 'nivel':
        return (
          <View style={styles.list}>
            {LEVELS.map((l, i) => (
              <OptionCard key={l} index={i} label={LEVEL_LABELS[l]} selected={level === l} onPress={() => choose(() => setLevel(l))} />
            ))}
          </View>
        );
      case 'objetivos':
        return (
          <View style={styles.list}>
            {GOALS.map((g, i) => (
              <OptionCard key={g} index={i} icon={GOAL_ICON[g]} label={GOAL_LABELS[g]} selected={goals.includes(g)} onPress={() => setGoals((l) => toggle(l, g))} />
            ))}
          </View>
        );
      case 'dias':
        return <BigStepper value={days} min={1} max={7} onChange={setDays} unit="días" />;
      case 'minutos':
        return <BigStepper value={minutes} min={15} max={90} step={5} onChange={setMinutes} unit="min" />;
      case 'equipo':
        return (
          <View style={styles.list}>
            {EQUIPMENT.map((e, i) => (
              <OptionCard key={e} index={i} icon={EQUIPMENT_ICON[e]} label={EQUIPMENT_LABELS[e]} selected={equipment.includes(e)} onPress={() => setEquipment((l) => toggle(l, e))} />
            ))}
          </View>
        );
      case 'molestias':
        return (
          <View style={styles.grid}>
            {BODY_ZONES.map((z, i) => (
              <OptionCard key={z} compact index={i} label={BODY_ZONE_LABELS[z]} selected={zones.includes(z)} onPress={() => setZones((l) => toggle(l, z))} />
            ))}
          </View>
        );
      case 'sueno':
        return <BigStepper value={sleep} min={5} max={12} step={0.5} onChange={setSleep} unit="h" />;
      case 'coach':
        return (
          <View style={styles.list}>
            {PERSONAS.map((p, i) => (
              <OptionCard key={p.id} index={i} icon={p.icon} label={p.title} hint={p.text} selected={persona === p.id} onPress={() => choose(() => setPersona(p.id))} />
            ))}
          </View>
        );
      case 'reloj':
        return (
          <View style={styles.list}>
            <OptionCard index={0} icon="applewatch" label="Apple Watch" selected={wearable === 'applewatch'} onPress={() => choose(() => setWearable('applewatch'))} />
            <OptionCard index={1} icon="figure.run" label="Otro reloj o banda" selected={wearable === 'otro'} onPress={() => choose(() => setWearable('otro'))} />
            <OptionCard index={2} icon="xmark" label="No tengo" selected={wearable === 'ninguno'} onPress={() => choose(() => setWearable('ninguno'))} />
          </View>
        );
      case 'avisos':
        return (
          <View style={styles.list}>
            <OptionCard index={0} icon="bell.fill" label="Sí, avísame" hint="Un aviso al día y otro si tu racha está en riesgo." selected={reminders === true} onPress={() => choose(() => setReminders(true))} />
            <OptionCard index={1} icon="bell.slash.fill" label="Ahora no" selected={reminders === false} onPress={() => choose(() => setReminders(false))} />
          </View>
        );
      case 'tarjeta': {
        const p = buildPlayer();
        return p ? (
          <View style={styles.reveal}>
            <PlayerCard3D player={p} effect={2} maxWidth={300} />
          </View>
        ) : null;
      }
      default:
        if (step.id.startsWith('salud')) {
          const i = Number(step.id.slice(5));
          return (
            <View style={styles.list}>
              <AppText variant="title">{APTITUDE_QUESTIONS[i]}</AppText>
              <OptionCard index={0} icon="checkmark.circle.fill" tint={colors.pitch} label="No" selected={answers[i] === false} onPress={() => choose(() => setAnswers((a) => a.map((v, j) => (j === i ? false : v))))} />
              <OptionCard index={1} icon="exclamationmark.triangle.fill" tint={colors.volt} label="Sí" selected={answers[i] === true} onPress={() => choose(() => setAnswers((a) => a.map((v, j) => (j === i ? true : v))))} />
            </View>
          );
        }
        if (step.id.startsWith('auto-')) {
          const key = step.id.slice(5) as OutfieldAttributeKey;
          const v = self[key] ?? 5;
          return (
            <View style={styles.ratingBox}>
              <AppText variant="digitsLarge" tone="pitch">{v}</AppText>
              <AppText variant="headline" tone="secondary">{RATING_WORD(v)}</AppText>
              <View style={styles.dots}>
                {Array.from({ length: 10 }, (_, k) => k + 1).map((n) => (
                  <Pressable
                    key={n}
                    accessibilityRole="button"
                    accessibilityLabel={`${n}`}
                    onPress={() => {
                      haptics.selection();
                      setSelf((s0) => ({ ...s0, [key]: n }));
                    }}
                    style={[styles.dot, { backgroundColor: n <= v ? colors.pitch : colors.surfaceStrong }]}
                  />
                ))}
              </View>
            </View>
          );
        }
        return null;
    }
  })();

  const cta = ((): { label: string; variant: 'go' | 'primary'; disabled: boolean; onPress: () => void } => {
    if (step.id === 'bienvenida') return { label: 'Empezar', variant: 'go', disabled: false, onPress: () => go(1) };
    if (step.id === 'plan') return { label: 'Ver mi tarjeta', variant: 'go', disabled: !planReady, onPress: () => go(1) };
    if (step.id === 'tarjeta') return { label: 'Entrar a Fulbito', variant: 'go', disabled: false, onPress: () => { void finish(); } };
    if (step.id === 'aviso') return { label: 'Entiendo', variant: 'go', disabled: false, onPress: () => go(1) };
    return { label: step.id === 'molestias' && zones.length === 0 ? 'Nada, estoy bien' : 'Continuar', variant: 'go', disabled: !canContinue, onPress: () => go(1) };
  })();

  return (
    <Screen tabBarSpace={false} scroll={false} contentStyle={styles.flex}>
      <View style={styles.topBar}>
        {idx > 0 && step.id !== 'tarjeta' ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Atrás" onPress={() => { haptics.light(); go(-1); }} hitSlop={10}>
            <GlassSurface radius={radii.pill} flat interactive>
              <View style={styles.back}><Icon name="chevron.left" size={16} color={colors.text} /></View>
            </GlassSurface>
          </Pressable>
        ) : <View style={styles.back} />}
        <View style={styles.progress}><ProgressBar fraction={idx / total} height={6} /></View>
      </View>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.View key={step.id} entering={entering} style={styles.stepBox}>
          {title ? <AppText variant="largeTitle">{title}</AppText> : null}
          {subtitle ? <AppText variant="body" tone="secondary">{subtitle}</AppText> : null}
          {body}
        </Animated.View>
        {step.id === 'tarjeta' ? <Confetti trigger={1} /> : null}
      </ScrollView>
      {needsButton ? (
        <View style={styles.bottom}>
          <GlassButton label={cta.label} variant={cta.variant} haptic="medium" fullWidth disabled={cta.disabled} onPress={cta.onPress} />
        </View>
      ) : null}
    </Screen>
  );
}

const AGE_LABELS_FULL: Record<AgeBand, string> = AGE_LABELS;

/** Número grande con botones grandes de vidrio; mantén pulsado un botón para cambiar más rápido (se repite cada toque). */
function BigStepper({ value, min, max, step = 1, onChange, unit }: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void; unit: string }): React.JSX.Element {
  return (
    <Animated.View entering={FadeInDown.springify()} style={styles.bigStepper}>
      <GlassButton label="−" size="regular" haptic="selection" disabled={value <= min} onPress={() => onChange(Math.max(min, value - step))} accessibilityLabel="Menos" />
      <View style={styles.bigValue}>
        <AppText variant="digitsLarge">{value}</AppText>
        {unit ? <AppText variant="headline" tone="secondary">{unit}</AppText> : null}
      </View>
      <GlassButton label="+" size="regular" haptic="selection" disabled={value >= max} onPress={() => onChange(Math.min(max, value + step))} accessibilityLabel="Más" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  copyright: { textAlign: 'center', marginTop: spacing.xl },
  flex: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.sm },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  progress: { flex: 1 },
  content: { paddingTop: spacing.xl, paddingBottom: spacing.xxl, flexGrow: 1, width: '100%', maxWidth: 560, alignSelf: 'center' },
  stepBox: { gap: spacing.lg },
  list: { gap: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  compactCell: { minWidth: 100 },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 60, borderRadius: radii.card, borderWidth: 2, borderColor: 'transparent' },
  optionCompact: { minHeight: 52, paddingHorizontal: spacing.md },
  optionTexts: { flex: 1, gap: 2 },
  pressed: { opacity: 0.85 },
  bottom: { paddingTop: spacing.md, paddingBottom: spacing.md },
  hero: { alignItems: 'center', paddingVertical: spacing.xxl },
  bigInput: { fontSize: 28, fontWeight: '700', paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  bigStepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xl },
  bigValue: { alignItems: 'center' },
  ratingBox: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  dots: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  dot: { width: 26, height: 26, borderRadius: 13 },
  reveal: { alignItems: 'center', paddingVertical: spacing.md },
});
