import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, PanResponder } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import PlaceCard, { Place } from '@/components/explore/PlaceCard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = SCREEN_HEIGHT * 0.4;
const MODAL_MIN_HEIGHT = SCREEN_HEIGHT * 0.3;
const MODAL_MAX_HEIGHT = SCREEN_HEIGHT * 0.7;

// Mock data for nearby places - replace with actual API
const MOCK_NEARBY_PLACES: Place[] = [
  {
    id: '1',
    name: 'Rumtek Monastery',
    description: 'Beautiful Buddhist monastery with stunning architecture',
    distance: '2.5 km',
    rating: 4.8,
    category: 'Religious Site',
  },
  {
    id: '2',
    name: 'MG Marg',
    description: 'Popular shopping street and pedestrian zone',
    distance: '1.2 km',
    rating: 4.5,
    category: 'Shopping',
  },
  {
    id: '3',
    name: 'Tsomgo Lake',
    description: 'Glacial lake at high altitude with scenic beauty',
    distance: '38 km',
    rating: 4.9,
    category: 'Natural Beauty',
  },
  {
    id: '4',
    name: 'Hanuman Tok',
    description: 'Temple dedicated to Lord Hanuman with panoramic views',
    distance: '11 km',
    rating: 4.6,
    category: 'Religious Site',
  },
  {
    id: '5',
    name: 'Enchey Monastery',
    description: 'Historic monastery with peaceful surroundings',
    distance: '3.8 km',
    rating: 4.7,
    category: 'Religious Site',
  },
];

export default function ExploreScreen() {
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>(MOCK_NEARBY_PLACES);
  const modalHeight = useRef(new Animated.Value(MODAL_MIN_HEIGHT)).current;
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePlacePress = (place: Place) => {
    console.log('Place pressed:', place);
    // TODO: Navigate to place details or show on map
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only activate if dragging vertically more than horizontally
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // Calculate new height based on drag with resistance at edges
        const baseHeight = isExpanded ? MODAL_MAX_HEIGHT : MODAL_MIN_HEIGHT;
        const newHeight = baseHeight - gestureState.dy;

        // Add resistance when dragging beyond boundaries with stricter clamping
        let clampedHeight;
        if (newHeight > MODAL_MAX_HEIGHT) {
          const overflow = newHeight - MODAL_MAX_HEIGHT;
          clampedHeight = MODAL_MAX_HEIGHT + (overflow * 0.2); // 20% resistance
        } else if (newHeight < MODAL_MIN_HEIGHT) {
          const underflow = MODAL_MIN_HEIGHT - newHeight;
          clampedHeight = MODAL_MIN_HEIGHT - (underflow * 0.2); // 20% resistance
        } else {
          clampedHeight = newHeight;
        }

        // Ensure we never go below a minimum threshold
        clampedHeight = Math.max(MODAL_MIN_HEIGHT * 0.8, clampedHeight);
        modalHeight.setValue(clampedHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        // Determine if should expand or collapse based on velocity and position
        const baseHeight = isExpanded ? MODAL_MAX_HEIGHT : MODAL_MIN_HEIGHT;
        const currentHeight = baseHeight - gestureState.dy;
        const threshold = (MODAL_MAX_HEIGHT + MODAL_MIN_HEIGHT) / 2;

        let targetHeight = MODAL_MIN_HEIGHT;
        let shouldExpand = false;

        // Prioritize velocity for quick gestures with adjusted thresholds
        if (gestureState.vy < -0.5) {
          // Swiped up quickly
          targetHeight = MODAL_MAX_HEIGHT;
          shouldExpand = true;
        } else if (gestureState.vy > 0.5) {
          // Swiped down quickly
          targetHeight = MODAL_MIN_HEIGHT;
          shouldExpand = false;
        } else if (Math.abs(gestureState.dy) > 50) {
          // Use drag distance if significant
          if (gestureState.dy < 0) {
            targetHeight = MODAL_MAX_HEIGHT;
            shouldExpand = true;
          } else {
            targetHeight = MODAL_MIN_HEIGHT;
            shouldExpand = false;
          }
        } else {
          // Use current position threshold
          if (currentHeight > threshold) {
            targetHeight = MODAL_MAX_HEIGHT;
            shouldExpand = true;
          } else {
            targetHeight = MODAL_MIN_HEIGHT;
            shouldExpand = false;
          }
        }

        setIsExpanded(shouldExpand);
        Animated.timing(modalHeight, {
          toValue: targetHeight,
          duration: 350,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  const toggleModal = () => {
    const targetHeight = isExpanded ? MODAL_MIN_HEIGHT : MODAL_MAX_HEIGHT;
    setIsExpanded(!isExpanded);
    Animated.timing(modalHeight, {
      toValue: targetHeight,
      duration: 350,
      useNativeDriver: false,
    }).start();
  };

  return (
    <View style={styles.container}>
      {/* Map Container - Placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <IconSymbol name="map.fill" size={64} color="#0a7ea4" />
          <Text style={styles.mapPlaceholderText}>Map View</Text>
          <Text style={styles.mapSubtext}>Integrate with mapping library</Text>
        </View>

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.controlButton}>
            <IconSymbol name="location.fill" size={24} color="#0a7ea4" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton}>
            <IconSymbol name="plus" size={24} color="#11181C" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton}>
            <IconSymbol name="minus" size={24} color="#11181C" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sliding Modal for Nearby Places */}
      <Animated.View
        style={[
          styles.modalContainer,
          { height: modalHeight }
        ]}
      >
        {/* Handle */}
        <View
          style={styles.modalHandle}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            onPress={toggleModal}
            activeOpacity={0.7}
            style={styles.handleTouchable}
          >
            <View style={styles.handle} />
          </TouchableOpacity>
        </View>

        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <View>
            <Text style={styles.modalTitle}>Nearby Places</Text>
            <Text style={styles.modalSubtitle}>
              {nearbyPlaces.length} places found
            </Text>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <IconSymbol name="slider.horizontal.3" size={20} color="#0a7ea4" />
          </TouchableOpacity>
        </View>

        {/* Places List */}
        <ScrollView
          style={styles.modalScroll}
          contentContainerStyle={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >
          {nearbyPlaces.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              onPress={handlePlacePress}
            />
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  mapContainer: {
    height: MAP_HEIGHT,
    backgroundColor: '#e8f4f8',
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#11181C',
    marginTop: 12,
  },
  mapSubtext: {
    fontSize: 14,
    color: '#687076',
    marginTop: 4,
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    top: 60,
    gap: 8,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: MODAL_MIN_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  modalExpanded: {
    height: SCREEN_HEIGHT * 0.7,
  },
  modalHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handleTouchable: {
    padding: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#11181C',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#687076',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f4f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
});
