/**
 * Design tokens for light and dark themes.
 * Use with the `useThemeColor` hook to resolve the correct token at runtime.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#64D2FF';

export const Colors = {
  light: {
    // Core
    text: '#11181C',
    background: '#FFFFFF',
    card: '#FFFFFF',
    border: '#e5e5e5',
    mutedText: '#687076',
    icon: '#687076',
    tint: tintColorLight,
    // Component-specific helpers
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    activeTabBg: '#f0f9ff',
    controlBg: '#FFFFFF',
    tintSoftBg: '#e8f4f8',
  },
  dark: {
    // Core
    text: '#ECEDEE',
    background: '#0B0B0F',
    card: '#14161A',
    border: '#23262B',
    mutedText: '#9BA1A6',
    icon: '#9BA1A6',
    tint: tintColorDark,
    // Component-specific helpers
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    activeTabBg: '#072E37',
    controlBg: '#1B1F24',
    tintSoftBg: 'rgba(100, 210, 255, 0.15)',
  },
};

// iOS Glassmorphism/Liquid Glass Design System
export const GlassColors = {
  // Light frosted glass backgrounds
  glass: {
    primary: 'rgba(255, 255, 255, 0.7)',
    secondary: 'rgba(255, 255, 255, 0.5)',
    tertiary: 'rgba(255, 255, 255, 0.3)',
    overlay: 'rgba(255, 255, 255, 0.9)',
  },
  // Tinted glass variants
  tintedGlass: {
    blue: 'rgba(10, 126, 164, 0.15)',
    purple: 'rgba(102, 126, 234, 0.15)',
    green: 'rgba(52, 211, 153, 0.15)',
    amber: 'rgba(251, 191, 36, 0.15)',
  },
  // Border colors for glass elements
  glassBorder: {
    light: 'rgba(255, 255, 255, 0.5)',
    medium: 'rgba(255, 255, 255, 0.3)',
    subtle: 'rgba(255, 255, 255, 0.2)',
  },
  // Shadow colors
  glassShadow: {
    light: 'rgba(0, 0, 0, 0.05)',
    medium: 'rgba(0, 0, 0, 0.1)',
    strong: 'rgba(0, 0, 0, 0.15)',
  },
};

export const GlassEffects = {
  // Blur intensities for iOS-style frosted glass
  blur: {
    light: 10,
    medium: 20,
    strong: 40,
    ultra: 60,
  },
  // Border radius for modern iOS design
  radius: {
    small: 12,
    medium: 16,
    large: 24,
    xlarge: 32,
  },
  // Shadow presets
  shadow: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 8,
    },
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
