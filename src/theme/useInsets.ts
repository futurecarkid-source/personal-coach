import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface Insets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** Márgenes seguros (notch, barra de estado, indicador de inicio). En la app nativa los da el sistema. */
export function useInsets(): Insets {
  return useSafeAreaInsets();
}
