// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Navigation
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  
  // Common actions
  'magnifyingglass': 'search',
  'plus': 'add',
  'minus': 'remove',
  'xmark': 'close',
  'ellipsis': 'more-horiz',
  
  // Profile & User
  'person.crop.circle.fill': 'account-circle',
  'person.fill': 'person',
  'person.2.fill': 'people',
  
  // Location & Map
  'map.fill': 'map',
  'location.fill': 'location-on',
  'mappin.circle.fill': 'place',
  'mappin.and.ellipse': 'my-location',
  
  // Favorites & Actions
  'heart.fill': 'favorite',
  'heart': 'favorite-border',
  'star.fill': 'star',
  'star': 'star-border',
  'bookmark.fill': 'bookmark',
  'bookmark': 'bookmark-border',
  
  // Communication
  'bell.fill': 'notifications',
  'bell': 'notifications-none',
  'message.fill': 'message',
  'envelope.fill': 'email',
  'bubble.left.and.bubble.right.fill': 'chat',
  
  // Time & Calendar
  'clock.fill': 'schedule',
  'clock': 'access-time',
  'calendar': 'event',
  'calendar.badge.clock': 'event-available',
  
  // Shopping & Commerce
  'ticket.fill': 'confirmation-number',
  'cart.fill': 'shopping-cart',
  'creditcard.fill': 'payment',
  'indianrupeesign': 'currency-rupee',
  
  // Settings & Info
  'gear': 'settings',
  'slider.horizontal.3': 'tune',
  'info.circle.fill': 'info',
  'questionmark.circle.fill': 'help',
  'exclamationmark.triangle.fill': 'warning',
  
  // Security & Privacy
  'lock.fill': 'lock',
  'shield.fill': 'security',
  'eye.fill': 'visibility',
  'eye.slash.fill': 'visibility-off',
  
  // Documents & Files
  'doc.text.fill': 'description',
  'folder.fill': 'folder',
  'photo.fill': 'photo',
  'camera.fill': 'camera-alt',
  
  // Navigation & Direction
  'arrow.right': 'arrow-forward',
  'arrow.left': 'arrow-back',
  'arrow.up': 'arrow-upward',
  'arrow.down': 'arrow-downward',
  
  // Social & Sharing
  'square.and.arrow.up': 'share',
  'link': 'link',
  
  // Status & Indicators
  'checkmark.circle.fill': 'check-circle',
  'checkmark.circle': 'check-circle-outline',
  'checkmark': 'check',
  'xmark.circle.fill': 'cancel',
  'circle.fill': 'circle',
  
  // Content
  'text.alignleft': 'format-align-left',
  'tag.fill': 'label',
  'number': 'tag',
  
  // Media
  'play.fill': 'play-arrow',
  'pause.fill': 'pause',
  'speaker.wave.2.fill': 'volume-up',
  
  // Miscellaneous
  'sparkles': 'auto-awesome',
  'globe': 'language',
  'building.columns.fill': 'account-balance',
  'car.fill': 'directions-car',
  'mountain.2.fill': 'terrain',
  'water.waves': 'waves',
  'cube.fill': 'view-in-ar',
  'square.grid.2x2.fill': 'grid-view',
  'pencil': 'edit',
  'trash.fill': 'delete',
  'rectangle.portrait.and.arrow.right': 'logout',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
