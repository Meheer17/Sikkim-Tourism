/**
 * Hook to get theme colors. Now only supports light mode.
 */

import { Colors } from '@/constants/theme';

export function useThemeColor(
  props: { light?: string },
  colorName: keyof typeof Colors
) {
  const colorFromProps = props.light;

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[colorName];
  }
}
