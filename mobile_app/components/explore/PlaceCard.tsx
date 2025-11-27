import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

export interface Place {
    id: string;
    name: string;
    description: string;
    distance: string;
    rating?: number;
    imageUrl?: string;
    category: string;
    modelPath?: string;
    latitude?: number;
    longitude?: number;
}

interface PlaceCardProps {
    place: Place;
    onPress?: (place: Place) => void;
}

export default function PlaceCard({ place, onPress }: PlaceCardProps) {
    const handleDirections = (e: any) => {
        // Stop propagation to prevent card press
        e.stopPropagation();
        
        if (!place.latitude || !place.longitude) {
            Alert.alert('Error', 'Location coordinates not available for this place');
            return;
        }

        const scheme = Platform.select({
            ios: 'maps:',
            android: 'geo:',
        });
        const latLng = `${place.latitude},${place.longitude}`;
        const label = encodeURIComponent(place.name);
        
        const url = Platform.select({
            ios: `${scheme}?q=${label}&ll=${latLng}`,
            android: `${scheme}${latLng}?q=${label}`,
        });

        if (url) {
            Linking.canOpenURL(url).then((supported) => {
                if (supported) {
                    Linking.openURL(url);
                } else {
                    // Fallback to Google Maps web
                    const webUrl = `https://www.google.com/maps/search/?api=1&query=${latLng}`;
                    Linking.openURL(webUrl);
                }
            });
        }
    };

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onPress?.(place)}
            activeOpacity={0.7}
        >
            <View style={styles.imageContainer}>
                {place.imageUrl ? (
                    <Image
                        source={{ uri: place.imageUrl }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.placeholderImage}>
                        <IconSymbol name="map.fill" size={24} color="#0a7ea4" />
                    </View>
                )}
            </View>

            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.name} numberOfLines={1}>{place.name}</Text>
                    {place.rating && (
                        <View style={styles.ratingContainer}>
                            <IconSymbol name="star.fill" size={14} color="#fbbf24" />
                            <Text style={styles.rating}>{place.rating}</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.category}>{place.category}</Text>
                <Text style={styles.description} numberOfLines={2}>{place.description}</Text>
                <View style={styles.footer}>
                    <View style={styles.distanceContainer}>
                        <IconSymbol name="location.fill" size={14} color="#687076" />
                        <Text style={styles.distance}>{place.distance}</Text>
                    </View>
                    {place.latitude && place.longitude && (
                        <TouchableOpacity 
                            style={styles.directionsButton}
                            onPress={handleDirections}
                            activeOpacity={0.7}
                        >
                            <IconSymbol name="arrow.triangle.turn.up.right.diamond.fill" size={14} color="#0a7ea4" />
                            <Text style={styles.directionsText}>Directions</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    imageContainer: {
        width: 100,
        height: 100,
        backgroundColor: '#f5f5f5',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e8f4f8',
    },
    content: {
        flex: 1,
        padding: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    name: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: '#11181C',
        marginRight: 8,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    rating: {
        fontSize: 13,
        fontWeight: '600',
        color: '#11181C',
    },
    category: {
        fontSize: 12,
        color: '#687076',
        marginBottom: 4,
    },
    description: {
        fontSize: 13,
        color: '#687076',
        lineHeight: 18,
        marginBottom: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    distanceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
        flexShrink: 1,
    },
    distance: {
        fontSize: 13,
        color: '#687076',
        fontWeight: '500',
    },
    directionsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 5,
        backgroundColor: '#e8f4f8',
        borderRadius: 8,
        flexShrink: 0,
    },
    directionsText: {
        fontSize: 12,
        color: '#0a7ea4',
        fontWeight: '600',
    },
});
