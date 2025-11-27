/**
 * Below are the colors that are used in the app. The app uses light mode only.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';

export const Colors = {
  text: '#11181C',
  background: '#fff',
  tint: tintColorLight,
  icon: '#687076',
  tabIconDefault: '#687076',
  tabIconSelected: tintColorLight,
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
