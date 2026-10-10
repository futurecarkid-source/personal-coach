/** Paleta del logo: gris carbón y gris claro de vidrio, con toquecitos de naranja oscuro. */
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
  /** Toque de color: naranja oscuro para racha, XP, selecciones y pequeños destacados. */
  volt: string;
  /** Color secundario: verde de cancha, para avanzar, empezar y progreso. */
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
  accent: '#2A2F37',
  accentSoft: 'rgba(42,47,55,0.12)',
  graphite: '#23272E',
  deepBlue: '#4B5563',
  volt: '#C2491D',
  pitch: '#12A868',
  heroTop: '#2E343D',
  heroBottom: '#171A1F',
  success: '#12A868',
  warning: '#D99A00',
  danger: '#B3261E',
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
  textOnAccent: '#16191E',
  separator: 'rgba(235,240,245,0.18)',
  accent: '#E4E8ED',
  accentSoft: 'rgba(228,232,237,0.16)',
  graphite: '#2A3039',
  deepBlue: '#8EA0B8',
  volt: '#E0663A',
  pitch: '#32D583',
  heroTop: '#2E343D',
  heroBottom: '#14171B',
  success: '#32D583',
  warning: '#F0B429',
  danger: '#F05A5A',
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
