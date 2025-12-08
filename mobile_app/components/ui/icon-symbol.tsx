// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolView, SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, Platform, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

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
  'chevron.down': 'expand-more',
  'magnifyingglass': 'search',
  'plus': 'add',
  'plus.circle.fill': 'add-circle',
  'minus': 'remove',
  'xmark': 'close',
  'ellipsis': 'more-horiz',
  'sparkles': 'auto-awesome',

  // Profile & User
  'person.crop.circle.fill': 'account-circle',
  'person.circle.fill': 'account-circle',
  'person.fill': 'person',
  'person.2.fill': 'people',
  'hand.raised.fill': 'pan-tool',

  // Location & Map
  'map.fill': 'map',
  'location.fill': 'location-on',
  'mappin.circle.fill': 'place',
  'mappin.and.ellipse': 'my-location',
  'building.2': 'business',
  'building.2.fill': 'business',

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
  'phone.fill': 'phone',
  'globe': 'language',

  // Time & Calendar
  'clock.fill': 'schedule',
  'clock': 'access-time',
  'calendar': 'event',
  'calendar.badge.clock': 'event-available',
  'sun.max.fill': 'wb-sunny',
  'moon.fill': 'brightness-2',

  // Shopping & Commerce
  'ticket.fill': 'confirmation-number',
  'cart.fill': 'shopping-cart',
  'creditcard.fill': 'payment',
  'indianrupeesign': 'currency-rupee',
  'indianrupeesign.circle.fill': 'currency-rupee',
  'tray.full.fill': 'inbox',

  // Settings & Info
  'gear': 'settings',
  'gearshape.fill': 'settings',
  'slider.horizontal.3': 'tune',
  'line.horizontal.3.decrease.circle': 'filter-list',
  'line.horizontal.3.decrease.circle.fill': 'filter-list',
  'info.circle.fill': 'info',
  'questionmark.circle.fill': 'help',
  'exclamationmark.triangle.fill': 'warning',
  'paintbrush.fill': 'palette',

  // Security & Privacy
  'lock.fill': 'lock',
  'lock.shield.fill': 'security',
  'shield.fill': 'security',
  'eye.fill': 'visibility',
  'eye.slash.fill': 'visibility-off',

  // Documents & Files
  'doc.text.fill': 'description',
  'folder.fill': 'folder',
  'photo.fill': 'photo',
  'photo.badge.plus': 'add-photo-alternate',
  'photo.stack': 'collections',
  'camera.fill': 'camera-alt',
  'trash.fill': 'delete',
  'archivebox.fill': 'archive',

  // Navigation & Direction
  'arrow.right': 'arrow-forward',
  'arrow.left': 'arrow-back',
  'arrow.up': 'arrow-upward',
  'arrow.down': 'arrow-downward',
  'arrow.triangle.turn.up.right.diamond.fill': 'directions',
  'arrow.triangle.turn.up.right.circle.fill': 'directions',
  'rectangle.portrait.and.arrow.right': 'exit-to-app',

  // Social & Sharing
  'square.and.arrow.up': 'share',
  'link': 'link',

  // Status & Indicators
  'checkmark.circle.fill': 'check-circle',
  'checkmark.circle': 'check-circle-outline',
  'checkmark': 'check',
  'xmark.circle.fill': 'cancel',
  'circle.fill': 'circle',
  'checkmark.seal.fill': 'verified',
  'checkmark.shield.fill': 'verified-user',

  // Content
  'text.alignleft': 'format-align-left',
  'tag.fill': 'label',
  'number': 'tag',

  // Media
  'play.fill': 'play-arrow',
  'pause.fill': 'pause',
  'speaker.wave.2.fill': 'volume-up',

  // Charts & Analytics
  'chart.bar.fill': 'bar-chart',
  'chart.pie.fill': 'pie-chart',

  // Layout & Grid
  'rectangle.3.offgrid.fill': 'view-module',
  'square.grid.2x2.fill': 'grid-view',

  // User Management
  'person.badge.key.fill': 'admin-panel-settings',
  'person.badge.plus': 'person-add',
  'person.badge.plus.fill': 'person-add',

  // Additional icons used in business screens
  'pencil': 'edit',
  'briefcase.fill': 'work',
  'banknote.fill': 'account-balance-wallet',

  // Additional icons for immersive experience
  'hand.draw.fill': 'gesture',
  'hand.tap.fill': 'touch-app',
  'rotate.3d': '3d-rotation',
  'arrow.up.circle': 'arrow-circle-up',
  'arrow.down.circle': 'arrow-circle-down',

  // Additional icons for admin screens
  'person.3.fill': 'groups',
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
  weight = 'regular',
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle | ViewStyle>;
  weight?: SymbolWeight;
}) {
  // Use native SF Symbols on iOS
  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        weight={weight}
        tintColor={color}
        resizeMode="scaleAspectFit"
        name={name}
        style={[
          {
            width: size,
            height: size,
          },
          style as StyleProp<ViewStyle>,
        ]}
      />
    );
  }

  // Use Material Icons on Android and web
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style as StyleProp<TextStyle>} />;
}
