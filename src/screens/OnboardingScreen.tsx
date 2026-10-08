import React, { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { AppText, Chip, GlassButton, GlassCard, GlassSurface, ProgressBar, Screen, Stepper } from '../components/common';
import { ATTRIBUTE_LABELS, BODY_ZONE_LABELS, LEVEL_LABELS, POSITION_LABELS } from '../content/attributeLabels';
import { useAppDispatch } from '../context';
import { newId } from '../core/dates';
import { estimateAttributes, headlineKeys, type SelfAssessment } from '../core/ovr';
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

const STEPS = ['Edad', 'Salud', 'Tu perfil', 'Entrenamiento', 'Autoevaluación'] as const;

function toggle<T>(list: readonly T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

/**
 * Cuestionario inicial corto: edad primero (define las salvaguardas), aviso de salud con preguntas de aptitud,
 * perfil, preferencias de entrenamiento y autoevaluación. No hay pantalla de pago al terminar.
 */
export function OnboardingScreen(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const [step, setStep] = useState(0);
  const [ageBand, setAgeBand] = useState<AgeBand | null>(null);
  const [answers, setAnswers] = useState<(boolean | null)[]>(APTITUDE_QUESTIONS.map(() => null));
  const [ack, setAck] = useState(false);
  const [nickname, setNickname] = useState('');
  const [number, setNumber] = useState(10);
  const [country, setCountry] = useState<string>('CO');
  const [position, setPosition] = useState<Position>('MC');
  const [level, setLevel] = useState<Level>('amateur');
  const [foot, setFoot] = useState<Foot>('derecho');
  const [days, setDays] = useState(3);
  const [minutes, setMinutes] = useState(40);
  const [equipment, setEquipment] = useState<Equipment[]>(['ninguno']);
  const [zones, setZones] = useState<BodyZone[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [self, setSelf] = useState<SelfAssessment>({});

  const anyYes = answers.some((a) => a === true);
  const allAnswered = answers.every((a) => a !== null);
  const headline = useMemo<OutfieldAttributeKey[]>(
    () => (position === 'POR' ? [] : headlineKeys(position).filter((k): k is OutfieldAttributeKey => k in ATTRIBUTE_LABELS)),
    [position],
  );

  const canContinue =
    step === 0 ? ageBand !== null : step === 1 ? allAnswered && ack : step === 2 ? nickname.trim().length > 0 : true;

  const finish = (): void => {
    if (!ageBand) return;
    const player: Player = {
      id: newId('player'),
      nickname: nickname.trim().slice(0, 24),
      number,
      country,
      position,
      secondaryPositions: [],
      level,
      foot,
      club: null,
      ageBand,
      attributes: estimateAttributes({ position, level, selfAssessment: self }),
      selfAssessment: Object.fromEntries(Object.entries(self).filter((e): e is [string, number] => typeof e[1] === 'number')),
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'SET_SETTINGS', patch: { healthNoticeAccepted: true } });
    dispatch({
      type: 'SET_PLAN_PREFS',
      prefs: { daysPerWeek: days, minutesPerSession: minutes, equipment: equipment.length > 0 ? equipment : ['ninguno'], discomfortZones: zones, matchDates: [], goals },
    });
    dispatch({ type: 'SET_PLAYER', player });
    haptics.success();
  };

  return (
    <Screen tabBarSpace={false}>
      <View style={styles.header}>
        <AppText variant="caption" tone="secondary">Paso {step + 1} de {STEPS.length}</AppText>
        <AppText variant="largeTitle">{STEPS[step]}</AppText>
        <ProgressBar fraction={(step + 1) / STEPS.length} />
      </View>

      {step === 0 ? (
        <GlassCard>
          <AppText variant="body" style={styles.paragraph}>Para cuidar de ti, primero dinos tu rango de edad.</AppText>
          <View style={styles.wrap}>
            {AGE_BANDS.map((band) => (
              <Chip key={band} label={AGE_LABELS[band]} selected={ageBand === band} onPress={() => setAgeBand(band)} />
            ))}
          </View>
          {ageBand && isMinor(ageBand) ? (
            <AppText variant="callout" tone="secondary" style={styles.paragraph}>
              Al ser menor de edad, algunas funciones (IA con fotos o video, nutrición con objetivo de peso y compras) estarán desactivadas y se recomienda usar la app con un adulto responsable.
            </AppText>
          ) : null}
          {ageBand === 'menor13' ? (
            <AppText variant="callout" tone="danger" style={styles.paragraph}>
              Por ahora la app no está disponible para menores de 13 años: se necesita un flujo de permiso parental que aún no existe.
            </AppText>
          ) : null}
        </GlassCard>
      ) : null}

      {step === 1 ? (
        <GlassCard>
          <AppText variant="callout" style={styles.paragraph}>
            Dorsal es una herramienta de entrenamiento y bienestar. No es un dispositivo médico, no diagnostica ni trata lesiones o enfermedades y no reemplaza a un médico, fisioterapeuta o nutricionista. Consulta a un profesional antes de empezar o cambiar tu entrenamiento, sobre todo si tienes una lesión, una condición médica o eres menor de edad.
          </AppText>
          {APTITUDE_QUESTIONS.map((question, i) => (
            <View key={question} style={styles.question}>
              <AppText variant="callout">{question}</AppText>
              <View style={styles.wrap}>
                <Chip label="Sí" selected={answers[i] === true} onPress={() => setAnswers((a) => a.map((v, j) => (j === i ? true : v)))} />
                <Chip label="No" selected={answers[i] === false} onPress={() => setAnswers((a) => a.map((v, j) => (j === i ? false : v)))} />
              </View>
            </View>
          ))}
          {anyYes ? (
            <AppText variant="callout" tone="danger" style={styles.paragraph}>
              Por tus respuestas, consulta con un profesional de la salud antes de entrenar. Si te mareas, sientes dolor fuerte o falta de aire, para y busca atención.
            </AppText>
          ) : null}
          <View style={styles.wrap}>
            <Chip label="Entiendo y acepto" selected={ack} onPress={() => setAck((v) => !v)} />
          </View>
        </GlassCard>
      ) : null}

      {step === 2 ? (
        <GlassCard>
          <AppText variant="caption" tone="secondary">Apodo en la tarjeta</AppText>
          <GlassSurface radius={radii.button} flat>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="Tu apodo"
              placeholderTextColor={colors.textSecondary}
              maxLength={24}
              autoCapitalize="words"
              autoCorrect={false}
              style={[styles.input, { color: colors.text }]}
              accessibilityLabel="Apodo en la tarjeta"
            />
          </GlassSurface>
          <View style={styles.spacer} />
          <Stepper label="Número" value={number} min={0} max={99} onChange={setNumber} />
          <AppText variant="caption" tone="secondary" style={styles.label}>País</AppText>
          <View style={styles.wrap}>
            {COUNTRIES.map((c) => (
              <Chip key={c} label={c} selected={country === c} onPress={() => setCountry(c)} />
            ))}
          </View>
          <AppText variant="caption" tone="secondary" style={styles.label}>Posición principal</AppText>
          <View style={styles.wrap}>
            {POSITIONS.map((p) => (
              <Chip key={p} label={`${p} · ${POSITION_LABELS[p]}`} selected={position === p} onPress={() => setPosition(p)} />
            ))}
          </View>
          <AppText variant="caption" tone="secondary" style={styles.label}>Categoría o nivel</AppText>
          <View style={styles.wrap}>
            {LEVELS.map((l) => (
              <Chip key={l} label={LEVEL_LABELS[l]} selected={level === l} onPress={() => setLevel(l)} />
            ))}
          </View>
          <AppText variant="caption" tone="secondary" style={styles.label}>Pie dominante</AppText>
          <View style={styles.wrap}>
            {FEET.map((f) => (
              <Chip key={f} label={FOOT_LABELS[f]} selected={foot === f} onPress={() => setFoot(f)} />
            ))}
          </View>
        </GlassCard>
      ) : null}

      {step === 3 ? (
        <GlassCard>
          <AppText variant="caption" tone="secondary" style={styles.label}>Tus objetivos (elige los que quieras)</AppText>
          <View style={styles.wrap}>
            {GOALS.map((g) => (
              <Chip key={g} label={GOAL_LABELS[g]} selected={goals.includes(g)} onPress={() => setGoals((list) => toggle(list, g))} />
            ))}
          </View>
          <View style={styles.spacer} />
          <Stepper label="Días de entrenamiento por semana" value={days} min={1} max={7} onChange={setDays} />
          <View style={styles.spacer} />
          <Stepper label="Tiempo por sesión" value={minutes} min={15} max={90} step={5} unit="min" onChange={setMinutes} />
          <AppText variant="caption" tone="secondary" style={styles.label}>Equipamiento disponible</AppText>
          <View style={styles.wrap}>
            {EQUIPMENT.map((e) => (
              <Chip key={e} label={EQUIPMENT_LABELS[e]} selected={equipment.includes(e)} onPress={() => setEquipment((list) => toggle(list, e))} />
            ))}
          </View>
          <AppText variant="caption" tone="secondary" style={styles.label}>¿Alguna zona con molestia ahora? (la evitamos en tu plan)</AppText>
          <View style={styles.wrap}>
            {BODY_ZONES.map((z) => (
              <Chip key={z} label={BODY_ZONE_LABELS[z]} selected={zones.includes(z)} onPress={() => setZones((list) => toggle(list, z))} />
            ))}
          </View>
        </GlassCard>
      ) : null}

      {step === 4 ? (
        <GlassCard>
          <AppText variant="callout" tone="secondary" style={styles.paragraph}>
            Puntúate de 1 a 10 (5 es normal para tu nivel). Con esto calculamos tu tarjeta inicial; se corrige con tus partidos y pruebas.
          </AppText>
          {position === 'POR' ? (
            <AppText variant="callout">Para porteros, la tarjeta inicial se calcula con tu nivel. Podrás ajustar cada cifra desde el perfil.</AppText>
          ) : (
            headline.map((key) => (
              <View key={key} style={styles.question}>
                <Stepper
                  label={ATTRIBUTE_LABELS[key].full}
                  value={self[key] ?? 5}
                  min={1}
                  max={10}
                  onChange={(v) => setSelf((s) => ({ ...s, [key]: v }))}
                />
              </View>
            ))
          )}
        </GlassCard>
      ) : null}

      <View style={styles.footer}>
        {step > 0 ? <GlassButton label="Atrás" icon="chevron.left" haptic="light" onPress={() => setStep((s) => s - 1)} /> : <View />}
        {step < STEPS.length - 1 ? (
          <GlassButton label="Siguiente" icon="chevron.right" variant="primary" disabled={!canContinue || ageBand === 'menor13'} onPress={() => setStep((s) => s + 1)} />
        ) : (
          <GlassButton label="Crear mi tarjeta" icon="checkmark" variant="primary" haptic="success" onPress={finish} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm },
  paragraph: { marginVertical: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  question: { gap: spacing.sm, marginTop: spacing.md },
  label: { marginTop: spacing.lg, marginBottom: spacing.sm },
  spacer: { height: spacing.md },
  input: { fontSize: 17, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
