import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { AppText, Chip, GlassButton, GlassCard, Screen, SectionHeader, SegmentedControl, Stepper } from '../components/common';
import { PlayerCard3D } from '../components/specialized/PlayerCard3D';
import { ATTRIBUTE_LABELS, LEVEL_LABELS, POSITION_LABELS } from '../content/attributeLabels';
import { useAppDispatch, useAppState } from '../context';
import { computeOvr, headlineKeys } from '../core/ovr';
import { isHapticsSupported, spacing } from '../theme';
import type { AttributeKey } from '../types';

const SOURCE_LABEL = { estimado: 'Estimado', medido: 'Medido', ajustado: 'Ajustado' } as const;

export function ProfileScreen(): React.JSX.Element {
  const { state } = useAppState();
  const dispatch = useAppDispatch();
  const { player, settings } = state;
  if (!player) return <Screen><AppText variant="body">Crea tu tarjeta para empezar.</AppText></Screen>;

  const ovr = computeOvr(player.position, player.attributes);
  const main = headlineKeys(player.position);
  const others = (Object.keys(player.attributes) as AttributeKey[]).filter((k) => !main.includes(k));

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
    <Screen>
      <AppText variant="largeTitle">Perfil</AppText>
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
          <View style={styles.settingRow}>
            <View style={styles.flex}>
              <AppText variant="headline">Háptica</AppText>
              <AppText variant="caption" tone="secondary">
                {isHapticsSupported() ? 'Vibraciones finas en cada interacción.' : 'Este dispositivo (iPad) no tiene motor de vibración.'}
              </AppText>
            </View>
            <Chip label={settings.hapticsEnabled ? 'Activada' : 'Apagada'} selected={settings.hapticsEnabled} onPress={() => dispatch({ type: 'SET_SETTINGS', patch: { hapticsEnabled: !settings.hapticsEnabled } })} />
          </View>
          <View style={styles.block}>
            <AppText variant="headline">Brillo del efecto de la tarjeta</AppText>
            <SegmentedControl
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
          <View style={styles.settingRow}>
            <View style={styles.flex}>
              <AppText variant="headline">Reducir movimiento</AppText>
              <AppText variant="caption" tone="secondary">Además del ajuste del sistema, la tarjeta se queda quieta.</AppText>
            </View>
            <Chip label={settings.reduceMotion ? 'Sí' : 'No'} selected={settings.reduceMotion} onPress={() => dispatch({ type: 'SET_SETTINGS', patch: { reduceMotion: !settings.reduceMotion } })} />
          </View>
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
});
