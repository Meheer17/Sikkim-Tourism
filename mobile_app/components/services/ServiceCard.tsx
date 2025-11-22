import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

export interface Service {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    category: string;
    icon?: string;
}

interface ServiceCardProps {
    service: Service;
    onPress?: (service: Service) => void;
}

export default function ServiceCard({ service, onPress }: ServiceCardProps) {
    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onPress?.(service)}
            activeOpacity={0.7}
        >
            <View style={styles.imageContainer}>
                {service.imageUrl ? (
                    <Image
                        source={{ uri: service.imageUrl }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.placeholderImage}>
                        <IconSymbol
                            name={(service.icon as any) || 'star.fill'}
                            size={32}
                            color="#0a7ea4"
                        />
                    </View>
                )}
            </View>

            <View style={styles.content}>
                <Text style={styles.category}>{service.category}</Text>
                <Text style={styles.name} numberOfLines={1}>{service.name}</Text>
                <Text style={styles.description} numberOfLines={2}>{service.description}</Text>
                <View style={styles.footer}>
                    <Text style={styles.price}>₹{service.price}</Text>
                    <View style={styles.arrowContainer}>
                        <IconSymbol name="arrow.right" size={16} color="#0a7ea4" />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    imageContainer: {
        width: '100%',
        height: 160,
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
        padding: 16,
    },
    category: {
        fontSize: 12,
        color: '#687076',
        textTransform: 'uppercase',
        fontWeight: '600',
        marginBottom: 4,
    },
    name: {
        fontSize: 18,
        fontWeight: '700',
        color: '#11181C',
        marginBottom: 6,
    },
    description: {
        fontSize: 14,
        color: '#687076',
        lineHeight: 20,
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    price: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0a7ea4',
    },
    arrowContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#e8f4f8',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
