import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ttsService } from '@/services/tts.service';
import LanguageSelector from './LanguageSelector';
import * as Location from 'expo-location';

interface AudioNarrationProps {
    narrationText: string;
    locationId?: string;
    locationLatitude?: number;
    locationLongitude?: number;
    autoPlayOnProximity?: boolean;
    proximityRadius?: number; // in meters
}

export default function AudioNarration({
    narrationText,
    locationId,
    locationLatitude,
    locationLongitude,
    autoPlayOnProximity = true,
    proximityRadius = 100,
}: AudioNarrationProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [totalTime, setTotalTime] = useState(0);
    const [distance, setDistance] = useState<number | null>(null);
    const [hasAutoPlayed, setHasAutoPlayed] = useState(false);
    const slideAnim = useRef(new Animated.Value(100)).current;
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const proximityCheckRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Slide in animation
        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 8,
        }).start();

        // Estimate duration based on text length (rough estimate: ~150 words per minute)
        const words = narrationText.split(' ').length;
        const estimatedSeconds = (words / 150) * 60;
        setTotalTime(estimatedSeconds);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (proximityCheckRef.current) clearInterval(proximityCheckRef.current);
            ttsService.stop();
        };
    }, [narrationText]);

    const handleStop = useCallback(async () => {
        setIsPlaying(false);
        if (timerRef.current) clearInterval(timerRef.current);
        await ttsService.stop();
        // Don't reset currentTime here - let user see progress
    }, []);

    const handlePlay = useCallback(async () => {
        try {
            setIsPlaying(true);
            setCurrentTime(0); // Reset time only when starting fresh

            // Start timer to simulate progress
            const startTime = Date.now();
            timerRef.current = setInterval(() => {
                const elapsed = (Date.now() - startTime) / 1000;
                setCurrentTime(elapsed);
                if (elapsed >= totalTime) {
                    handleStop();
                }
            }, 100);

            // Use auto-optimized language settings
            await ttsService.speak(narrationText);

            // When TTS completes, reset to allow replay
            setCurrentTime(0);
            setIsPlaying(false);
        } catch (error) {
            console.error('TTS error:', error);
            setIsPlaying(false);
        }
    }, [narrationText, totalTime, handleStop]);

    const togglePlayPause = useCallback(async () => {
        if (isPlaying) {
            // Stop the audio
            await handleStop();
        } else {
            // Always start from beginning (Android limitation)
            await handlePlay();
        }
    }, [isPlaying, handlePlay, handleStop]);

    const checkProximityAndAutoPlay = useCallback(async () => {
        if (!locationId || locationLatitude === undefined || locationLongitude === undefined) {
            return;
        }

        try {
            const { isNear, distance: dist } = await ttsService.isUserNearLocation(
                locationLatitude,
                locationLongitude,
                proximityRadius
            );

            if (dist !== null) {
                setDistance(dist);
            }

            if (isNear && !hasAutoPlayed) {
                console.log('🎯 User entered location area - auto-playing narration');
                setHasAutoPlayed(true);
                await handlePlay();
                
                // Show a subtle notification
                Alert.alert(
                    '🔊 Audio Guide Started',
                    'You\'re at this location! Enjoy the audio narration.',
                    [{ text: 'OK' }],
                    { cancelable: true }
                );
            }
        } catch (error) {
            console.error('Proximity check error:', error);
        }
    }, [locationId, locationLatitude, locationLongitude, proximityRadius, hasAutoPlayed, handlePlay]);

    // Check proximity if enabled
    useEffect(() => {
        if (
            autoPlayOnProximity &&
            !hasAutoPlayed &&
            locationId &&
            locationLatitude !== undefined &&
            locationLongitude !== undefined
        ) {
            checkProximityAndAutoPlay();
            
            // Set up periodic proximity checks
            proximityCheckRef.current = setInterval(() => {
                checkProximityAndAutoPlay();
            }, 10000); // Check every 10 seconds

            return () => {
                if (proximityCheckRef.current) {
                    clearInterval(proximityCheckRef.current);
                }
            };
        }
    }, [autoPlayOnProximity, hasAutoPlayed, locationId, locationLatitude, locationLongitude, checkProximityAndAutoPlay]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = totalTime > 0 ? Math.min(currentTime / totalTime, 1) : 0;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            <View style={styles.content}>
                <View style={styles.header}>
                    <IconSymbol name="speaker.wave.2.fill" size={20} color="#0a7ea4" />
                    <Text style={styles.title}>Audio Guide</Text>
                    {distance !== null && (
                        <Text style={styles.distanceText}>
                            {distance < 1000
                                ? `${Math.round(distance)}m away`
                                : `${(distance / 1000).toFixed(1)}km away`}
                        </Text>
                    )}
                </View>

                <View style={styles.languageSelectorContainer}>
                    <LanguageSelector />
                </View>

                <Text style={styles.narrationText} numberOfLines={2}>
                    {narrationText.substring(0, 100)}...
                </Text>

                <View style={styles.controls}>
                    <TouchableOpacity
                        style={styles.playButton}
                        onPress={togglePlayPause}
                    >
                        <IconSymbol
                            name={isPlaying ? 'stop.fill' : 'play.fill'}
                            size={24}
                            color="#fff"
                        />
                    </TouchableOpacity>

                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View
                                style={[styles.progressFill, { width: `${progress * 100}%` }]}
                            />
                        </View>
                        <View style={styles.timeContainer}>
                            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                            <Text style={styles.timeText}>{formatTime(totalTime)}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
        zIndex: 10,
        backgroundColor: 'transparent',
    },
    content: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#11181C',
        flex: 1,
    },
    distanceText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0a7ea4',
    },
    languageSelectorContainer: {
        marginBottom: 12,
    },
    narrationText: {
        fontSize: 13,
        color: '#687076',
        marginBottom: 12,
        lineHeight: 18,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    playButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#0a7ea4',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    progressContainer: {
        flex: 1,
    },
    progressBar: {
        height: 4,
        backgroundColor: '#e5e7eb',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#0a7ea4',
    },
    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    timeText: {
        fontSize: 11,
        color: '#687076',
        fontWeight: '500',
    },
    stopButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
});
