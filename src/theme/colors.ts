/** Paleta: base blanca con grises, acento naranja, grafito y un azul profundo de apoyo. */
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
  success: string;
  warning: string;
  danger: string;
  glassBorder: string;
  glassFill: string;
  glassTint: string;
  shadow: string;
}

export const lightPalette: Palette = {
  background: '#F5F5F7',
  backgroundAlt: '#EBEBEF',
  surface: '#FFFFFF',
  surfaceStrong: '#E5E5EA',
  text: '#1C1C1E',
  textSecondary: '#6C6C70',
  textOnAccent: '#FFFFFF',
  separator: 'rgba(60,60,67,0.18)',
  accent: '#FF6A1A',
  accentSoft: 'rgba(255,106,26,0.16)',
  graphite: '#2C2C2E',
  deepBlue: '#1F3A5F',
  success: '#2E9E5B',
  warning: '#E0A100',
  danger: '#D93A3A',
  glassBorder: 'rgba(255,255,255,0.65)',
  glassFill: 'rgba(255,255,255,0.55)',
  glassTint: 'rgba(255,255,255,0.12)',
  shadow: 'rgba(28,28,30,0.18)',
};

export const darkPalette: Palette = {
  background: '#0E0E10',
  backgroundAlt: '#18181B',
  surface: '#1C1C1E',
  surfaceStrong: '#2C2C2E',
  text: '#F5F5F7',
  textSecondary: '#A1A1A6',
  textOnAccent: '#FFFFFF',
  separator: 'rgba(235,235,245,0.18)',
  accent: '#FF7A33',
  accentSoft: 'rgba(255,122,51,0.2)',
  graphite: '#3A3A3C',
  deepBlue: '#5B8DEF',
  success: '#3DBB72',
  warning: '#F0B429',
  danger: '#F05A5A',
  glassBorder: 'rgba(255,255,255,0.18)',
  glassFill: 'rgba(40,40,44,0.5)',
  glassTint: 'rgba(255,255,255,0.06)',
  shadow: 'rgba(0,0,0,0.5)',
};

/** Colores de rareza de la tarjeta (degradado de arriba a abajo). */
export const rarityGradients = {
  bronce: ['#C58A5B', '#8A5A33'],
  plata: ['#DADCE2', '#9EA3AF'],
  oro: ['#F7D679', '#C99A2E'],
  especial: ['#FF9A4D', '#E0451F'],
  leyenda: ['#2B3A67', '#101827'],
} as const satisfies Record<string, readonly [string, string]>;
