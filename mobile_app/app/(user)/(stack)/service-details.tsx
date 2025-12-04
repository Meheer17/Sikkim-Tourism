import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { servicesService, businessService } from '@/services';
import { ServiceModel } from '@/services/services.service';
import { useAuth } from '@/hooks/useAuth';
import Toast from 'react-native-toast-message';

export default function ServiceDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [service, setService] = useState<ServiceModel | null>(null);
    const [businessName, setBusinessName] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');
    const border = useThemeColor('border');

    const canEdit = user && (user.role === 'admin' || user.role === 'business');

    useEffect(() => {
        loadServiceDetails();
    }, [id]);

    const loadServiceDetails = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const resp = await servicesService.get(id);
            if (resp.success && resp.data) {
                setService(resp.data);
                // Load business name
                if (resp.data.bid) {
                    try {
                        const bizResp = await businessService.get(resp.data.bid);
                        if (bizResp.success && bizResp.data) {
                            setBusinessName(bizResp.data.name);
                        }
                    } catch (error) {
                        console.warn('Failed to load business name:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load service:', error);
            Toast.show({ type: 'error', text1: 'Failed to load service details' });
        } finally {
            setLoading(false);
        }
    };

    const handleBookNow = () => {
        // Navigate to booking screen or show booking modal
        Toast.show({ type: 'info', text1: 'Booking feature coming soon!' });
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: background }]}>
                <ActivityIndicator size="large" color={tint} />
            </View>
        );
    }

    if (!service) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: background }]}>
                <IconSymbol name="exclamationmark.triangle" size={48} color={muted} />
                <Text style={[styles.errorText, { color: text }]}>Service not found</Text>
                <TouchableOpacity style={[styles.button, { backgroundColor: tint }]} onPress={() => router.back()}>
                    <Text style={styles.buttonText}>Go Back</Text>
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
                    {service.name}
                </Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Price Card */}
                <View style={[styles.card, { backgroundColor: card }]}>
                    <View style={styles.priceContainer}>
                        <Text style={[styles.priceLabel, { color: muted }]}>Price</Text>
                        <Text style={[styles.price, { color: tint }]}>₹{service.price}</Text>
                    </View>
                </View>

                {/* Provider Info */}
                {businessName && (
                    <View style={[styles.card, { backgroundColor: card }]}>
                        <View style={styles.infoRow}>
                            <IconSymbol name="building.2.fill" size={20} color={tint} />
                            <View style={styles.infoContent}>
                                <Text style={[styles.infoLabel, { color: muted }]}>Service Provider</Text>
                                <Text style={[styles.infoValue, { color: text }]}>{businessName}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Short Description */}
                {service.short_description && (
                    <View style={[styles.card, { backgroundColor: card }]}>
                        <Text style={[styles.sectionTitle, { color: text }]}>Overview</Text>
                        <Text style={[styles.description, { color: muted }]}>{service.short_description}</Text>
                    </View>
                )}

                {/* Description */}
                {service.description && (
                    <View style={[styles.card, { backgroundColor: card }]}>
                        <Text style={[styles.sectionTitle, { color: text }]}>Details</Text>
                        <Text style={[styles.description, { color: muted }]}>{service.description}</Text>
                    </View>
                )}

                {/* Features */}
                {service.features && service.features.length > 0 && (
                    <View style={[styles.card, { backgroundColor: card }]}>
                        <Text style={[styles.sectionTitle, { color: text }]}>Features</Text>
                        {service.features.map((feature, index) => (
                            <View key={index} style={styles.featureRow}>
                                <IconSymbol name="checkmark.circle.fill" size={20} color={tint} />
                                <Text style={[styles.featureText, { color: text }]}>{feature}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Metadata */}
                {service.metadata && (
                    <View style={[styles.card, { backgroundColor: card }]}>
                        <Text style={[styles.sectionTitle, { color: text }]}>Additional Information</Text>
                        {Array.isArray(service.metadata) ? (
                            service.metadata.map((meta: { [s: string]: unknown; } | ArrayLike<unknown>, index: React.Key | null | undefined) => (
                                <View key={index} style={[styles.metadataItem, { borderBottomColor: border }]}>
                                    {Object.entries(meta).map(([key, value]) => (
                                        <View key={key} style={styles.metadataRow}>
                                            <Text style={[styles.metadataKey, { color: muted }]}>{key}:</Text>
                                            <Text style={[styles.metadataValue, { color: text }]}>{String(value)}</Text>
                                        </View>
                                    ))}
                                </View>
                            ))
                        ) : (
                            <View style={styles.metadataItem}>
                                {Object.entries(service.metadata).map(([key, value]) => (
                                    <View key={key} style={styles.metadataRow}>
                                        <Text style={[styles.metadataKey, { color: muted }]}>{key}:</Text>
                                        <Text style={[styles.metadataValue, { color: text }]}>
                                            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Book Now Button */}
            <View style={[styles.footer, { backgroundColor: card, borderTopColor: border }]}>
                <TouchableOpacity
                    style={[styles.bookButton, { backgroundColor: tint }]}
                    onPress={handleBookNow}
                >
                    <Text style={styles.bookButtonText}>Book Now - ₹{service.price}</Text>
                </TouchableOpacity>
            </View>
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
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        gap: 12,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
    },
    placeholder: {
        width: 32,
    },
    scrollView: {
        flex: 1,
    },
    card: {
        margin: 16,
        marginBottom: 0,
        padding: 20,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    priceContainer: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    priceLabel: {
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    price: {
        fontSize: 36,
        fontWeight: '700',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    featureText: {
        flex: 1,
        fontSize: 15,
    },
    metadataItem: {
        paddingBottom: 12,
        marginBottom: 12,
        borderBottomWidth: 1,
    },
    metadataRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    metadataKey: {
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    metadataValue: {
        fontSize: 14,
        flex: 1,
    },
    bottomPadding: {
        height: 100,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
    },
    bookButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    bookButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
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
});
