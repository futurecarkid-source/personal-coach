import { Easing, type WithSpringConfig, type WithTimingConfig } from 'react-native-reanimated';

/**
 * Físicas de muelle con nombre. Cada una es una tupla de masa, rigidez y amortiguación
 * que se usa en toda la app para que el movimiento se sienta de una sola familia.
 */
export const springs = {
  /** Controles: botones, chips, interruptores. */
  snappy: { mass: 1, stiffness: 420, damping: 30 },
  /** Hojas, paneles, indicador de la barra de pestañas. */
  smooth: { mass: 1, stiffness: 260, damping: 26 },
  /** Celebraciones y recompensas. */
  bouncy: { mass: 1, stiffness: 300, damping: 14 },
  /** Arrastre de fichas de la pizarra. */
  heavy: { mass: 1.4, stiffness: 360, damping: 32 },
} as const satisfies Record<string, WithSpringConfig>;

export const timings = {
  fast: { duration: 160, easing: Easing.out(Easing.cubic) },
  base: { duration: 260, easing: Easing.out(Easing.cubic) },
  slow: { duration: 480, easing: Easing.inOut(Easing.cubic) },
} as const satisfies Record<string, WithTimingConfig>;

/** Escalas de pulsación. */
export const pressScale = {
  button: 0.96,
  card: 0.985,
  chip: 0.94,
} as const;
