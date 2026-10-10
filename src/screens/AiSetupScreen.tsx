import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { CONSENT_TEXT } from '../ai';
import { CONNECTION_MESSAGES, parseConnectionLink, pingGateway, type ConnectionStatus } from '../ai/connect';
import { useAiAccess } from '../ai/useAi';
import { AppText, Disclosure, FieldSurface, GlassButton, GlassCard, Icon, Screen } from '../components/common';
import { useAppDispatch, useAppState } from '../context';
import { radii, spacing, useTheme } from '../theme';
import { isMinor } from '../types';

function StepBadge({ n, done }: { n: number; done: boolean }): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: done ? colors.pitch : colors.surfaceStrong }]}>
      {done ? <Icon name="checkmark" size={14} color="#FFFFFF" /> : <AppText variant="caption" style={styles.badgeText}>{n}</AppText>}
    </View>
  );
}

/**
 * Conectar la IA en tres pasos claros: pegar un enlace, aceptar qué se envía (y el permiso de un adulto si eres menor)
 * y probar. La conexión se verifica de verdad contra el servicio, sin gastar saldo.
 */
export function AiSetupScreen(): React.JSX.Element {
  const { state } = useAppState();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { colors } = useTheme();
  const access = useAiAccess();
  const settings = state.settings;
  const minor = state.player ? isMinor(state.player.ageBand) : false;

  const [link, setLink] = useState('');
  const [address, setAddress] = useState(settings.aiGatewayUrl);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [showConsent, setShowConsent] = useState(false);

  const connected = settings.aiGatewayUrl.trim().length > 0 && access.hasAccessCode;
  const consented = settings.aiConsentAt !== null;
  const adultOk = !minor || settings.guardianConsent;
  const ready = connected && consented && adultOk;

  const connect = async (): Promise<void> => {
    const parsed = link.trim() ? parseConnectionLink(link) : parseConnectionLink(address);
    const finalCode = (parsed?.code ?? code).trim();
    if (!parsed) return setStatus('bad_address');
    if (!finalCode) return setStatus('bad_code');
    setBusy(true);
    setStatus(null);
    const result = await pingGateway(parsed.url, finalCode);
    if (result === 'ok') {
      dispatch({ type: 'SET_SETTINGS', patch: { aiGatewayUrl: parsed.url } });
      await access.saveAccessCode(finalCode);
      setLink('');
      setCode('');
    }
    setStatus(result);
    setBusy(false);
  };

  const disconnect = async (): Promise<void> => {
    await access.saveAccessCode('');
    dispatch({ type: 'SET_SETTINGS', patch: { aiGatewayUrl: '', aiConsentAt: null } });
    setStatus(null);
  };

  const field = (value: string, onChange: (v: string) => void, placeholder: string, label: string, secure = false): React.JSX.Element => (
    <FieldSurface>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={secure}
        style={[styles.input, { color: colors.text }]}
        accessibilityLabel={label}
      />
    </FieldSurface>
  );

  return (
    <Screen nativeHeader title="Conectar la IA" back tabBarSpace={false}>
      <Animated.View entering={FadeInDown.springify().damping(18)}>
        <GlassCard>
          <View style={styles.hero}>
            <View style={[styles.heroIcon, { backgroundColor: ready ? colors.pitch : colors.surfaceStrong }]}>
              <Icon name={ready ? 'checkmark' : 'sparkles'} size={26} color={ready ? '#FFFFFF' : colors.pitch} />
            </View>
            <View style={styles.flex}>
              <AppText variant="headline">{ready ? 'La IA está lista' : 'Plan, coach y análisis con IA'}</AppText>
              <AppText variant="callout" tone="secondary">
                {ready ? 'Ya puedes pedir planes, preguntar al coach y revisar partidos.' : 'Es opcional: sin IA, la app funciona igual con el coach local.'}
              </AppText>
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      <GlassCard>
        <View style={styles.stepHead}>
          <StepBadge n={1} done={connected} />
          <AppText variant="headline">Conectar el servicio</AppText>
        </View>
        {connected ? (
          <View style={styles.block}>
            <AppText variant="callout" tone="secondary">Conectado a {settings.aiGatewayUrl.replace(/^https?:\/\//, '')}</AppText>
            <GlassButton label="Desconectar" size="compact" variant="danger" haptic="warning" onPress={() => { void disconnect(); }} />
          </View>
        ) : (
          <View style={styles.block}>
            <AppText variant="callout" tone="secondary">
              Pega el enlace de conexión que te dio quien administra tu servicio de IA. Se ve así: https://…workers.dev/#tu-código
            </AppText>
            {field(link, setLink, 'Pega aquí el enlace', 'Enlace de conexión')}
            <Disclosure title="Prefiero escribir la dirección y el código" summary="Opcional">
              <View style={styles.block}>
                {field(address, setAddress, 'https://…', 'Dirección del servicio')}
                {field(code, setCode, 'Código de acceso', 'Código de acceso', true)}
              </View>
            </Disclosure>
            <GlassButton label={busy ? 'Probando…' : 'Conectar y probar'} icon="bolt.fill" variant="go" haptic="medium" fullWidth disabled={busy || (!link.trim() && !address.trim())} onPress={() => { void connect(); }} />
          </View>
        )}
        {status ? (
          <View style={styles.statusRow}>
            <Icon name={status === 'ok' ? 'checkmark.circle.fill' : 'exclamationmark.triangle.fill'} size={18} color={status === 'ok' ? colors.pitch : colors.volt} />
            <AppText variant="callout" tone={status === 'ok' ? 'success' : 'danger'} style={styles.flex}>{CONNECTION_MESSAGES[status]}</AppText>
          </View>
        ) : null}
      </GlassCard>

      <GlassCard>
        <View style={styles.stepHead}>
          <StepBadge n={2} done={consented} />
          <AppText variant="headline">Qué se envía</AppText>
        </View>
        <View style={styles.block}>
          <AppText variant="callout" tone="secondary">
            Para responder, la app envía datos mínimos de tu entrenamiento (nunca tu nombre, fotos ni video).
          </AppText>
          {showConsent ? <AppText variant="caption" tone="secondary">{CONSENT_TEXT}</AppText> : null}
          <View style={styles.wrapRow}>
            <GlassButton label={showConsent ? 'Ocultar detalle' : 'Ver detalle'} size="compact" haptic="light" onPress={() => setShowConsent((v) => !v)} />
            {consented ? (
              <GlassButton label="Retirar permiso" size="compact" haptic="warning" onPress={() => access.withdrawConsent()} />
            ) : (
              <GlassButton label="Acepto" size="compact" variant="go" haptic="success" onPress={() => access.acceptConsent()} />
            )}
          </View>
        </View>
      </GlassCard>

      {minor ? (
        <GlassCard>
          <View style={styles.stepHead}>
            <StepBadge n={3} done={settings.guardianConsent} />
            <AppText variant="headline">Permiso de un adulto</AppText>
          </View>
          <View style={styles.block}>
            <AppText variant="callout" tone="secondary">Por tu edad, la IA solo se usa con el permiso de un padre, madre o tutor. Nunca se envían fotos ni video.</AppText>
            <GlassButton
              label={settings.guardianConsent ? 'Un adulto lo autorizó' : 'Un adulto lo autoriza'}
              size="compact"
              variant={settings.guardianConsent ? 'secondary' : 'go'}
              haptic="success"
              onPress={() => dispatch({ type: 'SET_SETTINGS', patch: { guardianConsent: !settings.guardianConsent } })}
            />
          </View>
        </GlassCard>
      ) : null}

      <GlassButton label={ready ? 'Probar con el coach' : 'Completa los pasos para empezar'} icon="bubble.left.fill" variant="go" haptic="medium" fullWidth disabled={!ready} onPress={() => router.replace('/coach')} />

      <GlassCard>
        <AppText variant="label" tone="secondary">¿No tienes enlace?</AppText>
        <AppText variant="callout" tone="secondary" style={styles.spaced}>
          El servicio de IA es un pequeño programa que guarda tu clave de Anthropic y la protege con un código. Se publica una sola vez (guía en server/README.md) y de ahí sale el enlace de conexión.
        </AppText>
      </GlassCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  stepHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  badge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontWeight: '700' },
  block: { gap: spacing.md, marginTop: spacing.md },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, borderRadius: radii.chip },
  input: { fontSize: 17, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  spaced: { marginTop: spacing.sm },
});
