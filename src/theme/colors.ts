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
  background: '#E6E9ED',
  backgroundAlt: '#D9DDE2',
  surface: '#FFFFFF',
  surfaceStrong: '#D2D7DD',
  text: '#16191E',
  textSecondary: '#556070',
  textOnAccent: '#FFFFFF',
  separator: 'rgba(22,25,30,0.14)',
  accent: '#2A2F37',
  accentSoft: 'rgba(42,47,55,0.12)',
  graphite: '#23272E',
  deepBlue: '#4B5563',
  volt: '#C2491D',
  heroTop: '#2E343D',
  heroBottom: '#171A1F',
  success: '#1E9E5A',
  warning: '#D99A00',
  danger: '#B3261E',
  glassBorder: 'rgba(255,255,255,0.7)',
  glassFill: 'rgba(255,255,255,0.26)',
  glassTint: 'rgba(255,255,255,0.12)',
  shadow: 'rgba(22,25,30,0.22)',
};

export const darkPalette: Palette = {
  background: '#0C0E11',
  backgroundAlt: '#14171B',
  surface: '#1A1E24',
  surfaceStrong: '#2A3039',
  text: '#F4F6F8',
  textSecondary: '#AEB7C3',
  textOnAccent: '#16191E',
  separator: 'rgba(235,240,245,0.18)',
  accent: '#E4E8ED',
  accentSoft: 'rgba(228,232,237,0.16)',
  graphite: '#2A3039',
  deepBlue: '#8EA0B8',
  volt: '#E0663A',
  heroTop: '#2E343D',
  heroBottom: '#14171B',
  success: '#2FD070',
  warning: '#F0B429',
  danger: '#F05A5A',
  glassBorder: 'rgba(255,255,255,0.2)',
  glassFill: 'rgba(20,23,28,0.55)',
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
