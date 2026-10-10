import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { deletePhoto, savePhotoCopy } from '../../services/photoStore';
import { haptics, radii, spacing, useTheme } from '../../theme';
import type { PainPhoto as PainPhotoValue } from '../../types';
import { AppText } from '../common/AppText';
import { GlassButton } from '../common/GlassButton';

export interface PainPhotoProps {
  value: PainPhotoValue | null;
  onChange: (value: PainPhotoValue | null) => void;
  /** Sin foto: texto del bloque. */
  hint?: string;
}

const MAX_MARKERS = 3;

/**
 * Foto del dolor con marcadores (hasta 3). La foto se guarda solo en este dispositivo: no se envía a ningún servicio
 * ni a la IA. Sirve para marcar dónde duele y comparar con tus seguimientos.
 */
export function PainPhoto({ value, onChange, hint }: PainPhotoProps): React.JSX.Element {
  const { colors } = useTheme();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [error, setError] = useState<string | null>(null);

  const accept = (result: ImagePicker.ImagePickerResult): void => {
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return;
    const saved = savePhotoCopy(asset.uri);
    if (!saved) {
      setError('No se pudo guardar la foto. Inténtalo de nuevo.');
      return;
    }
    if (value) deletePhoto(value.uri);
    setError(null);
    onChange({ uri: saved, aspect: asset.width > 0 && asset.height > 0 ? asset.width / asset.height : 1, markers: [] });
    haptics.success();
  };

  const take = async (): Promise<void> => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError('Sin permiso de cámara. Puedes activarlo en Ajustes del dispositivo o elegir una foto de tu fototeca.');
      return;
    }
    accept(await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 }));
  };

  const pick = async (): Promise<void> => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Sin permiso para tus fotos. Puedes activarlo en Ajustes del dispositivo.');
      return;
    }
    accept(await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 }));
  };

  const onLayout = (e: LayoutChangeEvent): void => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  const addMarker = (x: number, y: number): void => {
    if (!value || size.w === 0 || size.h === 0) return;
    const marker = { x: Math.min(1, Math.max(0, x / size.w)), y: Math.min(1, Math.max(0, y / size.h)) };
    const markers = value.markers.length >= MAX_MARKERS ? [...value.markers.slice(1), marker] : [...value.markers, marker];
    haptics.light();
    onChange({ ...value, markers });
  };

  if (!value) {
    return (
      <View style={styles.block}>
        <AppText variant="callout" tone="secondary">{hint ?? 'Opcional: toma una foto y marca dónde duele. Se queda solo en tu dispositivo; no se envía a ningún lado.'}</AppText>
        <View style={styles.row}>
          <GlassButton label="Tomar foto" icon="camera.fill" size="compact" haptic="light" onPress={() => { void take(); }} />
          <GlassButton label="Elegir de fotos" icon="photo" size="compact" haptic="light" onPress={() => { void pick(); }} />
        </View>
        {error ? <AppText variant="callout" tone="danger">{error}</AppText> : null}
      </View>
    );
  }

  return (
    <View style={styles.block}>
      <AppText variant="callout" tone="secondary">Toca la foto para marcar dónde duele (hasta {MAX_MARKERS} marcas).</AppText>
      <Pressable
        accessibilityRole="image"
        accessibilityLabel="Foto del dolor, toca para marcar"
        onLayout={onLayout}
        onPress={(e) => addMarker(e.nativeEvent.locationX, e.nativeEvent.locationY)}
        style={[styles.frame, { aspectRatio: value.aspect, backgroundColor: colors.surfaceStrong }]}
      >
        <Image source={{ uri: value.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        {value.markers.map((m, i) => (
          <View
            key={`${m.x}-${m.y}-${i}`}
            pointerEvents="none"
            style={[styles.marker, { left: `${m.x * 100}%`, top: `${m.y * 100}%`, borderColor: colors.volt, backgroundColor: 'rgba(194,73,29,0.28)' }]}
          />
        ))}
      </Pressable>
      <View style={styles.row}>
        <GlassButton label="Quitar última marca" size="compact" haptic="light" disabled={value.markers.length === 0} onPress={() => onChange({ ...value, markers: value.markers.slice(0, -1) })} />
        <GlassButton label="Cambiar foto" size="compact" haptic="light" onPress={() => { void take(); }} />
        <GlassButton
          label="Borrar foto"
          variant="danger"
          size="compact"
          haptic="warning"
          onPress={() => {
            deletePhoto(value.uri);
            onChange(null);
          }}
        />
      </View>
      {error ? <AppText variant="callout" tone="danger">{error}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  frame: { width: '100%', maxWidth: 360, alignSelf: 'center', borderRadius: radii.card, overflow: 'hidden' },
  marker: { position: 'absolute', width: 36, height: 36, marginLeft: -18, marginTop: -18, borderRadius: 18, borderWidth: 3 },
});
