import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking, FlatList, Dimensions, Modal, StatusBar, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageTranslations } from '@/constants/translations';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function ZoomableImage({ uri }: { uri: string }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else if (scale.value > 3) {
        scale.value = withSpring(3);
        savedScale.value = 3;
      } else {
        savedScale.value = scale.value;
      }
    });

  const panGesture = Gesture.Pan()
    .enabled(scale.value > 1)
    .onUpdate((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      
      if (scale.value <= 1) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const composed = Gesture.Race(pinchGesture, panGesture);

  return (
    <View style={styles.fullScreenImageWrapper}>
      <GestureDetector gesture={composed}>
        <Animated.View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
          <Animated.Image
            source={{ uri }}
            style={[styles.fullScreenImage, animatedStyle]}
            resizeMode="contain"
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export default function PlaceDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { language } = useLanguage();
  const t = getLanguageTranslations(language);
  const background = useThemeColor('background');
  const card = useThemeColor('card');
  const text = useThemeColor('text');
  const muted = useThemeColor('mutedText');
  const tint = useThemeColor('tint');
  const border = useThemeColor('border');
  const soft = useThemeColor('tintSoftBg');

  // Parse the place data from params
  const imagesParam = params.images as string;
  let images: string[] = [];
  try {
    images = imagesParam ? JSON.parse(imagesParam) : [];
  } catch (e) {
    console.error('Failed to parse images:', e);
  }
  
  const has360Images =
    (typeof params.has360Images === 'string' && params.has360Images === 'true') ||
    (typeof params.has360Images === 'boolean' && params.has360Images === true);
  
  const place = {
    id: params.id as string,
    name: params.name as string,
    description: params.description as string,
    distance: params.distance as string,
    rating: params.rating ? parseFloat(params.rating as string) : undefined,
    category: params.category as string,
    imageUrl: params.imageUrl as string | undefined,
    images: images,
    modelPath: params.modelPath as string | undefined,
    has360Images: has360Images,
  };
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const [fullScreenImageIndex, setFullScreenImageIndex] = useState(0);

  const handleImagePress = (index: number) => {
    setFullScreenImageIndex(index);
    setFullScreenVisible(true);
  };

  const handleOpenImmersiveView = () => {
    if (place.modelPath) {
      // If modelPath is a full URL, use it directly; otherwise construct viewer URL
      const url = place.modelPath.startsWith('http') 
        ? place.modelPath 
        : `https://models.shrishesha.space/viewer/${place.modelPath}`;
      Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
    }
  };

  const handleOpen360Experience = () => {
    // Navigate to the immersive 360 experience screen
    router.push({
      pathname: '/(user)/(stack)/immersive-experience',
      params: { 
        placeId: place.id || 'rumtek-monastery',
        panorama360Url: params.panorama360Url as string || '',
        placeName: place.name,
        placeDescription: place.description,
        shortDescription: params.shortDescription as string || place.description,
        latitude: params.latitude as string || '',
        longitude: params.longitude as string || '',
      },
    } as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Header - Gallery Carousel */}
        <View style={styles.imageContainer}>
          {place.images && place.images.length > 0 ? (
            <>
              <FlatList
                data={place.images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                  const index = Math.floor(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                  setCurrentImageIndex(index);
                }}
                renderItem={({ item, index }) => (
                  <TouchableOpacity 
                    activeOpacity={0.9}
                    onPress={() => handleImagePress(index)}
                  >
                    <Image
                      source={{ uri: item }}
                      style={[styles.image, { width: SCREEN_WIDTH }]}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                )}
                keyExtractor={(item, index) => `image-${index}`}
              />
              
              {/* Image Counter */}
              {place.images.length > 1 && (
                <View style={[styles.imageCounter, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                  <Text style={styles.imageCounterText}>
                    {currentImageIndex + 1} / {place.images.length}
                  </Text>
                </View>
              )}
              
              {/* Pagination Dots */}
              {place.images.length > 1 && place.images.length <= 10 && (
                <View style={styles.paginationDots}>
                  {place.images.map((_, index) => (
                    <View
                      key={`dot-${index}`}
                      style={[
                        styles.dot,
                        {
                          backgroundColor: index === currentImageIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                          width: index === currentImageIndex ? 8 : 6,
                          height: index === currentImageIndex ? 8 : 6,
                        },
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : place.imageUrl ? (
            <Image
              source={{ uri: place.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: soft }]}>
              <IconSymbol name="map.fill" size={64} color={tint} />
            </View>
          )}
          
          {/* Back Button */}
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: card }]} 
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color={text} />
          </TouchableOpacity>
        </View>

        {/* Place Details */}
        <View style={styles.content}>
          {/* Title and Rating */}
          <View style={styles.header}>
            <Text style={[styles.name, { color: text }]}>{place.name}</Text>
            {place.rating && (
              <View style={styles.ratingContainer}>
                <IconSymbol name="star.fill" size={20} color="#fbbf24" />
                <Text style={[styles.rating, { color: text }]}>{place.rating}</Text>
              </View>
            )}
          </View>

          {/* Category and Distance */}
          <View style={styles.metaInfo}>
            <View style={styles.categoryContainer}>
              <IconSymbol name="tag.fill" size={16} color={muted} />
              <Text style={[styles.category, { color: muted }]}>{place.category}</Text>
            </View>
            <View style={styles.distanceContainer}>
              <IconSymbol name="location.fill" size={16} color={muted} />
              <Text style={[styles.distance, { color: muted }]}>{place.distance}</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: text }]}>{t.about || 'About'}</Text>
            <Text style={[styles.description, { color: muted }]}>{place.description}</Text>
          </View>

          {/* Immersive Experience Buttons - Only show if features are available */}
          {(place.has360Images || place.modelPath) && (
            <View style={styles.immersiveButtonsContainer}>
              {/* 360 Experience Button - Show if admin uploaded 360 images */}
              {place.has360Images && (
                <TouchableOpacity 
                  style={[styles.immersiveButton, { backgroundColor: tint, shadowColor: tint as string }]}
                  onPress={handleOpen360Experience}
                  activeOpacity={0.8}
                >
                  <IconSymbol name="arrow.triangle.turn.up.right.diamond.fill" size={24} color="#fff" />
                  <Text style={styles.immersiveButtonText}>360° Virtual Tour</Text>
                  <IconSymbol name="arrow.right" size={20} color="#fff" />
                </TouchableOpacity>
              )}

              {/* 3D Model View Button - Only show if admin uploaded a model */}
              {place.modelPath && (
                <TouchableOpacity 
                  style={[styles.immersiveButton, { backgroundColor: '#8b5cf6', shadowColor: '#8b5cf6' }]}
                  onPress={handleOpenImmersiveView}
                  activeOpacity={0.8}
                >
                  <IconSymbol name="cube.fill" size={24} color="#fff" />
                  <Text style={styles.immersiveButtonText}>3D Model View</Text>
                  <IconSymbol name="arrow.right" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Additional Information */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: text }]}>Details</Text>
            
            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: soft }] }>
                <IconSymbol name="clock.fill" size={20} color={tint} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: text }]}>Visiting Hours</Text>
                <Text style={[styles.detailValue, { color: muted }]}>Open daily: 6:00 AM - 6:00 PM</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: soft }] }>
                <IconSymbol name="ticket.fill" size={20} color={tint} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: text }]}>Entry Fee</Text>
                <Text style={[styles.detailValue, { color: muted }]}>Free / Donations welcome</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: soft }]}>
                <IconSymbol name="info.circle.fill" size={20} color={tint} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: text }]}>Best Time to Visit</Text>
                <Text style={[styles.detailValue, { color: muted }]}>March to June, September to December</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={[styles.actionButtons, { borderTopColor: border }] }>
            <TouchableOpacity style={styles.actionButton}>
              <IconSymbol name="map.fill" size={22} color={tint} />
              <Text style={[styles.actionButtonText, { color: tint }]}>Directions</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <IconSymbol name="heart" size={22} color={tint} />
              <Text style={[styles.actionButtonText, { color: tint }]}>Save</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <IconSymbol name="square.and.arrow.up" size={22} color={tint} />
              <Text style={[styles.actionButtonText, { color: tint }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      {/* Full-Screen Image Viewer Modal */}
      <Modal
        visible={fullScreenVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setFullScreenVisible(false)}
        statusBarTranslucent={true}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={styles.fullScreenContainer}>
            <StatusBar hidden={Platform.OS === 'ios'} barStyle="light-content" />
            
            {/* Close Button */}
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setFullScreenVisible(false)}
            >
              <IconSymbol name="xmark" size={28} color="#fff" />
            </TouchableOpacity>
            
            {/* Full-Screen Image Carousel */}
            {place.images && place.images.length > 0 && (
              <>
                <FlatList
                  data={place.images}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  scrollEnabled={true}
                  initialScrollIndex={fullScreenImageIndex}
                  getItemLayout={(data, index) => ({
                    length: SCREEN_WIDTH,
                    offset: SCREEN_WIDTH * index,
                    index,
                  })}
                  onMomentumScrollEnd={(event) => {
                    const index = Math.floor(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                    setFullScreenImageIndex(index);
                  }}
                  renderItem={({ item }) => (
                    <ZoomableImage uri={item} />
                  )}
                  keyExtractor={(item, index) => `fullscreen-${index}`}
                />
                
                {/* Full-Screen Counter */}
                <View style={styles.fullScreenCounter}>
                  <Text style={styles.fullScreenCounterText}>
                    {fullScreenImageIndex + 1} / {place.images.length}
                  </Text>
                </View>
                
                {/* Full-Screen Pagination Dots */}
                {place.images.length > 1 && place.images.length <= 10 && (
                  <View style={styles.fullScreenPagination}>
                    {place.images.map((_, index) => (
                      <View
                        key={`fullscreen-dot-${index}`}
                        style={[
                          styles.fullScreenDot,
                          {
                            backgroundColor: index === fullScreenImageIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                            width: index === fullScreenImageIndex ? 10 : 8,
                            height: index === fullScreenImageIndex ? 10 : 8,
                          },
                        ]}
                      />
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        </GestureHandlerRootView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#0000',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 300,
  },
  imageCounter: {
    position: 'absolute',
    top: 60,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  paginationDots: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    borderRadius: 4,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8f4f8',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  name: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    marginRight: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff7ed',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  rating: {
    fontSize: 16,
    fontWeight: '700',
  },
  metaInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  category: {
    fontSize: 14,
    fontWeight: '500',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distance: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  immersiveButtonsContainer: {
    marginBottom: 24,
    gap: 12,
  },
  immersiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  immersiveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImageWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  fullScreenCounter: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  fullScreenCounterText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  fullScreenPagination: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  fullScreenDot: {
    borderRadius: 5,
  },
});
