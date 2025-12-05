import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Dimensions,
    Alert,
    Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { locationService } from '@/services/location.service';
import { ttsService } from '@/services/tts.service';
import LanguageSelector from '@/components/immersive/LanguageSelector';
import { buildImageUrl } from '@/utils/image-url';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface LocationDetails {
    _id: string;
    id: string;
    name: string;
    description: string;
    short_description: string;
    position: { x: number; y: number };
    metadata?: any;
    type: string;
    created_at?: string;
    updated_at?: string;
}

export default function AdminPlaceDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [location, setLocation] = useState<LocationDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isPlayingTTS, setIsPlayingTTS] = useState(false);

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    useEffect(() => {
        loadLocationDetails();
        return () => {
            // Clean up TTS on unmount
            ttsService.stop();
        };
    }, [id]);

    const loadLocationDetails = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const resp = await locationService.get(id);
            if (resp.success && resp.data) {
                // Map the response to include _id
                const locationData = {
                    ...resp.data,
                    _id: resp.data.id,
                } as LocationDetails;
                setLocation(locationData);
            }
        } catch (error) {
            console.error('Failed to load location:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePreviewTTS = async () => {
        if (!location) return;

        if (isPlayingTTS) {
            // Stop TTS
            await ttsService.stop();
            setIsPlayingTTS(false);
        } else {
            // Play TTS with auto-optimized language settings
            try {
                setIsPlayingTTS(true);
                await ttsService.speak(location.description);
                setIsPlayingTTS(false);
            } catch (error) {
                console.error('TTS error:', error);
                setIsPlayingTTS(false);
                Alert.alert('Error', 'Failed to play audio narration');
            }
        }
    };

    const handleEditPlace = () => {
        router.push({
            pathname: '/(admin)/(stack)/edit-place' as any,
            params: { id },
        });
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: background }]}>
                <ActivityIndicator size="large" color={tint} />
            </View>
        );
    }

    if (!location) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: background }]}>
                <IconSymbol name="exclamationmark.triangle" size={48} color={muted} />
                <Text style={[styles.errorText, { color: text }]}>Location not found</Text>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: tint }]}
                    onPress={() => router.back()}
                >
                    <Text style={styles.buttonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const images = (location.metadata?.images || []).map((f: string) => buildImageUrl(f)).filter(Boolean) as string[];

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: card }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={24} color={text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: text }]} numberOfLines={1}>
                    Place Details
                </Text>
                <TouchableOpacity onPress={handleEditPlace} style={styles.editHeaderButton}>
                    <IconSymbol name="pencil" size={20} color={tint} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Image Gallery */}
                {images.length > 0 ? (
                    <View>
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            style={styles.imageGallery}
                            onScroll={(event) => {
                                const slideIndex = Math.round(
                                    event.nativeEvent.contentOffset.x / SCREEN_WIDTH
                                );
                                setCurrentImageIndex(slideIndex);
                            }}
                            scrollEventThrottle={16}
                        >
                            {images.map((imageUrl: string, index: number) => (
                                <Image
                                    key={index}
                                    source={{ uri: imageUrl }}
                                    style={styles.heroImage}
                                    resizeMode="cover"
                                />
                            ))}
                        </ScrollView>
                        {/* Image Indicators */}
                        {images.length > 1 && (
                            <View style={styles.imageIndicators}>
                                {images.map((_: string, index: number) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.indicator,
                                            {
                                                backgroundColor:
                                                    index === currentImageIndex ? tint : muted + '40',
                                                width: index === currentImageIndex ? 24 : 8,
                                            },
                                        ]}
                                    />
                                ))}
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={styles.heroContainer}>
                        <View style={[styles.heroPlaceholder, { backgroundColor: card }]}>
                            <IconSymbol name="photo" size={64} color={muted} />
                        </View>
                    </View>
                )}

                {/* Info Section */}
                <View style={[styles.infoCard, { backgroundColor: card }]}>
                    <View style={[styles.typeBadge, { backgroundColor: tint + '15' }]}>
                        <IconSymbol name="mappin.circle.fill" size={16} color={tint} />
                        <Text style={[styles.typeBadgeText, { color: tint }]}>{location.type}</Text>
                    </View>

                    <Text style={[styles.title, { color: text }]}>{location.name}</Text>
                    <Text style={[styles.shortDesc, { color: muted }]}>
                        {location.short_description}
                    </Text>

                    {/* Location Coordinates */}
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <IconSymbol name="location.fill" size={16} color={tint} />
                            <Text style={[styles.metaText, { color: muted }]}>
                                Lat: {location.position.y.toFixed(6)}, Lon: {location.position.x.toFixed(6)}
                            </Text>
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: text }]}>Description</Text>
                        <Text style={[styles.description, { color: muted }]}>
                            {location.description}
                        </Text>
                    </View>

                    {/* 360 Panorama Info */}
                    {location.metadata?.panorama_360 && (
                        <View style={styles.section}>
                            <View style={styles.featureRow}>
                                <IconSymbol name="view.3d" size={20} color="#10b981" />
                                <Text style={[styles.featureText, { color: text }]}>
                                    360° Panorama Available
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Image Count */}
                    {images.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.featureRow}>
                                <IconSymbol name="photo.stack" size={20} color="#3b82f6" />
                                <Text style={[styles.featureText, { color: text }]}>
                                    {images.length} {images.length === 1 ? 'Image' : 'Images'}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Metadata */}
                    {location.metadata &&
                        Object.keys(location.metadata).filter(
                            (k) => k !== 'images' && k !== 'panorama_360'
                        ).length > 0 && (
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: text }]}>
                                    Additional Information
                                </Text>
                                {Object.entries(location.metadata)
                                    .filter(([key]) => key !== 'images' && key !== 'panorama_360')
                                    .map(([key, value]) => (
                                        <View key={key} style={styles.metadataRow}>
                                            <Text style={[styles.metadataKey, { color: text }]}>
                                                {key
                                                    .replace(/_/g, ' ')
                                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                                :
                                            </Text>
                                            <Text style={[styles.metadataValue, { color: muted }]}>
                                                {typeof value === 'object'
                                                    ? JSON.stringify(value)
                                                    : String(value)}
                                            </Text>
                                        </View>
                                    ))}
                            </View>
                        )}

                    {/* Timestamps */}
                    {location.created_at && (
                        <View style={styles.timestampsSection}>
                            <Text style={[styles.timestampText, { color: muted }]}>
                                Created: {new Date(location.created_at).toLocaleDateString()}
                            </Text>
                            {location.updated_at && (
                                <Text style={[styles.timestampText, { color: muted }]}>
                                    Updated: {new Date(location.updated_at).toLocaleDateString()}
                                </Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                    {/* Language Selector */}
                    <View style={styles.languageSelectorWrapper}>
                        <Text style={[styles.languageSelectorLabel, { color: text }]}>
                            TTS Language:
                        </Text>
                        <LanguageSelector />
                    </View>

                    {/* TTS Preview Button */}
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            styles.ttsButton,
                            { backgroundColor: isPlayingTTS ? '#ef4444' : '#10b981' },
                        ]}
                        onPress={handlePreviewTTS}
                    >
                        <IconSymbol
                            name={isPlayingTTS ? 'stop.fill' : 'speaker.wave.2.fill'}
                            size={20}
                            color="#fff"
                        />
                        <Text style={styles.actionButtonText}>
                            {isPlayingTTS ? 'Stop TTS Preview' : 'Preview TTS Audio'}
                        </Text>
                    </TouchableOpacity>

                    {/* Edit Button */}
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: tint }]}
                        onPress={handleEditPlace}
                    >
                        <IconSymbol name="pencil" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Edit Place</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: Platform.OS === 'android' ? 50 : 0,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? 50 : 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 8,
    },
    editHeaderButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    imageGallery: {
        height: 300,
    },
    heroImage: {
        width: SCREEN_WIDTH,
        height: 300,
    },
    imageIndicators: {
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    indicator: {
        height: 8,
        borderRadius: 4,
    },
    heroContainer: {
        height: 250,
    },
    heroPlaceholder: {
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoCard: {
        margin: 16,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 12,
        gap: 4,
    },
    typeBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 8,
    },
    shortDesc: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 16,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        flexWrap: 'wrap',
        gap: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 13,
    },
    section: {
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    description: {
        fontSize: 15,
        lineHeight: 24,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 8,
    },
    featureText: {
        fontSize: 15,
        fontWeight: '600',
    },
    metadataRow: {
        flexDirection: 'row',
        marginBottom: 8,
        gap: 8,
    },
    metadataKey: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    metadataValue: {
        fontSize: 14,
        flex: 2,
    },
    timestampsSection: {
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        gap: 4,
    },
    timestampText: {
        fontSize: 12,
    },
    actionsContainer: {
        paddingHorizontal: 16,
        gap: 12,
    },
    languageSelectorWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
    },
    languageSelectorLabel: {
        fontSize: 15,
        fontWeight: '600',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    ttsButton: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        fontSize: 16,
        marginTop: 16,
        marginBottom: 24,
    },
    button: {
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
