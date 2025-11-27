import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, PanResponder } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';
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
    modelPath: 'rumtek',
  },
  {
    id: '2',
    name: 'Dubdi Monastery',
    description: 'Ancient monastery with rich historical significance',
    distance: '5.4 km',
    rating: 4.7,
    category: 'Religious Site',
    modelPath: 'dubdi',
  },
  {
    id: '3',
    name: 'Pemayangtse Monastery',
    description: 'One of the oldest and most important monasteries in Sikkim',
    distance: '12 km',
    rating: 4.9,
    category: 'Religious Site',
    modelPath: 'pemayantse',
  },
  {
    id: '4',
    name: 'Enchey Monastery',
    description: 'Historic monastery with peaceful surroundings',
    distance: '3.8 km',
    rating: 4.7,
    category: 'Religious Site',
    modelPath: 'enchey',
  },
  {
    id: '5',
    name: 'Phensong Monastery',
    description: 'Serene monastery nestled in the mountains',
    distance: '8.2 km',
    rating: 4.6,
    category: 'Religious Site',
    modelPath: 'phensong',
  },
  {
    id: '6',
    name: 'Samdruptse Hill',
    description: 'Giant statue of Guru Padmasambhava overlooking the valley',
    distance: '15 km',
    rating: 4.8,
    category: 'Monument',
    modelPath: 'samdruptsehill',
  },
  {
    id: '7',
    name: 'Kirateshwar Mahadev Temple',
    description: 'Sacred Hindu temple dedicated to Lord Shiva',
    distance: '9.5 km',
    rating: 4.7,
    category: 'Religious Site',
    modelPath: 'kirateshwar',
  },
  {
    id: '8',
    name: 'Rabdentse Ruins',
    description: 'Ancient royal palace ruins with historical importance',
    distance: '13 km',
    rating: 4.6,
    category: 'Historical Site',
    modelPath: 'rabdentseruins',
  },
  {
    id: '9',
    name: 'Tashiding Monastery',
    description: 'Sacred Buddhist monastery with stunning valley views',
    distance: '18 km',
    rating: 4.9,
    category: 'Religious Site',
    modelPath: 'tashiding',
  },
];

export default function ExploreScreen() {
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>(MOCK_NEARBY_PLACES);
  const modalHeight = useRef(new Animated.Value(MODAL_MIN_HEIGHT)).current;
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const router = useRouter();

  const handlePlacePress = (place: Place) => {
    router.push({
      pathname: '/(user)/(stack)/place-details',
      params: {
        id: place.id,
        name: place.name,
        description: place.description,
        distance: place.distance,
        rating: place.rating?.toString() || '',
        category: place.category,
        imageUrl: place.imageUrl || '',
        modelPath: place.modelPath || '',
      },
    });
  };

  const animateToHeight = (targetHeight: number, expand: boolean) => {
    setIsExpanded(expand);
    Animated.spring(modalHeight, {
      toValue: targetHeight,
      useNativeDriver: false,
      tension: 40,
      friction: 10,
      velocity: 0,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only handle vertical drags with minimal movement threshold
        const isDraggingVertically = Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 3;
        return isDraggingVertically;
      },
      onPanResponderGrant: () => {
        setScrollEnabled(false);
        // Stop any ongoing animation
        modalHeight.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        const baseHeight = isExpanded ? MODAL_MAX_HEIGHT : MODAL_MIN_HEIGHT;
        let newHeight = baseHeight - gestureState.dy;

        // Apply bounds with resistance
        if (newHeight > MODAL_MAX_HEIGHT) {
          const overflow = newHeight - MODAL_MAX_HEIGHT;
          newHeight = MODAL_MAX_HEIGHT + overflow * 0.15;
        } else if (newHeight < MODAL_MIN_HEIGHT) {
          const underflow = MODAL_MIN_HEIGHT - newHeight;
          newHeight = MODAL_MIN_HEIGHT - underflow * 0.15;
        }

        modalHeight.setValue(newHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        setScrollEnabled(true);
        
        const dragDistance = -gestureState.dy;
        const dragVelocity = -gestureState.vy;
        
        // Determine target based on velocity or distance
        let shouldExpand = isExpanded;
        
        // Require more intentional gestures
        if (Math.abs(dragVelocity) > 1.0) {
          // Fast swipe - use velocity
          shouldExpand = dragVelocity > 0;
        } else if (Math.abs(dragDistance) > 80) {
          // Slow drag - use distance
          shouldExpand = dragDistance > 0;
        }
        // If gesture is too small, maintain current state
        
        const targetHeight = shouldExpand ? MODAL_MAX_HEIGHT : MODAL_MIN_HEIGHT;
        
        // Use smooth timing animation for final snap
        Animated.timing(modalHeight, {
          toValue: targetHeight,
          duration: 300,
          useNativeDriver: false,
        }).start(() => {
          setIsExpanded(shouldExpand);
        });
      },
      onPanResponderTerminate: () => {
        setScrollEnabled(true);
        const targetHeight = isExpanded ? MODAL_MAX_HEIGHT : MODAL_MIN_HEIGHT;
        Animated.timing(modalHeight, {
          toValue: targetHeight,
          duration: 300,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  const toggleModal = () => {
    const targetHeight = isExpanded ? MODAL_MIN_HEIGHT : MODAL_MAX_HEIGHT;
    animateToHeight(targetHeight, !isExpanded);
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
        {/* Handle and Header - Combined Draggable Area */}
        <View {...panResponder.panHandlers}>
          <View style={styles.modalHandle}>
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
        </View>

        {/* Places List */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.modalScroll}
          contentContainerStyle={styles.modalContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={scrollEnabled}
          bounces={isExpanded}
          scrollEventThrottle={16}
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
