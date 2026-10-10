import React, { useEffect, useMemo } from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import Animated, {
  SensorType,
  clamp,
  interpolate,
  useAnimatedReaction,
  useAnimatedSensor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { ATTRIBUTE_LABELS, POSITION_LABELS } from '../../content/attributeLabels';
import { computeOvr, headlineKeys, rarityFromOvr } from '../../core/ovr';
import { rarityGradients, springs, triggerHaptic, useTheme } from '../../theme';
import type { Player, Rarity } from '../../types';
import { AppText } from '../common/AppText';
import { Icon } from '../common/Icon';

export interface PlayerCard3DProps {
  player: Player;
  /** Intensidad del efecto: 0 apagado, 1 suave, 2 media, 3 máxima. */
  effect: 0 | 1 | 2 | 3;
  /** El usuario pidió reducir el movimiento dentro de la app. */
  reduceMotion?: boolean;
  /** Fuerza una rareza (tarjetas especiales); si no, sale del OVR. */
  rarityOverride?: Rarity;
  photoUri?: string | null;
  /** Ancho máximo de la tarjeta. */
  maxWidth?: number;
}

const MAX_TILT_DEG = 16;
const RAD_TO_DEG = 180 / Math.PI;
const EFFECT_GAIN = [0, 0.55, 1, 1.45] as const;
const FOIL_OPACITY = [0, 0.16, 0.28, 0.4] as const;

/**
 * Tarjeta de jugador con profundidad. Inclinas el teléfono y la tarjeta gira (hilo de interfaz, sin pasar por JS),
 * con brillo holográfico y capas con parallax. Doble toque: recalibra la posición de reposo.
 * Sin sensor (simulador, iPad sin giroscopio) o con "reducir movimiento": responde al arrastre del dedo o queda quieta.
 * La tarjeta es contenido (materiales y degradados); el vidrio líquido va en los controles que la rodean.
 */
export function PlayerCard3D({ player, effect, reduceMotion = false, rarityOverride, photoUri, maxWidth = 330 }: PlayerCard3DProps): React.JSX.Element {
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const systemReduce = useReducedMotion();
  const motionOff = effect === 0 || reduceMotion || systemReduce;
  const gain = EFFECT_GAIN[effect];

  const cardWidth = Math.min(maxWidth, windowWidth - 48);
  const cardHeight = cardWidth * 1.46;

  const ovr = useMemo(() => computeOvr(player.position, player.attributes), [player.position, player.attributes]);
  const rarity = rarityOverride ?? rarityFromOvr(ovr);
  const [top, bottom] = rarityGradients[rarity];
  const headline = headlineKeys(player.position);

  const sensor = useAnimatedSensor(SensorType.ROTATION, { interval: 'auto' });
  const restPitch = useSharedValue(0);
  const restRoll = useSharedValue(0);
  const hasRest = useSharedValue(false);
  const dragging = useSharedValue(false);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useAnimatedReaction(
    () => sensor.sensor.value,
    (value) => {
      if (motionOff || dragging.value) return;
      if (!hasRest.value) {
        restPitch.set(value.pitch);
        restRoll.set(value.roll);
        hasRest.set(true);
      }
      const targetX = clamp(-(value.pitch - restPitch.value) * RAD_TO_DEG * gain, -MAX_TILT_DEG, MAX_TILT_DEG);
      const targetY = clamp((value.roll - restRoll.value) * RAD_TO_DEG * gain, -MAX_TILT_DEG, MAX_TILT_DEG);
      tiltX.set(withSpring(targetX, springs.smooth));
      tiltY.set(withSpring(targetY, springs.smooth));
    },
    [motionOff, gain],
  );

  useEffect(() => {
    if (motionOff) {
      tiltX.set(withSpring(0, springs.smooth));
      tiltY.set(withSpring(0, springs.smooth));
    }
  }, [motionOff, tiltX, tiltY]);

  const pan = Gesture.Pan()
    .enabled(!motionOff)
    .activeOffsetX([-10, 10])
    .failOffsetY([-14, 14])
    .onBegin(() => {
      dragging.set(true);
    })
    .onUpdate((event) => {
      tiltY.set(clamp((event.translationX / cardWidth) * 40 * gain, -MAX_TILT_DEG, MAX_TILT_DEG));
      tiltX.set(clamp(-(event.translationY / cardHeight) * 40 * gain, -MAX_TILT_DEG, MAX_TILT_DEG));
    })
    .onFinalize(() => {
      dragging.set(false);
      tiltX.set(withSpring(0, springs.bouncy));
      tiltY.set(withSpring(0, springs.bouncy));
    });

  const recalibrate = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      hasRest.set(false);
      scheduleOnRN(triggerHaptic, 'soft');
    });

  const gesture = Gesture.Simultaneous(pan, recalibrate);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 900 }, { rotateX: `${tiltX.value}deg` }, { rotateY: `${tiltY.value}deg` }],
    shadowOffset: { width: -tiltY.value * 0.8, height: 14 + tiltX.value * 0.8 },
  }));

  const foilStyle = useAnimatedStyle(() => ({
    opacity: FOIL_OPACITY[effect] * (0.55 + Math.min(1, (Math.abs(tiltX.value) + Math.abs(tiltY.value)) / (MAX_TILT_DEG * 1.2)) * 0.9),
    transform: [
      { translateX: interpolate(tiltY.value, [-MAX_TILT_DEG, MAX_TILT_DEG], [-cardWidth * 0.6, cardWidth * 0.6]) },
      { translateY: interpolate(tiltX.value, [-MAX_TILT_DEG, MAX_TILT_DEG], [cardHeight * 0.25, -cardHeight * 0.25]) },
    ],
  }));

  const photoStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tiltY.value * 1.1 }, { translateY: -tiltX.value * 0.9 }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tiltY.value * 0.35 }, { translateY: -tiltX.value * 0.3 }],
  }));

  const textColor = rarity === 'leyenda' || rarity === 'bronce' || rarity === 'especial' ? '#FFFFFF' : '#1B1B1D';

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        accessible
        accessibilityLabel={`Tarjeta de ${player.nickname}, ${POSITION_LABELS[player.position]}, nivel general ${ovr}`}
        style={[
          styles.card,
          { width: cardWidth, height: cardHeight, shadowColor: colors.shadow, shadowOpacity: 1, shadowRadius: 22 },
          cardStyle,
        ]}
      >
        <LinearGradient colors={[top, bottom]} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={StyleSheet.absoluteFill} />
        {/* Textura: aros concéntricos suaves */}
        <View pointerEvents="none" style={[styles.ring, { width: cardWidth * 1.3, height: cardWidth * 1.3, top: -cardWidth * 0.3, right: -cardWidth * 0.5, borderColor: 'rgba(255,255,255,0.18)' }]} />
        <View pointerEvents="none" style={[styles.ring, { width: cardWidth * 0.9, height: cardWidth * 0.9, top: cardWidth * 0.05, right: -cardWidth * 0.3, borderColor: 'rgba(255,255,255,0.12)' }]} />

        <Animated.View style={[styles.photoLayer, photoStyle]} pointerEvents="none">
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
          ) : (
            <Icon name="person.fill" size={cardWidth * 0.62} color="rgba(255,255,255,0.35)" weight="regular" />
          )}
        </Animated.View>

        <Animated.View style={[styles.textLayer, textStyle]}>
          <View style={styles.topRow}>
            <View>
              <AppText variant="digitsLarge" style={{ color: textColor, fontSize: cardWidth * 0.22, lineHeight: cardWidth * 0.24 }}>{ovr}</AppText>
              <AppText variant="headline" style={{ color: textColor, letterSpacing: 1 }}>{player.position}</AppText>
            </View>
            <View style={styles.flagBox}>
              <View style={[styles.country, { borderColor: textColor }]}><AppText variant="caption" style={{ color: textColor, fontWeight: '700', letterSpacing: 1 }}>{player.country.toUpperCase()}</AppText></View>
              <AppText variant="caption" style={{ color: textColor }}>#{player.number}</AppText>
            </View>
          </View>

          <View style={styles.bottom}>
            <AppText variant="title" numberOfLines={1} style={{ color: textColor, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1.5 }}>
              {player.nickname}
            </AppText>
            <View style={[styles.divider, { backgroundColor: textColor, opacity: 0.35 }]} />
            <View style={styles.stats}>
              {headline.map((key) => {
                const attr = player.attributes[key];
                return (
                  <View key={key} style={styles.stat}>
                    <AppText variant="headline" style={{ color: textColor, fontVariant: ['tabular-nums'] }}>{attr ? Math.round(attr.value) : '–'}</AppText>
                    <AppText variant="caption" style={{ color: textColor, opacity: 0.85 }}>{ATTRIBUTE_LABELS[key].short}</AppText>
                  </View>
                );
              })}
            </View>
            {player.club ? <AppText variant="caption" style={{ color: textColor, textAlign: 'center', opacity: 0.8 }}>{player.club}</AppText> : null}
          </View>
        </Animated.View>

        {/* Brillo holográfico: se desplaza con la inclinación */}
        <Animated.View pointerEvents="none" style={[styles.foil, foilStyle]}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,214,170,0.9)', 'rgba(170,220,255,0.9)', 'rgba(220,190,255,0.9)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.border]} />
      </Animated.View>
    </GestureDetector>
  );
}

const FILL = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

const styles = StyleSheet.create({
  country: { borderWidth: 1.5, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1, opacity: 0.9 },
  card: { borderRadius: 28, overflow: 'hidden', alignSelf: 'center' },
  ring: { position: 'absolute', borderRadius: 999, borderWidth: 2 },
  photoLayer: { ...FILL, alignItems: 'center', justifyContent: 'center', paddingTop: 30 },
  photo: { width: '70%', height: '62%', borderRadius: 24 },
  textLayer: { ...FILL, padding: 20, justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  flagBox: { alignItems: 'center', gap: 2 },
  bottom: { gap: 8 },
  divider: { height: StyleSheet.hairlineWidth * 2, alignSelf: 'stretch' },
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', gap: 1, minWidth: 34 },
  foil: { position: 'absolute', top: '-30%', left: '-40%', width: '180%', height: '160%' },
  border: { borderRadius: 28, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.45)' },
});
