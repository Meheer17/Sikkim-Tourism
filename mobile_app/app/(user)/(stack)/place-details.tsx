import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Dimensions,
  Modal,
  StatusBar,
  Platform,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageTranslations } from '@/constants/translations';
import { buildImageUrl } from '@/utils/image-url';
import { locationService } from '@/services/location.service';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TranscriptionItem {
  id: string;
  text: string;
  avg_confidence?: number;
  file_name?: string;
  created_at: string;
}

interface PlaceState {
  id: string;
  name: string;
  description: string;
  distance: string;
  rating?: number;
  category: string;
  imageUrl?: string;
  images: string[];
  modelPath?: string;
  has360Images: boolean;
  panorama360Url?: string;
  latitude?: number;
  longitude?: number;
  transcriptions: TranscriptionItem[];
}

function SafeImageViewer({ uri }: { uri: string }) {
  if (!uri || !/^https?:\/\//i.test(uri)) {
    return (
      <View style={[styles.fullScreenImageWrapper, { justifyContent: 'center', alignItems: 'center' }]}>
        <IconSymbol name="photo" size={48} color="#666" />
      </View>
    );
  }

  return (
    <View style={styles.fullScreenImageWrapper}>
      <ScrollView
        maximumZoomScale={3}
        minimumZoomScale={1}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          width: SCREEN_WIDTH,
          height: SCREEN_HEIGHT,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        centerContent
      >
        <Image
          source={{ uri }}
          style={styles.fullScreenImage}
          resizeMode="contain"
        />
      </ScrollView>
    </View>
  );
}

// Error boundary to prevent any unhandled error from crashing the entire app
class PlaceErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; errorText: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorText: '' };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorText: String(error?.message || error) };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('PlaceDetailsScreen caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' }}>
          <IconSymbol name="exclamationmark.triangle.fill" size={48} color="#ef4444" />
          <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 16, color: '#111' }}>
            Unable to display place
          </Text>
          <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8, marginBottom: 20 }}>
            An unexpected error occurred while loading this place's details.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#0a7ea4', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 }}
            onPress={() => this.setState({ hasError: false, errorText: '' })}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

function PlaceDetailsScreenInner() {
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

  const fullScreenScrollRef = useRef<ScrollView>(null);

  // Parse initial scalar params safely
  const placeId = String(params.id || '');
  const initialName = String(params.name || 'Location Details');
  const initialDesc = String(params.description || '');
  const initialDistance = String(params.distance || '');
  const initialCategory = String(params.category || 'Place');
  const rawRating = params.rating ? parseFloat(String(params.rating)) : undefined;
  const initialRating = (rawRating !== undefined && !isNaN(rawRating)) ? rawRating : undefined;
  const parsedLat = params.latitude ? parseFloat(String(params.latitude)) : undefined;
  const parsedLon = params.longitude ? parseFloat(String(params.longitude)) : undefined;
  const initialLat = (parsedLat !== undefined && !isNaN(parsedLat)) ? parsedLat : undefined;
  const initialLon = (parsedLon !== undefined && !isNaN(parsedLon)) ? parsedLon : undefined;

  let initialSingleImage: string | undefined = undefined;
  if (params.imageUrl) {
    const built = buildImageUrl(String(params.imageUrl));
    if (built && /^https?:\/\//i.test(built)) {
      initialSingleImage = built;
    }
  }

  // Handle images param if passed
  let initialImages: string[] = [];
  if (initialSingleImage) {
    initialImages.push(initialSingleImage);
  }
  if (params.images) {
    try {
      const parsed = typeof params.images === 'string' ? JSON.parse(params.images) : params.images;
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item === 'string' && item.trim()) {
            const built = buildImageUrl(item.trim()) || item.trim();
            if (/^https?:\/\//i.test(built) && !initialImages.includes(built)) {
              initialImages.push(built);
            }
          }
        }
      }
    } catch {
      // Ignore parse failure on image params
    }
  }

  const [place, setPlace] = useState<PlaceState>({
    id: placeId,
    name: initialName,
    description: initialDesc,
    distance: initialDistance,
    rating: initialRating,
    category: initialCategory,
    imageUrl: initialSingleImage,
    images: initialImages,
    modelPath: undefined,
    has360Images: false,
    panorama360Url: undefined,
    latitude: initialLat,
    longitude: initialLon,
    transcriptions: [],
  });

  const [loadingBackend, setLoadingBackend] = useState<boolean>(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const [fullScreenImageIndex, setFullScreenImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedTranscription, setSelectedTranscription] = useState<TranscriptionItem | null>(null);
  const [transcriptionModalVisible, setTranscriptionModalVisible] = useState(false);

  // Fetch full details from backend by ID
  useEffect(() => {
    if (!placeId) return;

    let isMounted = true;
    const fetchFullLocation = async () => {
      try {
        setLoadingBackend(true);
        const resp = await locationService.get(placeId);
        if (!isMounted) return;

        if (resp && resp.success && resp.data) {
          const loc = resp.data;

          // Parse images
          const rawImgs: string[] = loc.metadata?.images || [];
          const validatedImages: string[] = [];
          for (const img of rawImgs) {
            if (typeof img === 'string' && img.trim()) {
              const built = buildImageUrl(img.trim()) || img.trim();
              if (/^https?:\/\//i.test(built) && !validatedImages.includes(built)) {
                validatedImages.push(built);
              }
            }
          }
          if (initialSingleImage && !validatedImages.includes(initialSingleImage)) {
            validatedImages.unshift(initialSingleImage);
          }

          // Parse transcriptions safely
          const rawTrans = Array.isArray(loc.transcriptions) ? loc.transcriptions : [];
          const safeTranscriptions: TranscriptionItem[] = rawTrans.map((t: any, idx: number) => ({
            id: String(t.id || t._id || `t-${idx}`),
            text: typeof t.text === 'string' ? t.text : (t.text ? JSON.stringify(t.text) : ''),
            avg_confidence: typeof t.avg_confidence === 'number' ? t.avg_confidence : undefined,
            file_name: typeof t.file_name === 'string' ? t.file_name : undefined,
            created_at: String(t.created_at || ''),
          }));

          // Parse 3D model path
          let rawModel = loc.metadata?.models;
          let modelStr: string | undefined = undefined;
          if (Array.isArray(rawModel) && rawModel.length > 0) {
            modelStr = String(rawModel[0]);
          } else if (typeof rawModel === 'string' && rawModel.trim()) {
            modelStr = rawModel.trim();
          } else if (loc.metadata?.model_url) {
            modelStr = String(loc.metadata.model_url);
          }

          // Parse 360 panorama
          const panoRaw = loc.metadata?.panorama_360;
          const panoUrl = panoRaw ? (buildImageUrl(panoRaw) || String(panoRaw)) : undefined;

          // Coordinates
          const lat = loc.position?.y !== undefined ? Number(loc.position.y) : initialLat;
          const lon = loc.position?.x !== undefined ? Number(loc.position.x) : initialLon;

          // Description
          const descStr = typeof loc.description === 'string' && loc.description.trim()
            ? loc.description
            : (typeof loc.short_description === 'string' ? loc.short_description : initialDesc);

          setPlace((prev) => ({
            ...prev,
            name: String(loc.name || prev.name),
            description: descStr,
            category: String(loc.type || prev.category),
            images: validatedImages.length > 0 ? validatedImages : prev.images,
            imageUrl: validatedImages[0] || prev.imageUrl,
            transcriptions: safeTranscriptions,
            modelPath: modelStr || prev.modelPath,
            has360Images: !!panoRaw,
            panorama360Url: panoUrl,
            latitude: lat,
            longitude: lon,
          }));
        }
      } catch (err) {
        console.warn('Could not fetch location details from backend:', err);
      } finally {
        if (isMounted) {
          setLoadingBackend(false);
        }
      }
    };

    fetchFullLocation();

    return () => {
      isMounted = false;
    };
  }, [placeId]);

  // Check if place is favorited on mount
  useEffect(() => {
    checkFavoriteStatus();
  }, [place.id]);

  const checkFavoriteStatus = async () => {
    if (!place.id) return;
    try {
      const favoritesData = await AsyncStorage.getItem('favorites');
      const parsed = favoritesData ? JSON.parse(favoritesData) : [];
      const favorites = Array.isArray(parsed) ? parsed : [];
      setIsFavorite(favorites.includes(place.id));
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!place.id) return;
    try {
      const favoritesData = await AsyncStorage.getItem('favorites');
      const parsed = favoritesData ? JSON.parse(favoritesData) : [];
      let favorites = Array.isArray(parsed) ? parsed : [];

      if (isFavorite) {
        favorites = favorites.filter((id: string) => id !== place.id);
        setIsFavorite(false);
      } else {
        if (!favorites.includes(place.id)) {
          favorites.push(place.id);
        }
        setIsFavorite(true);
        Alert.alert('Success', 'This place is added to your favourites');
      }

      await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const handleImagePress = (index: number) => {
    setFullScreenImageIndex(index);
    setFullScreenVisible(true);
    setTimeout(() => {
      fullScreenScrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: false });
    }, 100);
  };

  const handleTranscriptionPress = (transcription: TranscriptionItem) => {
    setSelectedTranscription(transcription);
    setTranscriptionModalVisible(true);
  };

  const handleOpenImmersiveView = () => {
    if (place.modelPath) {
      let rawModel = place.modelPath;
      const match = rawModel.match(/(?:models|viewer)\/([^/?#]+)/i);
      if (match && match[1]) {
        rawModel = match[1];
      }
      router.push({
        pathname: '/(user)/3d',
        params: { modelPath: rawModel, name: place.name },
      } as any);
    }
  };

  const handleOpen360Experience = () => {
    router.push({
      pathname: '/(user)/(stack)/immersive-experience',
      params: {
        placeId: place.id || 'place-tour',
        panorama360Url: place.panorama360Url || '',
        placeName: place.name,
        placeDescription: place.description,
        shortDescription: place.description,
        latitude: place.latitude ? String(place.latitude) : '',
        longitude: place.longitude ? String(place.longitude) : '',
      },
    } as any);
  };

  const handleDirections = async () => {
    if (!place.latitude || !place.longitude) {
      Alert.alert('Error', 'Location coordinates not available for this place');
      return;
    }

    try {
      const latLng = `${place.latitude},${place.longitude}`;
      const label = encodeURIComponent(place.name);

      let url: string | null = null;
      if (Platform.OS === 'ios') {
        url = `maps:?q=${label}&ll=${latLng}`;
      } else {
        url = `geo:${place.latitude},${place.longitude}?q=${label}`;
      }

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        const webUrl = `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
        const canOpenWeb = await Linking.canOpenURL(webUrl);
        if (canOpenWeb) {
          await Linking.openURL(webUrl);
        } else {
          Alert.alert('Error', 'Cannot open maps application');
        }
      }
    } catch (error) {
      console.error('Direction error:', error);
      Alert.alert('Error', 'Failed to open directions');
    }
  };

  const handleShare = async () => {
    try {
      const shareMessage = `Check out ${place.name}!\n\n${place.description}\n\nCategory: ${place.category}\nRating: ${place.rating || 'N/A'}\n\nLocation: https://www.google.com/maps/search/?api=1&query=${place.latitude || ''},${place.longitude || ''}`;

      await Share.share({
        message: shareMessage,
        title: place.name,
        url: place.imageUrl || undefined,
      });
    } catch (error: any) {
      console.error('Error sharing:', error);
      if (error.message !== 'User did not share') {
        Alert.alert('Error', 'Failed to share location');
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Header - Horizontal ScrollView Carousel (Safe on Android) */}
        <View style={styles.imageContainer}>
          {place.images && place.images.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                  setCurrentImageIndex(index);
                }}
                scrollEventThrottle={16}
              >
                {place.images.map((imgUri, index) => (
                  <TouchableOpacity
                    key={`img-${index}`}
                    activeOpacity={0.9}
                    onPress={() => handleImagePress(index)}
                  >
                    <Image
                      source={{ uri: imgUri }}
                      style={[styles.image, { width: SCREEN_WIDTH }]}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>

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

        {/* Place Details Content */}
        <View style={styles.content}>
          {/* Title and Favorite */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: text }]}>{String(place.name)}</Text>
              <TouchableOpacity
                style={[
                  styles.favoriteButtonInline,
                  {
                    backgroundColor: isFavorite ? '#fee2e2' : soft,
                    borderWidth: 1,
                    borderColor: isFavorite ? '#ef4444' : border,
                  },
                ]}
                onPress={toggleFavorite}
                activeOpacity={0.7}
              >
                <IconSymbol name="heart.fill" size={18} color={isFavorite ? '#ef4444' : muted} />
                <Text style={[styles.favoriteText, { color: isFavorite ? '#ef4444' : text }]}>
                  {isFavorite ? 'Favorited' : 'Add to Favorites'}
                </Text>
              </TouchableOpacity>
            </View>
            {typeof place.rating === 'number' && place.rating > 0 ? (
              <View style={styles.ratingContainerTop}>
                <IconSymbol name="star.fill" size={24} color="#fbbf24" />
                <Text style={[styles.rating, { color: text }]}>{place.rating}</Text>
              </View>
            ) : null}
          </View>

          {/* Category and Distance */}
          <View style={styles.metaInfo}>
            <View style={styles.categoryContainer}>
              <IconSymbol name="tag.fill" size={16} color={muted} />
              <Text style={[styles.category, { color: muted }]}>{String(place.category)}</Text>
            </View>
            {Boolean(place.distance) && (
              <View style={styles.distanceContainer}>
                <IconSymbol name="location.fill" size={16} color={muted} />
                <Text style={[styles.distance, { color: muted }]}>{String(place.distance)}</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: text }]}>{t.about || 'About'}</Text>
            {loadingBackend && !place.description ? (
              <ActivityIndicator size="small" color={tint as string} style={{ alignSelf: 'flex-start' }} />
            ) : (
              <Text style={[styles.description, { color: muted }]}>
                {String(place.description || 'Explore this beautiful heritage location.')}
              </Text>
            )}
          </View>

          {/* Immersive Experience Buttons - Only show if features are available */}
          {(place.has360Images || place.modelPath) && (
            <View style={styles.immersiveButtonsContainer}>
              {/* 360 Experience Button */}
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

              {/* 3D Model View Button */}
              {Boolean(place.modelPath) && (
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

          {/* Transcriptions - OCR Extracted Text */}
          {place.transcriptions && place.transcriptions.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <IconSymbol name="doc.text.fill" size={24} color={tint} />
                <Text style={[styles.sectionTitle, { color: text }]}>Information from Signboards</Text>
              </View>
              <Text style={[styles.sectionSubtitle, { color: muted }]}>
                Text extracted from photos using OCR technology
              </Text>
              {place.transcriptions.map((trans, index) => (
                <TouchableOpacity
                  key={trans.id || `trans-${index}`}
                  style={[
                    styles.manuscriptItem,
                    {
                      backgroundColor: soft,
                      borderColor: border,
                    },
                  ]}
                  onPress={() => handleTranscriptionPress(trans)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.manuscriptNumber, { backgroundColor: tint }]}>
                    <Text style={styles.manuscriptNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.manuscriptContent}>
                    <Text style={[styles.manuscriptTitle, { color: text }]} numberOfLines={1}>
                      {String(trans.file_name || `Manuscript ${index + 1}`)}
                    </Text>
                    <Text style={[styles.manuscriptPreview, { color: muted }]} numberOfLines={2}>
                      {String(trans.text || '')}
                    </Text>
                    {trans.avg_confidence !== undefined && (
                      <Text style={[styles.manuscriptConfidence, { color: muted }]}>
                        {Math.round(trans.avg_confidence * 100)}% accuracy
                      </Text>
                    )}
                  </View>
                  <IconSymbol name="chevron.right" size={20} color={muted} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Additional Information */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: text }]}>Details</Text>

            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: soft }]}>
                <IconSymbol name="clock.fill" size={20} color={tint} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: text }]}>Visiting Hours</Text>
                <Text style={[styles.detailValue, { color: muted }]}>Open daily: 6:00 AM - 6:00 PM</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: soft }]}>
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
          <View style={[styles.actionButtons, { borderTopColor: border }]}>
            <TouchableOpacity style={styles.actionButton} onPress={handleDirections}>
              <IconSymbol name="map.fill" size={22} color={tint} />
              <Text style={[styles.actionButtonText, { color: tint }]}>Directions</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <IconSymbol name="square.and.arrow.up" size={22} color={tint} />
              <Text style={[styles.actionButtonText, { color: tint }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Full-Screen Image Viewer Modal */}
      {fullScreenVisible && (
        <Modal
          visible={fullScreenVisible}
          transparent={false}
          animationType="fade"
          onRequestClose={() => setFullScreenVisible(false)}
          statusBarTranslucent={true}
        >
          <View style={styles.fullScreenContainer}>
            <StatusBar hidden={Platform.OS === 'ios'} barStyle="light-content" />

            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={() => setFullScreenVisible(false)}>
              <IconSymbol name="xmark" size={28} color="#fff" />
            </TouchableOpacity>

            {/* Full-Screen Image Carousel */}
            {place.images && place.images.length > 0 && (
              <>
                <ScrollView
                  ref={fullScreenScrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                    setFullScreenImageIndex(index);
                  }}
                  scrollEventThrottle={16}
                >
                  {place.images.map((imgUri, index) => (
                    <SafeImageViewer key={`full-${index}`} uri={imgUri} />
                  ))}
                </ScrollView>

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
        </Modal>
      )}

      {/* Transcription Detail Modal */}
      <Modal
        visible={transcriptionModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setTranscriptionModalVisible(false)}
      >
        <View style={[styles.transcriptionModal, { backgroundColor: background }]}>
          <StatusBar barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'} />

          {/* Header */}
          <View style={[styles.transcriptionModalHeader, { borderBottomColor: border }]}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setTranscriptionModalVisible(false)}>
              <IconSymbol name="xmark" size={24} color={text} />
            </TouchableOpacity>
            <Text style={[styles.transcriptionModalTitle, { color: text }]}>Manuscript Details</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Content */}
          <ScrollView style={styles.transcriptionModalContent} showsVerticalScrollIndicator={false}>
            {selectedTranscription && (
              <>
                {/* Metadata */}
                <View style={[styles.transcriptionMetaCard, { backgroundColor: soft, borderColor: border }]}>
                  {Boolean(selectedTranscription.file_name) && (
                    <View style={styles.transcriptionMetaRow}>
                      <IconSymbol name="photo.fill" size={18} color={tint} />
                      <Text style={[styles.transcriptionMetaLabel, { color: muted }]}>Source:</Text>
                      <Text style={[styles.transcriptionMetaValue, { color: text }]}>
                        {String(selectedTranscription.file_name)}
                      </Text>
                    </View>
                  )}
                  {selectedTranscription.avg_confidence !== undefined && (
                    <View style={styles.transcriptionMetaRow}>
                      <IconSymbol name="checkmark.seal.fill" size={18} color={tint} />
                      <Text style={[styles.transcriptionMetaLabel, { color: muted }]}>Accuracy:</Text>
                      <Text style={[styles.transcriptionMetaValue, { color: text }]}>
                        {Math.round(selectedTranscription.avg_confidence * 100)}%
                      </Text>
                    </View>
                  )}
                  <View style={styles.transcriptionMetaRow}>
                    <IconSymbol name="calendar" size={18} color={tint} />
                    <Text style={[styles.transcriptionMetaLabel, { color: muted }]}>Extracted:</Text>
                    <Text style={[styles.transcriptionMetaValue, { color: text }]}>
                      {selectedTranscription.created_at && !isNaN(new Date(selectedTranscription.created_at).getTime())
                        ? new Date(selectedTranscription.created_at).toLocaleDateString()
                        : 'N/A'}
                    </Text>
                  </View>
                </View>

                {/* Transcription Text */}
                <View style={styles.transcriptionTextContainer}>
                  <Text style={[styles.transcriptionFullText, { color: text }]}>
                    {String(selectedTranscription.text)}
                  </Text>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

export default function PlaceDetailsScreen() {
  return (
    <PlaceErrorBoundary>
      <PlaceDetailsScreenInner />
    </PlaceErrorBoundary>
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
    backgroundColor: 'transparent',
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
    marginBottom: 8,
  },
  favoriteButtonInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  favoriteText: {
    fontSize: 14,
    fontWeight: '600',
  },
  ratingContainerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff7ed',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  manuscriptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    gap: 12,
  },
  manuscriptNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manuscriptNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  manuscriptContent: {
    flex: 1,
  },
  manuscriptTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  manuscriptPreview: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  manuscriptConfidence: {
    fontSize: 11,
    fontWeight: '500',
  },
  transcriptionModal: {
    flex: 1,
  },
  transcriptionModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transcriptionModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  transcriptionModalContent: {
    flex: 1,
    padding: 20,
  },
  transcriptionMetaCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  transcriptionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transcriptionMetaLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  transcriptionMetaValue: {
    fontSize: 14,
    flex: 1,
  },
  transcriptionTextContainer: {
    marginBottom: 20,
  },
  transcriptionFullText: {
    fontSize: 16,
    lineHeight: 26,
  },
});
