import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

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
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');
    const soft = useThemeColor('tintSoftBg');
    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: card }]}
            onPress={() => onPress?.(service)}
            activeOpacity={0.7}
        >

            <View style={styles.content}>
                <Text style={[styles.category, { color: muted }]}>{service.category}</Text>
                <Text style={[styles.name, { color: text }]} numberOfLines={1}>{service.name}</Text>
                <Text style={[styles.description, { color: muted }]} numberOfLines={2}>{service.description}</Text>
                <View style={styles.footer}>
                    <Text style={[styles.price, { color: tint }]}>₹{service.price}</Text>
                    <View style={[styles.arrowContainer, { backgroundColor: soft }]}>
                        <IconSymbol name="arrow.right" size={16} color={tint} />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
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
        backgroundColor: '#0000',
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
        textTransform: 'uppercase',
        fontWeight: '600',
        marginBottom: 4,
    },
    name: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 6,
    },
    description: {
        fontSize: 14,
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
    },
    arrowContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
