import { Platform } from 'react-native';
import { isLiquidGlassAvailable, isGlassEffectAPIAvailable } from 'expo-glass-effect';

/** Radios de esquina, alineados con las formas concéntricas de iOS 26. */
export const radii = {
  chip: 14,
  button: 20,
  card: 28,
  sheet: 34,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const blur = {
  /** Intensidad de BlurView cuando no hay vidrio líquido real (iOS anterior a 26). */
  regular: 60,
  thin: 35,
  thick: 90,
} as const;

/**
 * Nivel de material disponible:
 * - `liquid`: vidrio líquido nativo (iOS 26 o posterior).
 * - `blur`: desenfoque estándar con borde y brillo simulados.
 */
export type GlassTier = 'liquid' | 'blur';

let cachedTier: GlassTier | null = null;

export function getGlassTier(): GlassTier {
  if (cachedTier) return cachedTier;
  let tier: GlassTier = 'blur';
  if (Platform.OS === 'ios') {
    try {
      tier = isGlassEffectAPIAvailable() && isLiquidGlassAvailable() ? 'liquid' : 'blur';
    } catch {
      tier = 'blur';
    }
  }
  cachedTier = tier;
  return tier;
}

/** Solo para pruebas. */
export function resetGlassTierCache(): void {
  cachedTier = null;
}
