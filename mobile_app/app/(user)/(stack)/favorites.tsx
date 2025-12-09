import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import PlaceCard, { Place } from '@/components/explore/PlaceCard';
import { useThemeColor } from '@/hooks/use-theme-color';
import { locationService } from '@/services/location.service';
import { buildImageUrl } from '@/utils/image-url';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageTranslations } from '@/constants/translations';

export default function FavoritesScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
    const [places, setPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(false);
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    // Reload favorites whenever screen is focused
    useFocusEffect(
        React.useCallback(() => {
            loadFavorites();
        }, [])
    );

    const loadFavorites = async () => {
        try {
            setLoading(true);
            const favoritesData = await AsyncStorage.getItem('favorites');
            const ids = favoritesData ? JSON.parse(favoritesData) : [];
            setFavoriteIds(ids);

            if (ids.length === 0) {
                setPlaces([]);
                setLoading(false);
                return;
            }

            // Fetch all locations
            const response = await locationService.list({ skip: 0, limit: 100 });
            const locations = response.data || [];

            // Filter locations that are in favorites
            const favoriteLocations = locations.filter((loc: any) => ids.includes(loc.id));

            // Map to Place format
            const mappedPlaces: Place[] = favoriteLocations.map((loc: any) => {
                const rawImages: string[] = loc.metadata?.images || [];
                const images = rawImages.map((f: string) => buildImageUrl(f)).filter(Boolean) as string[];
                const imageUrl = images[0] || '';

                return {
                    id: loc.id,
                    name: loc.name || 'Unknown',
                    description: loc.short_description || loc.description || 'No description',
                    distance: '0 km',
                    rating: loc.rating,
                    imageUrl: imageUrl,
                    images: images,
                    category: loc.type || 'Place',
                    modelPath: loc.metadata?.model_url || '',
                    has360Images: !!loc.metadata?.panorama_360,
                    panorama360Url: buildImageUrl(loc.metadata?.panorama_360) || '',
                    latitude: loc.position?.y,
                    longitude: loc.position?.x,
                    transcriptions: loc.transcriptions || [],
                };
            });

            setPlaces(mappedPlaces);
        } catch (error) {
            console.error('Error loading favorites:', error);
            setPlaces([]);
        } finally {
            setLoading(false);
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
                images: JSON.stringify(place.images || []),
                modelPath: place.modelPath || '',
                has360Images: (place.has360Images || false).toString(),
                panorama360Url: place.panorama360Url || '',
                latitude: place.latitude?.toString() || '',
                longitude: place.longitude?.toString() || '',
                transcriptions: JSON.stringify(place.transcriptions || []),
            },
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <IconSymbol name="chevron.left" size={24} color={tint} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: text }]}>{t.myFavorites || 'My Favorites'}</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={tint} />
                </View>
            ) : places.length === 0 ? (
                <View style={styles.centerContainer}>
                    <IconSymbol name="heart" size={48} color={muted} />
                    <Text style={[styles.emptyText, { color: text }]}>No Favorites Yet</Text>
                    <Text style={[styles.emptySubtext, { color: muted }]}>
                        Add places to your favorites to see them here
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={places}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <PlaceCard
                            place={item}
                            onPress={handlePlacePress}
                        />
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        paddingBottom: 20,
    },
});
