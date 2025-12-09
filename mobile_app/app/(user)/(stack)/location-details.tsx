import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { locationService } from '@/services/location.service';
import { fileService } from '@/services';
import { useAuth } from '@/hooks/useAuth';
import AudioNarration from '@/components/immersive/AudioNarration';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageTranslations } from '@/constants/translations';
import { buildImageUrl } from '@/utils/image-url';
import { PageTurnPdfViewer } from '@/components/common/PageTurnPdfViewer';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface TranscriptionSummary {
    id: string;
    text: string;
    avg_confidence?: number;
    file_name?: string;
    created_at: string;
}

interface LocationDetails {
    id: string;
    name: string;
    description: string;
    short_description: string;
    position: { x: number; y: number };
    metadata?: any;
    type: string;
    created_at?: string;
    updated_at?: string;
    transcriptions?: TranscriptionSummary[];
}

interface HeritageDocument {
    _id: string;
    file_name: string;
    file_path: string;
    category: string;
    mime_type?: string;
    created_at: string;
}

export default function LocationDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const [location, setLocation] = useState<LocationDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [heritageDocuments, setHeritageDocuments] = useState<HeritageDocument[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [viewingPdf, setViewingPdf] = useState<{ url: string; name: string } | null>(null);
    const { user } = useAuth();

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');
    const border = useThemeColor('border');

    const canEdit = user && (user.role === 'government' || user.role === 'business');

    useEffect(() => {
        loadLocationDetails();
        loadHeritageDocuments();
    }, [id]);

    const loadHeritageDocuments = async () => {
        if (!id) return;
        setLoadingDocs(true);
        try {
            const resp = await fileService.getHeritageDocuments({ locationId: id });
            if (resp.success && resp.data) {
                setHeritageDocuments(resp.data.documents || []);
            }
        } catch (error) {
            console.error('Failed to load heritage documents:', error);
        } finally {
            setLoadingDocs(false);
        }
    };

    const loadLocationDetails = async () => {
        if (!id) return;
        console.log(`[LocationDetails] Loading location details for id: ${id}`);
        setLoading(true);
        try {
            const resp = await locationService.get(id);
            console.log(`[LocationDetails] API Response:`, resp);
            if (resp.success && resp.data) {
                console.log(`[LocationDetails] Location data:`, resp.data);
                console.log(`[LocationDetails] Transcriptions:`, resp.data.transcriptions);
                console.log(`[LocationDetails] Transcriptions count:`, resp.data.transcriptions?.length || 0);
                setLocation(resp.data);
            } else {
                console.warn(`[LocationDetails] API call failed or no data:`, resp);
            }
        } catch (error) {
            console.error('[LocationDetails] Failed to load location:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpen360View = () => {
        if (!location?.metadata?.panorama_360) return;

        const panoUrl = buildImageUrl(location.metadata.panorama_360);

        router.push({
            pathname: '/(user)/(stack)/immersive-experience',
            params: {
                placeId: location.id,
                panorama360Url: panoUrl,
                placeName: location.name,
                placeDescription: location.description,
                shortDescription: location.short_description,
                latitude: location.position.y.toString(), // y is latitude
                longitude: location.position.x.toString(), // x is longitude
            },
        } as any);
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
                <Text style={[styles.errorText, { color: text }]}>{t.locationNotFound || 'Location not found'}</Text>
                <TouchableOpacity style={[styles.button, { backgroundColor: tint }]} onPress={() => router.back()}>
                    <Text style={styles.buttonText}>{t.goBack || 'Go Back'}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: card }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={24} color={text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: text }]} numberOfLines={1}>
                    {location.name}
                </Text>
                {canEdit ? (
                    <TouchableOpacity
                        onPress={() => router.push({
                            pathname: '/edit-location' as any,
                            params: { id }
                        })}
                        style={styles.placeholder}
                    >
                        <IconSymbol name="pencil" size={20} color={tint} />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.placeholder} />
                )}
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Image Gallery */}
                {location.metadata?.images && location.metadata.images.length > 0 ? (
                    <View>
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            style={styles.imageGallery}
                            onScroll={(event) => {
                                const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                                setCurrentImageIndex(slideIndex);
                            }}
                            scrollEventThrottle={16}
                        >
                            {location.metadata.images.map((raw: string, index: number) => {
                                const imageUrl = buildImageUrl(raw);
                                return (
                                    <Image
                                        key={index}
                                        source={{ uri: imageUrl }}
                                        style={styles.heroImage}
                                        resizeMode="cover"
                                    />
                                );
                            })}
                        </ScrollView>
                        {/* Image Indicators */}
                        {location.metadata.images.length > 1 && (
                            <View style={styles.imageIndicators}>
                                {location.metadata.images.map((_: string, index: number) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.indicator,
                                            {
                                                backgroundColor: index === currentImageIndex ? tint : muted + '40',
                                                width: index === currentImageIndex ? 24 : 8,
                                            }
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
                    <View style={styles.typeBadge}>
                        <Text style={[styles.typeBadgeText, { color: tint }]}>{location.type}</Text>
                    </View>

                    <Text style={[styles.title, { color: text }]}>{location.name}</Text>
                    <Text style={[styles.shortDesc, { color: muted }]}>{location.short_description}</Text>

                    {/* Location Info */}
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <IconSymbol name="location.fill" size={16} color={tint} />
                            <Text style={[styles.metaText, { color: muted }]}>
                                Lat: {location.position.x.toFixed(4)}, Lng: {location.position.y.toFixed(4)}
                            </Text>
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: text }]}>About</Text>
                        <Text style={[styles.description, { color: muted }]}>{location.description}</Text>
                    </View>

                    {/* Metadata */}
                    {location.metadata && Object.keys(location.metadata).filter(k => k !== 'images').length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: text }]}>Additional Info</Text>
                            {Object.entries(location.metadata)
                                .filter(([key]) => key !== 'images')
                                .map(([key, value]) => (
                                    <View key={key} style={styles.metadataRow}>
                                        <Text style={[styles.metadataKey, { color: text }]}>
                                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                                        </Text>
                                        <Text style={[styles.metadataValue, { color: muted }]}>
                                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                        </Text>
                                    </View>
                                ))}
                        </View>
                    )}

                    {/* Manuscript Transcriptions */}
                    {location.transcriptions && location.transcriptions.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: text }]}>Manuscript Transcriptions</Text>
                            <Text style={[styles.sectionSubtitle, { color: muted }]}>
                                Ancient texts digitized from historical manuscripts
                            </Text>
                            {location.transcriptions.map((transcription, index) => (
                                <View key={transcription.id} style={[styles.transcriptionCard, { backgroundColor: card, borderColor: border }]}>
                                    <View style={styles.transcriptionHeader}>
                                        <Text style={[styles.transcriptionFileName, { color: text }]}>
                                            {transcription.file_name || `Manuscript ${index + 1}`}
                                        </Text>
                                        {transcription.avg_confidence && (
                                            <Text style={[styles.confidenceText, { color: muted }]}>
                                                {Math.round(transcription.avg_confidence * 100)}% accuracy
                                            </Text>
                                        )}
                                    </View>
                                    <Text style={[styles.transcriptionText, { color: text }]}>
                                        {transcription.text}
                                    </Text>
                                    <Text style={[styles.transcriptionDate, { color: muted }]}>
                                        Transcribed: {new Date(transcription.created_at).toLocaleDateString()}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                    {location.metadata?.panorama_360 && (
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#10b981' }]}
                            onPress={handleOpen360View}
                        >
                            <IconSymbol name="view.3d" size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>360° View</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: tint }]}>
                        <IconSymbol name="map.fill" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Get Directions</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: card, borderWidth: 1, borderColor: tint }]}>
                        <IconSymbol name="heart" size={20} color={tint} />
                        <Text style={[styles.actionButtonText, { color: tint }]}>Save</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <PageTurnPdfViewer
                visible={!!viewingPdf}
                pdfUrl={viewingPdf?.url || ''}
                fileName={viewingPdf?.name}
                onClose={() => setViewingPdf(null)}
            />

            {/* Audio Narration with Proximity Detection */}
            {location.description && (
                <AudioNarration
                    narrationText={location.description}
                    locationId={location.id}
                    locationLatitude={location.position.y} // position.y is latitude
                    locationLongitude={location.position.x} // position.x is longitude
                    autoPlayOnProximity={true}
                    proximityRadius={100} // 100 meters
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        paddingTop: 60,
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
    placeholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    heroContainer: {
        height: 250,
    },
    heroPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageGallery: {
        height: 250,
    },
    heroImage: {
        width: SCREEN_WIDTH,
        height: 250,
    },
    imageIndicators: {
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    indicator: {
        height: 8,
        borderRadius: 4,
    },
    infoCard: {
        margin: 16,
        borderRadius: 16,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    typeBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: '#e8f4f8',
        marginBottom: 12,
    },
    typeBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
    },
    shortDesc: {
        fontSize: 16,
        marginBottom: 16,
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 20,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 14,
    },
    section: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 14,
        marginBottom: 16,
        fontStyle: 'italic',
    },
    description: {
        fontSize: 15,
        lineHeight: 24,
    },
    metadataRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    metadataKey: {
        fontSize: 14,
        fontWeight: '600',
        marginRight: 8,
        textTransform: 'capitalize',
    },
    metadataValue: {
        fontSize: 14,
        flex: 1,
    },
    transcriptionCard: {
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    transcriptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        flexWrap: 'wrap',
    },
    transcriptionFileName: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
        flex: 1,
    },
    confidenceText: {
        fontSize: 12,
        fontStyle: 'italic',
        marginLeft: 8,
    },
    transcriptionText: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    transcriptionDate: {
        fontSize: 12,
        fontStyle: 'italic',
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
        paddingBottom: 32,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 24,
    },
    button: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    heritageSection: {
        margin: 16,
        marginTop: 0,
        borderRadius: 16,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    heritageSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    heritageSectionDesc: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    heritageScroll: {
        marginHorizontal: -8,
    },
    heritageCard: {
        width: 160,
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
        marginHorizontal: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    heritageThumb: {
        width: '100%',
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heritageImage: {
        width: '100%',
        height: '100%',
    },
    heritageCardContent: {
        padding: 12,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 8,
    },
    categoryBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    heritageFileName: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        lineHeight: 18,
    },
    pdfIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    pdfIndicatorText: {
        fontSize: 11,
        fontWeight: '500',
    },
});
