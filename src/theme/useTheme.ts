import { useColorScheme } from 'react-native';
import { darkPalette, lightPalette, type Palette } from './colors';

export interface Theme {
  isDark: boolean;
  colors: Palette;
}

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return { isDark, colors: isDark ? darkPalette : lightPalette };
}
