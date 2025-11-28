/**
 * Resolve a color token for the current system color scheme.
 */

import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type ThemeKeys = keyof typeof Colors.light;

export function useThemeColor(
  colorNameOrProps: ThemeKeys | { light?: string; dark?: string },
  colorName?: ThemeKeys
) {
  const { actualTheme } = useTheme();
  const theme = actualTheme ?? 'light';
  
  // If first argument is a string, treat it as colorName
  if (typeof colorNameOrProps === 'string') {
    return Colors[theme][colorNameOrProps];
  }
  
  // Otherwise, use the old API with props
  const props = colorNameOrProps;
  const actualColorName = colorName!;
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }

  return Colors[theme][actualColorName];
}
