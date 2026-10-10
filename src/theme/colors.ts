/** Paleta estilo Apple (Fitness y Salud): verde del sistema como color principal, naranja para racha y XP, azul para datos. */
export interface Palette {
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceStrong: string;
  text: string;
  textSecondary: string;
  textOnAccent: string;
  separator: string;
  accent: string;
  accentSoft: string;
  graphite: string;
  deepBlue: string;
  /** Naranja del sistema: racha, XP y pequeños destacados. */
  volt: string;
  /** Azul del sistema: datos y enlaces. */
  blue: string;
  /** Morado del sistema: métricas secundarias. */
  purple: string;
  /** Verde del sistema: avanzar, empezar y progreso. */
  pitch: string;
  /** Degradado de las tarjetas destacadas (arriba y abajo). */
  heroTop: string;
  heroBottom: string;
  success: string;
  warning: string;
  danger: string;
  glassBorder: string;
  glassFill: string;
  glassTint: string;
  shadow: string;
}

export const lightPalette: Palette = {
  background: '#F2F2F7',
  backgroundAlt: '#E5E5EA',
  surface: '#FFFFFF',
  surfaceStrong: '#E5E5EA',
  text: '#16191E',
  textSecondary: '#6C6C70',
  textOnAccent: '#FFFFFF',
  separator: 'rgba(22,25,30,0.14)',
  accent: '#25B04C',
  accentSoft: 'rgba(37,176,76,0.14)',
  graphite: '#23272E',
  deepBlue: '#4B5563',
  volt: '#FF9500',
  blue: '#007AFF',
  purple: '#AF52DE',
  pitch: '#25B04C',
  heroTop: '#1F8F52',
  heroBottom: '#0B4A2D',
  success: '#25B04C',
  warning: '#FF9500',
  danger: '#FF3B30',
  glassBorder: 'rgba(255,255,255,0.7)',
  glassFill: 'rgba(120,120,128,0.14)',
  glassTint: 'rgba(255,255,255,0.12)',
  shadow: 'rgba(22,25,30,0.22)',
};

export const darkPalette: Palette = {
  background: '#000000',
  backgroundAlt: '#1C1C1E',
  surface: '#1C1C1E',
  surfaceStrong: '#2C2C2E',
  text: '#F4F6F8',
  textSecondary: '#98989F',
  textOnAccent: '#04140D',
  separator: 'rgba(235,240,245,0.18)',
  accent: '#30D158',
  accentSoft: 'rgba(48,209,88,0.20)',
  graphite: '#2A3039',
  deepBlue: '#8EA0B8',
  volt: '#FF9F0A',
  blue: '#0A84FF',
  purple: '#BF5AF2',
  pitch: '#30D158',
  heroTop: '#14683B',
  heroBottom: '#06241A',
  success: '#30D158',
  warning: '#FF9F0A',
  danger: '#FF453A',
  glassBorder: 'rgba(255,255,255,0.2)',
  glassFill: 'rgba(120,120,128,0.30)',
  glassTint: 'rgba(255,255,255,0.06)',
  shadow: 'rgba(0,0,0,0.6)',
};

/** Colores de rareza de la tarjeta (degradado de arriba a abajo). */
export const rarityGradients = {
  bronce: ['#C58A5B', '#8A5A33'],
  plata: ['#DADCE2', '#9EA3AF'],
  oro: ['#F7D679', '#C99A2E'],
  especial: ['#D8683A', '#8F2F0E'],
  leyenda: ['#2B3A67', '#101827'],
} as const satisfies Record<string, readonly [string, string]>;
