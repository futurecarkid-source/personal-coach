import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AiError, AI_LABEL, CRISIS_MESSAGE, EATING_MESSAGE, askCoach, buildProfileContext, buildSnapshot, describeAiError, detectSensitive, localCoachReply, type CoachChatOutput } from '../ai';
import { useAiAccess } from '../ai/useAi';
import { AppText, GlassButton, GlassSurface, HapticTouch, Icon, FieldSurface } from '../components/common';
import { useAppDispatch, useAppState } from '../context';
import { newId } from '../core/dates';
import { useWeekPlan } from '../hooks/useTodayPlan';
import { haptics, radii, spacing, useTheme } from '../theme';
import type { CoachMessage } from '../types';

type Action = CoachChatOutput['actions'][number];

const PERSONA_LABEL = { exigente: 'Exigente', motivador: 'Motivador', cientifico: 'Científico', calmado: 'Calmado' } as const;

const WELCOME: CoachMessage = {
  id: 'welcome',
  role: 'assistant',
  content: 'Soy tu coach. Pregúntame por tu sesión de hoy, tu recuperación, un dolor, la pizarra o el partido.',
  at: '',
  needsProfessional: false,
  source: 'sistema',
};

/**
 * Chat con el Coach. Si la IA está disponible la usa; si no, responde el coach local (reglas).
 * Los mensajes de crisis y de alimentación se resuelven con textos fijos, sin llamar a la IA.
 */
export function CoachScreen(): React.JSX.Element {
  const { state } = useAppState();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { colors } = useTheme();
  const access = useAiAccess();
  const { today, todaySession } = useWeekPlan();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const scroller = useRef<ScrollView>(null);

  const log = state.coachLog.length > 0 ? state.coachLog : [WELCOME];

  useEffect(() => {
    const id = setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(id);
  }, [state.coachLog.length, busy]);

  const push = (message: Omit<CoachMessage, 'id' | 'at'>): CoachMessage => {
    const full: CoachMessage = { ...message, id: newId('cm'), at: new Date().toISOString() };
    dispatch({ type: 'ADD_COACH_MESSAGE', message: full });
    return full;
  };

  const run = (action: Action): void => {
    haptics.medium();
    switch (action.type) {
      case 'abrir_plan':
      case 'abrir_temporizador':
        router.dismissTo('/entrenar');
        break;
      case 'registrar_descanso':
        dispatch({ type: 'REGISTER_REST_DAY', date: today });
        break;
      case 'reportar_dolor':
        router.push('/pain');
        break;
      case 'abrir_pizarra':
        router.dismissTo('/tactica');
        break;
      default:
        break;
    }
  };

  const send = async (): Promise<void> => {
    const content = text.trim();
    if (!content || busy) return;
    setText('');
    setError(null);
    setActions([]);
    const userMessage = push({ role: 'user', content, needsProfessional: false, source: 'sistema' });

    const sensitive = detectSensitive(content);
    if (sensitive) {
      push({ role: 'assistant', content: sensitive === 'crisis' ? CRISIS_MESSAGE : EATING_MESSAGE, needsProfessional: true, source: 'sistema' });
      return;
    }

    const snapshot = buildSnapshot(state, today, todaySession);
    const profile = buildProfileContext(state);

    if (!access.config || !profile) {
      const local = localCoachReply(content, snapshot);
      push({ role: 'assistant', content: local.reply, needsProfessional: local.needsProfessional, source: 'local' });
      if (local.action !== 'ninguna') setActions([{ type: local.action, label: 'Abrir' }]);
      if (!access.gate.allowed) setError(access.gate.message);
      return;
    }

    setBusy(true);
    try {
      const history = [...state.coachLog, userMessage].filter((m) => m.source !== 'sistema' || m.role === 'user').slice(-12).map((m) => ({ role: m.role, content: m.content }));
      const turn = await askCoach(access.config, { persona: state.settings.coachPersona, profile, snapshot, messages: history });
      push({ role: 'assistant', content: turn.reply, needsProfessional: turn.needsProfessional, source: 'ia' });
      setActions(turn.actions);
      haptics.soft();
    } catch (e) {
      const local = localCoachReply(content, snapshot);
      push({ role: 'assistant', content: local.reply, needsProfessional: local.needsProfessional, source: 'local' });
      setError(`${describeAiError(e)}${e instanceof AiError && e.code === 'offline' ? '' : ' Te respondió el coach local.'}`);
    } finally {
      setBusy(false);
    }
  };

  const lastAssistantId = [...log].reverse().find((m) => m.role === 'assistant')?.id;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <View>
          <AppText variant="title">Coach</AppText>
          <AppText variant="caption" tone="secondary">
            {access.config ? `IA · tono ${PERSONA_LABEL[state.settings.coachPersona].toLowerCase()}` : 'Coach local (sin IA)'}
          </AppText>
        </View>
        <View style={styles.row}>
          <GlassButton label="Borrar" icon="trash" size="compact" haptic="light" disabled={state.coachLog.length === 0} onPress={() => dispatch({ type: 'CLEAR_COACH_LOG' })} />
          <GlassButton label="Cerrar" size="compact" haptic="light" onPress={() => router.back()} />
        </View>
      </View>

      <ScrollView ref={scroller} contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {log.map((m) => (
          <Bubble key={m.id} message={m} showActions={m.id === lastAssistantId ? actions : []} onAction={run} />
        ))}
        {busy ? <AppText variant="callout" tone="secondary">El coach está pensando…</AppText> : null}
        {error ? <AppText variant="callout" tone="danger">{error}</AppText> : null}
        {!access.gate.allowed && access.loaded ? (
          <GlassButton label="Configurar la IA en Perfil" icon="sparkles" size="compact" haptic="light" onPress={() => router.dismissTo('/perfil')} />
        ) : null}
      </ScrollView>

      <View style={styles.inputRow}>
        <FieldSurface>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Escribe tu pregunta"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { color: colors.text }]}
            maxLength={1500}
            multiline
            accessibilityLabel="Mensaje para el coach"
            onSubmitEditing={() => { void send(); }}
          />
        </FieldSurface>
        <HapticTouch haptic="medium" onPress={() => { void send(); }} disabled={busy || text.trim().length === 0} accessibilityLabel="Enviar">
          <GlassSurface radius={radii.pill} tint={colors.accent} interactive flat style={styles.send}>
            <Icon name="arrow.up" size={20} color={colors.accent} />
          </GlassSurface>
        </HapticTouch>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ message, showActions, onAction }: { message: CoachMessage; showActions: Action[]; onAction: (a: Action) => void }): React.JSX.Element {
  const { colors } = useTheme();
  const mine = message.role === 'user';
  return (
    <View style={[styles.bubbleWrap, mine ? styles.mine : styles.theirs]}>
      <View style={[styles.bubble, { backgroundColor: mine ? colors.accent : colors.surface }]}>
        <AppText variant="body" tone={mine ? 'onAccent' : 'primary'}>{message.content}</AppText>
      </View>
      {!mine && message.needsProfessional ? (
        <AppText variant="caption" tone="danger">Consulta con un profesional de la salud si el dolor es fuerte, no mejora o te limita.</AppText>
      ) : null}
      {!mine && message.source === 'ia' ? <AppText variant="caption" tone="secondary">{AI_LABEL}</AppText> : null}
      {!mine && message.source === 'local' ? <AppText variant="caption" tone="secondary">Respuesta del coach local (sin IA).</AppText> : null}
      {showActions.length > 0 ? (
        <View style={styles.row}>
          {showActions.map((a) => (
            <GlassButton key={`${a.type}-${a.label}`} label={a.label || 'Abrir'} size="compact" haptic="light" onPress={() => onAction(a)} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  messages: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md },
  bubbleWrap: { maxWidth: '88%', gap: 4 },
  mine: { alignSelf: 'flex-end' },
  theirs: { alignSelf: 'flex-start' },
  bubble: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, borderRadius: radii.card },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  inputBox: { flex: 1 },
  input: { fontSize: 17, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, maxHeight: 120 },
  send: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
});
