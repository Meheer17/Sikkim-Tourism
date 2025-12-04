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
import AudioNarration from '@/components/immersive/AudioNarration';
import { ttsService } from '@/services/tts.service';

export default function ImmersiveExperienceScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const placeId = params.placeId as string;
    const panorama360Url = params.panorama360Url as string;
    const placeName = params.placeName as string;
    const placeDescription = params.placeDescription as string;
    const shortDescription = params.shortDescription as string;
    const latitude = params.latitude ? parseFloat(params.latitude as string) : undefined;
    const longitude = params.longitude ? parseFloat(params.longitude as string) : undefined;

    const [loading, setLoading] = useState(true);
    const [showInfo, setShowInfo] = useState(true);
    const [showHelpText, setShowHelpText] = useState(true);

    useEffect(() => {
        // Simulate loading
        const timer = setTimeout(() => setLoading(false), 1500);
        return () => {
            clearTimeout(timer);
        };
    }, []);

    useEffect(() => {
        // Cleanup TTS when component unmounts (user exits the view)
        return () => {
            ttsService.stop();
            console.log('🔊 Stopped TTS - exited immersive view');
        };
    }, []);

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
    }, []);

    const handleBack = async () => {
        // Stop TTS before navigating back
        await ttsService.stop();
        router.back();
    };

    const toggleInfo = () => {
        setShowInfo(!showInfo);
    };

    if (!panorama360Url && !placeId) {
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
            </PanoramaViewer>

            {loading && (
                <View style={styles.loadingOverlay} pointerEvents="box-none">
                    <ActivityIndicator size="large" color="#0a7ea4" />
                    <Text style={styles.loadingText}>Loading panorama...</Text>
                </View>
            )}

            <View style={styles.topControls} pointerEvents="box-none">
                <TouchableOpacity style={styles.controlButton} onPress={handleBack}>
                    <IconSymbol name="xmark" size={24} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlButton} onPress={toggleInfo}>
                    <IconSymbol name="info.circle.fill" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {showInfo && (
                <View style={styles.infoPanel} pointerEvents="box-none">
                    <Text style={styles.infoTitle}>{placeName}</Text>
                    <Text style={styles.infoDescription}>
                        {shortDescription}
                    </Text>
                </View>
            )}

            {!loading && placeDescription && (
                <AudioNarration
                    narrationText={placeDescription}
                    locationId={placeId}
                    locationLatitude={latitude}
                    locationLongitude={longitude}
                    autoPlayOnProximity={false}
                />
            )}

            {showHelpText && (
                <View style={styles.helpText} pointerEvents="box-none">
                    <IconSymbol name="hand.draw.fill" size={16} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.helpTextContent}>
                        Drag to look around
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
