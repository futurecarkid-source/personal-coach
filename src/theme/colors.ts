/** Paleta deportiva: base gris frío, grafito intenso, acento rojo anaranjado y un verde "volt" para progreso y recompensas. */
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
  /** Verde eléctrico de progreso, XP y logros. */
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
  background: '#E9EDF1',
  backgroundAlt: '#DDE3E9',
  surface: '#FFFFFF',
  surfaceStrong: '#D5DCE3',
  text: '#0E1217',
  textSecondary: '#566170',
  textOnAccent: '#FFFFFF',
  separator: 'rgba(14,18,23,0.14)',
  accent: '#F23D14',
  accentSoft: 'rgba(242,61,20,0.14)',
  graphite: '#14181E',
  deepBlue: '#0B2A4A',
  volt: '#9BD800',
  heroTop: '#1E242C',
  heroBottom: '#0C0F13',
  success: '#12A150',
  warning: '#E0A100',
  danger: '#B3261E',
  glassBorder: 'rgba(255,255,255,0.7)',
  glassFill: 'rgba(255,255,255,0.26)',
  glassTint: 'rgba(255,255,255,0.12)',
  shadow: 'rgba(14,18,23,0.22)',
};

export const darkPalette: Palette = {
  background: '#090B0E',
  backgroundAlt: '#12151A',
  surface: '#14181E',
  surfaceStrong: '#232A33',
  text: '#F4F6F8',
  textSecondary: '#9AA4B1',
  textOnAccent: '#FFFFFF',
  separator: 'rgba(235,240,245,0.16)',
  accent: '#FF5A36',
  accentSoft: 'rgba(255,90,54,0.2)',
  graphite: '#232A33',
  deepBlue: '#5B8DEF',
  volt: '#D4FF3A',
  heroTop: '#262D37',
  heroBottom: '#0E1115',
  success: '#2FD070',
  warning: '#F0B429',
  danger: '#F05A5A',
  glassBorder: 'rgba(255,255,255,0.18)',
  glassFill: 'rgba(40,44,52,0.3)',
  glassTint: 'rgba(255,255,255,0.06)',
  shadow: 'rgba(0,0,0,0.55)',
};

/** Colores de rareza de la tarjeta (degradado de arriba a abajo). */
export const rarityGradients = {
  bronce: ['#C58A5B', '#8A5A33'],
  plata: ['#DADCE2', '#9EA3AF'],
  oro: ['#F7D679', '#C99A2E'],
  especial: ['#FF7A4D', '#C92A12'],
  leyenda: ['#2B3A67', '#101827'],
} as const satisfies Record<string, readonly [string, string]>;
