import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, PanResponder, ActivityIndicator, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';
import PlaceCard, { Place } from '@/components/explore/PlaceCard';
import { usePermissions } from '@/hooks/usePermissions';
import { useThemeColor } from '@/hooks/use-theme-color';
import { locationService } from '@/services';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = SCREEN_HEIGHT * 0.4;
const MODAL_MIN_HEIGHT = SCREEN_HEIGHT * 0.3;
const MODAL_MAX_HEIGHT = SCREEN_HEIGHT * 0.7;

// Sikkim coordinates (centered on Gangtok)
const SIKKIM_REGION = {
  latitude: 27.3389,
  longitude: 88.6065,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

// Map boundaries for Sikkim and adjacent areas
// Sikkim: 27.05°N to 28.13°N, 88.05°E to 88.93°E
// Including West Bengal (Darjeeling), Nepal border, Bhutan border, Tibet border
const MAP_BOUNDARIES = {
  minLatitude: 26.5,   // South (includes Darjeeling area)
  maxLatitude: 28.5,   // North (includes Tibet border)
  minLongitude: 87.8,  // West (includes Nepal border)
  maxLongitude: 89.2,  // East (includes Bhutan border)
};

export default function ExploreScreen() {
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([]);
  const [region, setRegion] = useState(SIKKIM_REGION);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [isUserInSikkim, setIsUserInSikkim] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const modalHeight = useRef(new Animated.Value(MODAL_MIN_HEIGHT)).current;
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const mapRef = useRef<MapView>(null);
  const router = useRouter();
  const { permissions, requestLocationPermission, getCurrentLocation } = usePermissions();

  // Theming
  const screenBg = useThemeColor('background');
  const cardBg = useThemeColor('card');
  const border = useThemeColor('border');
  const text = useThemeColor('text');
  const muted = useThemeColor('mutedText');
  const tint = useThemeColor('tint');
  const controlBg = useThemeColor('controlBg');
  const soft = useThemeColor('tintSoftBg');

  // Clamp coordinates to stay within Sikkim and adjacent areas
  const clampRegion = (region: typeof SIKKIM_REGION) => {
    const halfLatDelta = region.latitudeDelta / 2;
    const halfLngDelta = region.longitudeDelta / 2;

    let { latitude, longitude } = region;

    // Ensure the view doesn't go beyond boundaries
    latitude = Math.max(MAP_BOUNDARIES.minLatitude + halfLatDelta,
      Math.min(MAP_BOUNDARIES.maxLatitude - halfLatDelta, latitude));
    longitude = Math.max(MAP_BOUNDARIES.minLongitude + halfLngDelta,
      Math.min(MAP_BOUNDARIES.maxLongitude - halfLngDelta, longitude));

    return {
      ...region,
      latitude,
      longitude,
    };
  };

  useEffect(() => {
    // Request location permission on mount
    requestLocationPermission();
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const response = await locationService.list();
      const locations = response.data || [];

      // Map backend locations to Place format
      const mappedPlaces: Place[] = locations.map((loc: any) => ({
        id: loc._id,
        name: loc.name,
        description: loc.description || loc.short_description || 'Explore this amazing location',
        category: loc.type || 'Place',
        rating: 4.5,
        distance: '0 km',
        modelPath: loc.name.toLowerCase().replace(/\s+/g, ''),
        latitude: loc.position?.y || 27.3389,
        longitude: loc.position?.x || 88.6065,
      }));

      setNearbyPlaces(mappedPlaces);
      // Calculate initial distances from Gangtok
      const refLat = SIKKIM_REGION.latitude;
      const refLon = SIKKIM_REGION.longitude;
      const updatedPlaces = mappedPlaces.map(place => ({
        ...place,
        distance: `${calculateDistance(refLat, refLon, place.latitude || 0, place.longitude || 0)} km`,
      }));
      setNearbyPlaces(updatedPlaces);
    } catch (error) {
      console.error('Failed to load locations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  };

  // Update distances based on user location or default to Gangtok center
  const updatePlaceDistances = (userLat?: number, userLon?: number, isInSikkim: boolean = false) => {
    const refLat = userLat || SIKKIM_REGION.latitude; // Default to Gangtok
    const refLon = userLon || SIKKIM_REGION.longitude;

    const updatedPlaces = nearbyPlaces.map((place: Place) => {
      if (place.latitude && place.longitude) {
        const dist = calculateDistance(refLat, refLon, place.latitude, place.longitude);
        const distanceText = isInSikkim
          ? `${dist} km`
          : `${dist} km from Gangtok`;
        return {
          ...place,
          distance: distanceText,
        };
      }
      return place;
    });

    // Sort by distance
    updatedPlaces.sort((a: Place, b: Place) => {
      const distA = parseFloat(a.distance);
      const distB = parseFloat(b.distance);
      return distA - distB;
    });

    setNearbyPlaces(updatedPlaces);
  };

  useEffect(() => {
    // Update distances when component mounts or user location changes
    if (userLocation && isUserInSikkim) {
      updatePlaceDistances(userLocation.coords.latitude, userLocation.coords.longitude, true);
    } else {
      updatePlaceDistances(undefined, undefined, false); // Use Gangtok as reference
    }
  }, [userLocation, isUserInSikkim]);

  const handleGetUserLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const location = await getCurrentLocation();
      if (location) {
        // Store user location
        const locationObject = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation(locationObject);

        // Check if user location is within Sikkim boundaries
        const isWithinBounds =
          location.latitude >= MAP_BOUNDARIES.minLatitude &&
          location.latitude <= MAP_BOUNDARIES.maxLatitude &&
          location.longitude >= MAP_BOUNDARIES.minLongitude &&
          location.longitude <= MAP_BOUNDARIES.maxLongitude;

        setIsUserInSikkim(isWithinBounds);

        if (isWithinBounds) {
          const clampedLocation = clampRegion(location);
          setRegion(clampedLocation);
          mapRef.current?.animateToRegion(clampedLocation, 1000);
        } else {
          alert('Oops. You are currently outside this region. Showing distances from Gangtok, Sikkim.');
          mapRef.current?.animateToRegion(SIKKIM_REGION, 1000);
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

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
        // Only intercept if at top of scroll and dragging down
        const isDraggingVertically = Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 3;
        const isDraggingDown = gestureState.dy > 0;
        const isAtTop = scrollY <= 0;

        // Only handle pan if we're at the top and dragging down, or if modal is not expanded
        return isDraggingVertically && (isDraggingDown && isAtTop || !isExpanded);
      },
      onPanResponderGrant: () => {
        if (scrollY <= 0 || !isExpanded) {
          setScrollEnabled(false);
          // Stop any ongoing animation
          modalHeight.stopAnimation();
        }
      },
      onPanResponderMove: (_, gestureState) => {
        // Only move modal if at top or not expanded
        if (scrollY <= 0 || !isExpanded) {
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
        }
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

  const handleMarkerPress = (place: Place) => {
    // Animate to marker location
    if (place.latitude && place.longitude) {
      mapRef.current?.animateToRegion({
        latitude: place.latitude,
        longitude: place.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }, 1000);
    }
    // Open place details
    handlePlacePress(place);
  };

  const handleZoomIn = () => {
    const newRegion = clampRegion({
      ...region,
      latitudeDelta: Math.max(region.latitudeDelta / 2, 0.05), // Min zoom level
      longitudeDelta: Math.max(region.longitudeDelta / 2, 0.05),
    });
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 300);
  };

  const handleZoomOut = () => {
    // Calculate the maximum delta that keeps the entire Sikkim region in view
    const maxLatDelta = MAP_BOUNDARIES.maxLatitude - MAP_BOUNDARIES.minLatitude;
    const maxLonDelta = MAP_BOUNDARIES.maxLongitude - MAP_BOUNDARIES.minLongitude;

    const newLatDelta = region.latitudeDelta * 2;
    const newLonDelta = region.longitudeDelta * 2;

    // If zooming out would exceed boundaries, snap to max view showing entire region
    if (newLatDelta >= maxLatDelta || newLonDelta >= maxLonDelta) {
      const maxRegion = {
        latitude: (MAP_BOUNDARIES.minLatitude + MAP_BOUNDARIES.maxLatitude) / 2,
        longitude: (MAP_BOUNDARIES.minLongitude + MAP_BOUNDARIES.maxLongitude) / 2,
        latitudeDelta: maxLatDelta,
        longitudeDelta: maxLonDelta,
      };
      setRegion(maxRegion);
      mapRef.current?.animateToRegion(maxRegion, 300);
    } else {
      const newRegion = clampRegion({
        ...region,
        latitudeDelta: newLatDelta,
        longitudeDelta: newLonDelta,
      });
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 300);
    }
  };

  const handleRegionChange = (newRegion: typeof SIKKIM_REGION) => {
    const clampedRegion = clampRegion(newRegion);
    setRegion(clampedRegion);
  };

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      {/* Map Container with OpenStreetMap */}
      <View style={[styles.mapContainer, { backgroundColor: soft as string }]}>
        {!mapError ? (
          <>
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              initialRegion={SIKKIM_REGION}
              showsUserLocation={permissions.location === 'granted'}
              showsMyLocationButton={false}
              showsCompass={true}
              showsScale={true}
              onRegionChangeComplete={handleRegionChange}
              mapType="standard"
              loadingEnabled={true}
              loadingIndicatorColor={tint}
              loadingBackgroundColor={soft as string}
              minZoomLevel={8}
              maxZoomLevel={15}
            // onError={() => setMapError(true)}
            >
              {nearbyPlaces.map((place) => (
                place.latitude && place.longitude && (
                  <Marker
                    key={place.id}
                    coordinate={{
                      latitude: place.latitude,
                      longitude: place.longitude,
                    }}
                    title={place.name}
                    description={place.description}
                    onPress={() => handleMarkerPress(place)}
                    pinColor={tint as string}
                  />
                )
              ))}
            </MapView>
          </>
        ) : (
          <View style={styles.mapPlaceholder}>
            <IconSymbol name="map.fill" size={64} color={tint} />
            <Text style={[styles.mapPlaceholderText, { color: text }]}>Map Unavailable</Text>
            <Text style={[styles.mapSubtext, { color: muted }]}>Configure Google Maps API key</Text>
            <Text style={[styles.mapSubtext, { color: muted }]}>See MAP_SETUP.md for instructions</Text>
          </View>
        )}

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: controlBg }, isLoadingLocation && styles.controlButtonDisabled]}
            onPress={handleGetUserLocation}
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? (
              <ActivityIndicator size="small" color={tint} />
            ) : (
              <IconSymbol name="location.fill" size={24} color={tint} />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlButton, { backgroundColor: controlBg }]} onPress={handleZoomIn}>
            <IconSymbol name="plus" size={24} color={text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlButton, { backgroundColor: controlBg }]} onPress={handleZoomOut}>
            <IconSymbol name="minus" size={24} color={text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sliding Modal for Nearby Places */}
      <Animated.View
        style={[
          styles.modalContainer,
          { height: modalHeight, backgroundColor: cardBg }
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
              <View style={[styles.handle, { backgroundColor: border }]} />
            </TouchableOpacity>
          </View>

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: text }]}>Nearby Places</Text>
              <Text style={[styles.modalSubtitle, { color: muted }]}>
                {nearbyPlaces.length} places found
              </Text>
            </View>
            <TouchableOpacity style={[styles.filterButton, { backgroundColor: soft }]}>
              <IconSymbol name="slider.horizontal.3" size={20} color={tint} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Places List */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.modalScroll}
          contentContainerStyle={styles.modalContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={scrollEnabled && isExpanded}
          bounces={true}
          scrollEventThrottle={16}
          onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
        >
          {loading ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={tint as string} />
              <Text style={[{ color: muted, marginTop: 10 }]}>Loading places...</Text>
            </View>
          ) : nearbyPlaces.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={[{ color: muted }]}>No places found</Text>
            </View>
          ) : (
            nearbyPlaces.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                onPress={handlePlacePress}
              />
            ))
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  mapPlaceholderText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },
  mapSubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  controlButtonDisabled: {
    opacity: 0.6,
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: MODAL_MIN_HEIGHT,
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
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
