# 360° Immersive Experience for Monasteries

A Google Street View-like immersive experience for exploring monasteries and religious sites in Sikkim with panoramic views, interactive navigation, and audio narration.

## Features

### 1. **Panoramic 360° Viewer**
- **Touch Gestures**: Drag to look around the panoramic view
- **Smooth Navigation**: Natural panning with momentum
- **Compass Overlay**: Shows current viewing direction
- **Full-Screen Experience**: Immersive fullscreen mode

### 2. **Interactive Navigation Hotspots**
- **Arrow Indicators**: Animated arrows show available navigation points
- **Multiple Directions**: Navigate forward, backward, left, right, up, down
- **Labels**: Each hotspot displays the destination name
- **Visual Feedback**: Pulsing animation draws attention to navigation points

### 3. **Audio Narration System**
- **Background Audio**: Descriptive narration for each viewpoint
- **Playback Controls**: Play, pause, and see progress
- **Time Display**: Current position and total duration
- **Auto-Play Option**: Automatically starts narration when entering a viewpoint
- **Smooth UI**: Slide-in animation with elegant controls

### 4. **User Interface**
- **Top Controls**: Exit, viewpoint counter, info toggle
- **Info Panel**: Location name and description (auto-hides after 5s)
- **Help Text**: Instructions for navigation
- **Loading States**: Smooth transitions between viewpoints

## Usage

### Accessing the Immersive Experience

1. Navigate to a place details page for a religious site (monastery, temple, etc.)
2. Look for the **"360° Virtual Tour"** button
3. Tap to enter the immersive experience

### Navigation

- **Look Around**: Drag your finger to pan the view
- **Move to New Location**: Tap on the animated arrow hotspots
- **Audio**: Use the audio controls at the bottom to play/pause narration
- **Info**: Tap the info button (top right) to show/hide location details
- **Exit**: Tap the X button (top left) to exit the experience

## Implementation Details

### Components

#### `PanoramaViewer.tsx`
- Core panoramic image viewer
- Touch gesture handling with PanResponder
- Automatic image positioning based on orientation
- Compass indicator

#### `NavigationHotspot.tsx`
- Interactive navigation arrows
- Position-based rendering (percentage coordinates)
- Directional icons (forward, backward, left, right, up, down)
- Pulsing animation for visibility

#### `AudioNarration.tsx`
- Audio playback using expo-audio (replaces deprecated expo-av)
- Progress bar and time display
- Play/pause controls
- Slide-in animation
- Modern audio player API with useAudioPlayer hook

#### `immersive-experience.tsx`
- Main screen combining all components
- Viewpoint management and navigation
- Loading states and transitions
- Info panel with auto-hide

### Data Structure

```typescript
interface Viewpoint {
    id: string;
    name: string;
    description: string;
    imageUrl: string;           // 360° panoramic image
    audioUrl?: string;          // Optional narration audio file
    narrationText: string;      // Text description for narration
    hotspots: NavigationHotspot[];
}

interface NavigationHotspot {
    id: string;
    position: { x: number; y: number }; // 0-100 percentage
    direction: 'forward' | 'backward' | 'left' | 'right' | 'up' | 'down';
    label?: string;
    targetViewpointId: string;
}
```

### Mock Data

Currently uses mock data for Rumtek Monastery with 4 viewpoints:
1. **Main Entrance** - Grand entrance view
2. **Main Prayer Hall** - Central hall with murals
3. **Prayer Wheel Corridor** - Sacred prayer wheels
4. **Golden Stupa** - Magnificent golden stupa

## Adding New Monastery Experiences

To add a new monastery to the immersive experience:

1. **Prepare 360° Images**: 
   - Capture or obtain equirectangular panoramic images
   - Recommended resolution: 4096x2048 or higher
   - Format: JPG or PNG

2. **Create Audio Narrations** (optional):
   - Record descriptive audio for each viewpoint
   - Format: MP3 or M4A
   - Duration: 30-90 seconds recommended

3. **Define Viewpoints**:
   - Add to `MOCK_MONASTERY_VIEWPOINTS` in `immersive-experience.tsx`
   - Set hotspot positions (use percentage coordinates)
   - Link viewpoints via hotspots

4. **Update Place Details**:
   - Ensure the place category is 'Religious Site'
   - The 360° button will appear automatically

## Dependencies

- **expo-audio**: Modern audio playback (v~1.0.0) - replaces deprecated expo-av
- **react-native-reanimated**: Animations (v~4.1.1)
- **expo-router**: Navigation

## Migration from expo-av

This feature uses the new `expo-audio` package instead of the deprecated `expo-av`. Key changes:
- Uses `useAudioPlayer` hook instead of `Audio.Sound`
- Simplified API with automatic lifecycle management
- Better performance and reliability
- Native audio session handling

## Future Enhancements

- [ ] Gyroscope support for device motion tracking
- [ ] VR mode for compatible devices
- [ ] Multiple language support for narration
- [ ] Social sharing of specific viewpoints
- [ ] Offline caching of images and audio
- [ ] Admin panel to upload and manage viewpoints
- [ ] Analytics for popular viewpoints
- [ ] Bookmark favorite viewpoints
- [ ] Photo mode with filters

## Technical Notes

- Uses PanResponder for smooth touch gesture handling
- Orientation calculated from touch movements (yaw/pitch)
- Images positioned using Animated transforms
- All components are fully typed with TypeScript
- Supports both light and dark themes (via useThemeColor)
- Optimized for performance with minimal re-renders

## Platform Support

- ✅ iOS
- ✅ Android
- ⚠️ Web (limited - no gyroscope support)

## Accessibility

- Clear navigation labels
- Audio descriptions available
- High contrast hotspot indicators
- Large touch targets for navigation

---

**Created**: November 28, 2025
**Last Updated**: November 28, 2025
