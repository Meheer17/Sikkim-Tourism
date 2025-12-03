import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import PanoramaViewer from '@/components/immersive/PanoramaViewer';
import NavigationHotspot, {
    NavigationHotspot as HotspotType,
} from '@/components/immersive/NavigationHotspot';
import AudioNarration from '@/components/immersive/AudioNarration';

interface Viewpoint {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    audioUrl?: string;
    narrationText: string;
    hotspots: HotspotType[];
}

// Mock data for monastery viewpoints
const MOCK_MONASTERY_VIEWPOINTS: Record<string, Viewpoint[]> = {
    'rumtek-monastery': [
        {
            id: 'entrance',
            name: 'Main Entrance',
            description: 'The grand entrance to Rumtek Monastery',
            imageUrl: 'https://example.com/rumtek-entrance-360.jpg',
            narrationText:
                'Welcome to Rumtek Monastery, one of the most significant monasteries in Sikkim. Built in the 1960s, it serves as the seat of the Karmapa and is a major center of the Kagyu lineage of Tibetan Buddhism.',
            hotspots: [
                {
                    id: 'h1',
                    position: { x: 50, y: 45 },
                    direction: 'forward',
                    label: 'Main Hall',
                    targetViewpointId: 'main-hall',
                },
                {
                    id: 'h2',
                    position: { x: 75, y: 50 },
                    direction: 'right',
                    label: 'Prayer Wheels',
                    targetViewpointId: 'prayer-wheels',
                },
            ],
        },
        {
            id: 'main-hall',
            name: 'Main Prayer Hall',
            description: 'The central prayer hall with intricate murals',
            imageUrl: 'https://example.com/rumtek-hall-360.jpg',
            narrationText:
                'You are now in the main prayer hall. Notice the beautiful murals depicting the life of Buddha and the elaborate decorations. The hall can accommodate hundreds of monks during prayer ceremonies.',
            hotspots: [
                {
                    id: 'h3',
                    position: { x: 30, y: 55 },
                    direction: 'backward',
                    label: 'Back to Entrance',
                    targetViewpointId: 'entrance',
                },
                {
                    id: 'h4',
                    position: { x: 60, y: 40 },
                    direction: 'forward',
                    label: 'Golden Stupa',
                    targetViewpointId: 'golden-stupa',
                },
            ],
        },
        {
            id: 'prayer-wheels',
            name: 'Prayer Wheel Corridor',
            description: 'Sacred prayer wheels line this corridor',
            imageUrl: 'https://example.com/rumtek-wheels-360.jpg',
            narrationText:
                'These prayer wheels contain thousands of mantras. Buddhist devotees spin them clockwise to send prayers and good wishes into the universe. Each rotation is equivalent to reciting all the mantras inside.',
            hotspots: [
                {
                    id: 'h5',
                    position: { x: 25, y: 50 },
                    direction: 'left',
                    label: 'Back to Entrance',
                    targetViewpointId: 'entrance',
                },
            ],
        },
        {
            id: 'golden-stupa',
            name: 'Golden Stupa',
            description: 'The magnificent golden stupa',
            imageUrl: 'https://example.com/rumtek-stupa-360.jpg',
            narrationText:
                'This golden stupa is a reliquary monument containing sacred relics. Its architecture represents the path to enlightenment, with each level symbolizing different stages of spiritual development.',
            hotspots: [
                {
                    id: 'h6',
                    position: { x: 50, y: 55 },
                    direction: 'backward',
                    label: 'Back to Main Hall',
                    targetViewpointId: 'main-hall',
                },
            ],
        },
    ],
};

export default function ImmersiveExperienceScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const placeId = params.placeId as string;
    const panorama360Url = params.panorama360Url as string;
    const placeName = params.placeName as string;

    const [currentViewpointIndex, setCurrentViewpointIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showInfo, setShowInfo] = useState(true);
    const [showHelpText, setShowHelpText] = useState(true);

    // Get viewpoints for this place
    const viewpoints = MOCK_MONASTERY_VIEWPOINTS[placeId] || MOCK_MONASTERY_VIEWPOINTS['rumtek-monastery'];
    const currentViewpoint = viewpoints[currentViewpointIndex];

    useEffect(() => {
        // Simulate loading
        const timer = setTimeout(() => setLoading(false), 1500);
        return () => clearTimeout(timer);
    }, [currentViewpointIndex]);

    useEffect(() => {
        // Auto-hide info after 5 seconds
        const infoTimer = setTimeout(() => setShowInfo(false), 5000);
        // Auto-hide help text after 5 seconds
        setShowHelpText(true);
        const helpTimer = setTimeout(() => setShowHelpText(false), 5000);
        return () => {
            clearTimeout(infoTimer);
            clearTimeout(helpTimer);
        };
    }, [currentViewpointIndex]);

    const handleNavigateToViewpoint = (targetViewpointId: string) => {
        const targetIndex = viewpoints.findIndex((v) => v.id === targetViewpointId);
        if (targetIndex !== -1) {
            setLoading(true);
            setShowInfo(true);
            setCurrentViewpointIndex(targetIndex);
        }
    };

    const handleBack = () => {
        router.back();
    };

    const toggleInfo = () => {
        setShowInfo(!showInfo);
    };

    if (!currentViewpoint) {
        return (
            <View style={styles.errorContainer}>
                <IconSymbol name="exclamationmark.triangle.fill" size={48} color="#ef4444" />
                <Text style={styles.errorText}>No immersive experience available</Text>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* <StatusBar barStyle="light-content" /> */}

            {/* Panorama Viewer - 360 Image */}
            <PanoramaViewer 
                imageSource={panorama360Url ? { uri: panorama360Url } : require('@/assets/360images/car.jpg')}
            >
                {/* Navigation Hotspots */}
                {!loading &&
                    currentViewpoint.hotspots.map((hotspot) => (
                        <NavigationHotspot
                            key={hotspot.id}
                            hotspot={hotspot}
                            onPress={handleNavigateToViewpoint}
                            // pointerEvents="box-none"
                        />
                    ))}
            </PanoramaViewer>

            {loading && (
                <View style={styles.loadingOverlay} pointerEvents="box-none">
                    <ActivityIndicator size="large" color="#0a7ea4" />
                    <Text style={styles.loadingText}>Loading viewpoint...</Text>
                </View>
            )}

            <View style={styles.topControls} pointerEvents="box-none">
                <TouchableOpacity style={styles.controlButton} onPress={handleBack}>
                    <IconSymbol name="xmark" size={24} color="#fff" />
                </TouchableOpacity>

                <View style={styles.viewpointIndicator}>
                    <Text style={styles.viewpointText}>
                        {currentViewpointIndex + 1} / {viewpoints.length}
                    </Text>
                </View>

                <TouchableOpacity style={styles.controlButton} onPress={toggleInfo}>
                    <IconSymbol name="info.circle.fill" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {showInfo && (
                <View style={styles.infoPanel} pointerEvents="box-none">
                    <Text style={styles.infoTitle}>{currentViewpoint.name}</Text>
                    <Text style={styles.infoDescription}>{currentViewpoint.description}</Text>
                </View>
            )}

            {currentViewpoint.narrationText && !loading && (
                <AudioNarration
                    // audioSource={currentViewpoint.audioUrl ? { uri: currentViewpoint.audioUrl } : undefined}
                    narrationText={currentViewpoint.narrationText}
                    autoPlay={false}
                />
            )}

            {showHelpText && (
                <View style={styles.helpText} pointerEvents="box-none">
                    <IconSymbol name="hand.draw.fill" size={16} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.helpTextContent}>
                        Drag to look around • Tap arrows to move
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#687076',
        marginTop: 16,
        marginBottom: 24,
    },
    backButton: {
        backgroundColor: '#0a7ea4',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingOverlay: {
        // ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.0)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 900,
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 12,
        fontWeight: '500',
    },
    topControls: {
        position: 'absolute',
        top: 50,
        left: 16,
        right: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
    },
    controlButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewpointIndicator: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    viewpointText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    infoPanel: {
        position: 'absolute',
        top: 110,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 16,
        borderRadius: 12,
        zIndex: 10,
    },
    infoTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 6,
    },
    infoDescription: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 20,
    },
    helpText: {
        position: 'absolute',
        top: 200,
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        zIndex: 5,
    },
    helpTextContent: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 13,
        fontWeight: '500',
        marginLeft: 8,
    },
});
