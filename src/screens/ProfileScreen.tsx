import React, { useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { CONSENT_TEXT, describeAiError, refineScouting } from '../ai';
import { useAiAccess } from '../ai/useAi';
import { AppText, Chip, GlassButton, GlassCard, GlassSurface, Screen, SectionHeader, Stepper } from '../components/common';
import { NativeSegmented, NativeToggle } from '../components/native/NativeControls';
import { PlayerCard3D } from '../components/specialized/PlayerCard3D';
import { ATTRIBUTE_LABELS, LEVEL_LABELS, POSITION_LABELS } from '../content/attributeLabels';
import { useAppDispatch, useAppState } from '../context';
import { computeOvr, headlineKeys } from '../core/ovr';
import { isHapticsSupported, radii, spacing, useTheme } from '../theme';
import { isMinor, type AttributeKey } from '../types';

const SOURCE_LABEL = { estimado: 'Estimado', medido: 'Medido', ajustado: 'Ajustado' } as const;

export function ProfileScreen(): React.JSX.Element {
  const { state } = useAppState();
  const dispatch = useAppDispatch();
  const { player, settings } = state;
  const { colors } = useTheme();
  const access = useAiAccess();
  const [code, setCode] = useState('');
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  if (!player) return <Screen><AppText variant="body">Crea tu tarjeta para empezar.</AppText></Screen>;

  const ovr = computeOvr(player.position, player.attributes);
  const main = headlineKeys(player.position);
  const others = (Object.keys(player.attributes) as AttributeKey[]).filter((k) => !main.includes(k));

  const consent = (): void => {
    Alert.alert('Antes de usar la IA', CONSENT_TEXT, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Acepto', onPress: () => access.acceptConsent() },
    ]);
  };

  const saveCode = async (): Promise<void> => {
    const ok = await access.saveAccessCode(code);
    setAiNote(ok ? (code.trim() ? 'Código guardado en el llavero de tu dispositivo.' : 'Código borrado.') : 'No se pudo guardar el código.');
    if (ok) setCode('');
  };

  const refine = async (): Promise<void> => {
    setAiNote(null);
    if (!access.config) {
      setAiNote(access.gate.allowed ? 'La IA no está disponible.' : access.gate.message);
      return;
    }
    setAiBusy(true);
    try {
      const attributes = await refineScouting(access.config, state);
      dispatch({ type: 'APPLY_ESTIMATES', attributes });
      setAiNote('Cifras refinadas. Las que ajustaste a mano o mediste no se tocan.');
    } catch (e) {
      setAiNote(describeAiError(e));
    } finally {
      setAiBusy(false);
    }
  };

  const confirmReset = (): void => {
    Alert.alert('Borrar todos mis datos', 'Se borrarán tu tarjeta, tus sesiones, partidos y jugadas de este dispositivo. No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar todo', style: 'destructive', onPress: () => dispatch({ type: 'RESET_ALL' }) },
    ]);
  };

  const renderAttr = (key: AttributeKey): React.JSX.Element | null => {
    const attr = player.attributes[key];
    if (!attr) return null;
    return (
      <View key={key} style={styles.attr}>
        <Stepper
          label={`${ATTRIBUTE_LABELS[key].full} · ${SOURCE_LABEL[attr.source]}`}
          value={Math.round(attr.value)}
          min={25}
          max={99}
          onChange={(v) => dispatch({ type: 'SET_ATTRIBUTE', key, value: v, source: 'ajustado' })}
        />
      </View>
    );
  };

  return (
    <Screen nativeHeader>
      <PlayerCard3D player={player} effect={settings.cardEffect} reduceMotion={settings.reduceMotion} />
      <AppText variant="caption" tone="secondary" style={styles.center}>
        Inclina el teléfono para mover la tarjeta. Doble toque para recalibrar. Arrastra con el dedo si no hay sensor.
      </AppText>

      <GlassCard>
        <SectionHeader title={`${POSITION_LABELS[player.position]} · ${ovr}`} subtitle={`${LEVEL_LABELS[player.level]} · pie ${player.foot} · #${player.number}`} />
        <AppText variant="callout" tone="secondary" style={styles.note}>
          Tus cifras empiezan como “Estimado” (fórmula local) y se corrigen con tus partidos y pruebas. Puedes ajustarlas a mano.
        </AppText>
      </GlassCard>

      <GlassCard>
        <SectionHeader title="Atributos principales" />
        <View style={styles.list}>{main.map(renderAttr)}</View>
      </GlassCard>

      {others.length > 0 ? (
        <GlassCard>
          <SectionHeader title="Otros atributos" />
          <View style={styles.list}>{others.map(renderAttr)}</View>
        </GlassCard>
      ) : null}

      <GlassCard>
        <SectionHeader title="Ajustes" />
        <View style={styles.list}>
          <NativeToggle
            label="Háptica"
            description={isHapticsSupported() ? 'Vibraciones finas en cada interacción.' : 'Este dispositivo (iPad) no tiene motor de vibración.'}
            value={settings.hapticsEnabled}
            onChange={(v) => dispatch({ type: 'SET_SETTINGS', patch: { hapticsEnabled: v } })}
          />
          <View style={styles.block}>
            <AppText variant="headline">Brillo del efecto de la tarjeta</AppText>
            <NativeSegmented
              options={[
                { value: '0', label: 'Apagado' },
                { value: '1', label: 'Suave' },
                { value: '2', label: 'Medio' },
                { value: '3', label: 'Máximo' },
              ]}
              value={String(settings.cardEffect) as '0' | '1' | '2' | '3'}
              onChange={(v) => dispatch({ type: 'SET_SETTINGS', patch: { cardEffect: Number(v) as 0 | 1 | 2 | 3 } })}
            />
          </View>
          <NativeToggle
            label="Reducir movimiento"
            description="Además del ajuste del sistema, la tarjeta se queda quieta."
            value={settings.reduceMotion}
            onChange={(v) => dispatch({ type: 'SET_SETTINGS', patch: { reduceMotion: v } })}
          />
        </View>
      </GlassCard>

      <GlassCard>
        <SectionHeader title="IA y Coach" subtitle={access.config ? 'Conectada' : 'Sin conectar'} />
        <View style={styles.list}>
          <AppText variant="callout" tone="secondary">
            La IA hace tu plan, responde en el chat, explica tu pizarra, revisa partidos y orienta tu seguimiento de dolor. Sin IA, el coach local sigue funcionando.
          </AppText>
          <AppText variant="caption" tone="secondary">Dirección del servicio de IA</AppText>
          <GlassSurface radius={radii.button} flat>
            <TextInput
              value={settings.aiGatewayUrl}
              onChangeText={(v) => dispatch({ type: 'SET_SETTINGS', patch: { aiGatewayUrl: v } })}
              placeholder="https://…"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={[styles.input, { color: colors.text }]}
              accessibilityLabel="Dirección del servicio de IA"
            />
          </GlassSurface>
          <AppText variant="caption" tone="secondary">Código de acceso {access.hasAccessCode ? '(guardado)' : '(no guardado)'}</AppText>
          <GlassSurface radius={radii.button} flat>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="Pega tu código"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, { color: colors.text }]}
              accessibilityLabel="Código de acceso a la IA"
            />
          </GlassSurface>
          <View style={styles.wrapRow}>
            <GlassButton label={code.trim() ? 'Guardar código' : 'Borrar código'} size="compact" haptic="medium" disabled={!code.trim() && !access.hasAccessCode} onPress={() => { void saveCode(); }} />
            {settings.aiConsentAt ? (
              <GlassButton label="Retirar permiso" size="compact" haptic="warning" onPress={() => access.withdrawConsent()} />
            ) : (
              <GlassButton label="Revisar y aceptar qué se envía" size="compact" variant="primary" haptic="medium" onPress={consent} />
            )}
          </View>
          {isMinor(player.ageBand) ? (
            <View style={styles.settingRow}>
              <View style={styles.flex}>
                <AppText variant="headline">Permiso de un adulto</AppText>
                <AppText variant="caption" tone="secondary">Por tu edad, la IA solo se usa con el permiso de un padre, madre o tutor. Nunca se envían fotos ni video.</AppText>
              </View>
              <Chip label={settings.guardianConsent ? 'Sí' : 'No'} selected={settings.guardianConsent} onPress={() => dispatch({ type: 'SET_SETTINGS', patch: { guardianConsent: !settings.guardianConsent } })} />
            </View>
          ) : null}
          <AppText variant="caption" tone="secondary">Tono del coach</AppText>
          <View style={styles.wrapRow}>
            {(['exigente', 'motivador', 'cientifico', 'calmado'] as const).map((p) => (
              <Chip key={p} label={p === 'cientifico' ? 'Científico' : p.charAt(0).toUpperCase() + p.slice(1)} selected={settings.coachPersona === p} onPress={() => dispatch({ type: 'SET_SETTINGS', patch: { coachPersona: p } })} />
            ))}
          </View>
          <GlassButton label={aiBusy ? 'Refinando…' : 'Refinar mis cifras con IA'} icon="sparkles" size="compact" haptic="medium" disabled={aiBusy} onPress={() => { void refine(); }} />
          {aiNote ? <AppText variant="callout" tone="secondary">{aiNote}</AppText> : null}
        </View>
      </GlassCard>

      <GlassCard>
        <SectionHeader title="Tus datos" subtitle="Se guardan en este dispositivo." />
        <View style={styles.block}>
          <GlassButton label="Borrar todos mis datos" icon="trash" variant="danger" haptic="warning" onPress={confirmReset} />
        </View>
      </GlassCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  note: { marginTop: spacing.sm },
  list: { gap: spacing.md, marginTop: spacing.md },
  attr: { paddingVertical: 2 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  flex: { flex: 1, gap: 2 },
  block: { gap: spacing.md, marginTop: spacing.sm },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  input: { fontSize: 17, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
});
