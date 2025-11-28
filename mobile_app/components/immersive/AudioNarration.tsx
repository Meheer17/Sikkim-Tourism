import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useAudioPlayer, AudioSource } from 'expo-audio';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface AudioNarrationProps {
    audioSource?: AudioSource;
    narrationText?: string;
    autoPlay?: boolean;
}

export default function AudioNarration({
    audioSource,
    narrationText,
    autoPlay = true,
}: AudioNarrationProps) {
    const player = useAudioPlayer(audioSource);
    const [duration, setDuration] = useState(0);
    const slideAnim = useRef(new Animated.Value(100)).current;

    useEffect(() => {
        // Slide in animation
        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 8,
        }).start();
    }, [slideAnim]);

    useEffect(() => {
        if (audioSource && autoPlay && player) {
            player.play();
        }
    }, [audioSource, autoPlay, player]);

    useEffect(() => {
        if (player) {
            setDuration(player.duration * 1000); // Convert to milliseconds
        }
    }, [player?.duration]);

    const togglePlayPause = useCallback(() => {
        if (!player) return;

        if (player.playing) {
            player.pause();
        } else {
            player.play();
        }
    }, [player]);

    const formatTime = (millis: number) => {
        const totalSeconds = Math.floor(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const position = player ? player.currentTime * 1000 : 0; // Convert to milliseconds
    const isPlaying = player?.playing || false;
    const isLoading = !player;
    const progress = duration > 0 ? position / duration : 0;

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
                    <Text style={styles.title}>Audio Narration</Text>
                </View>

                {narrationText && (
                    <Text style={styles.narrationText} numberOfLines={2}>
                        {narrationText}
                    </Text>
                )}

                <View style={styles.controls}>
                    <TouchableOpacity
                        style={styles.playButton}
                        onPress={togglePlayPause}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <IconSymbol name="clock" size={24} color="#fff" />
                        ) : (
                            <IconSymbol
                                name={isPlaying ? 'pause.fill' : 'play.fill'}
                                size={24}
                                color="#fff"
                            />
                        )}
                    </TouchableOpacity>

                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View
                                style={[styles.progressFill, { width: `${progress * 100}%` }]}
                            />
                        </View>
                        <View style={styles.timeContainer}>
                            <Text style={styles.timeText}>{formatTime(position)}</Text>
                            <Text style={styles.timeText}>{formatTime(duration)}</Text>
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
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#11181C',
        marginLeft: 8,
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
});
