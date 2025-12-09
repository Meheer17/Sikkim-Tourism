import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { servicesService, businessService, ordersService } from '@/services';
import { ServiceModel } from '@/services/services.service';
import BookingModal, { BookingData } from '@/components/services/BookingModal';
import { useAuth } from '@/hooks/useAuth';
import Toast from 'react-native-toast-message';
import { platformConfig } from '@/config/api.config';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageTranslations } from '@/constants/translations';

export default function ServiceDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const [service, setService] = useState<ServiceModel | null>(null);
    const [businessName, setBusinessName] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [bookingModalVisible, setBookingModalVisible] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);
    const { user } = useAuth();

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');
    const border = useThemeColor('border');

    const canEdit = user && (user.role === 'admin' || user.role === 'business');

    // Helper function to format metadata values for display
    const formatMetadataValue = (value: any): string => {
        if (value === null || value === undefined) return 'N/A';
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            // Check if it looks like a date/timestamp string
            if (typeof value === 'string' && (value.includes('T') || value.includes('-') || value.includes('/'))) {
                try {
                    const date = new Date(value);
                    if (!isNaN(date.getTime())) {
                        // Format as DD/MM/YYYY
                        return date.toLocaleDateString('en-IN', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric' 
                        });
                    }
                } catch (e) {
                    // If date parsing fails, return as string
                }
            }
            return String(value);
        }
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        if (typeof value === 'object') {
            // For objects, try to extract meaningful values
            const entries = Object.entries(value);
            if (entries.length === 0) return 'N/A';
            return entries.map(([k, v]) => `${k}: ${String(v)}`).join(' | ');
        }
        return String(value);
    };

    // Helper function to format field names (snake_case to Title Case)
    const formatFieldName = (key: string): string => {
        return key
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    // Helper function to get appropriate icon for metadata field
    const getMetadataIcon = (key: string): any => {
        const keyLower = key.toLowerCase();
        if (keyLower.includes('hour') || keyLower.includes('time')) return 'clock.fill';
        if (keyLower.includes('phone') || keyLower.includes('contact')) return 'phone.fill';
        if (keyLower.includes('location') || keyLower.includes('address')) return 'location.fill';
        if (keyLower.includes('capacity') || keyLower.includes('person')) return 'person.2.fill';
        if (keyLower.includes('price') || keyLower.includes('cost')) return 'tag.fill';
        if (keyLower.includes('duration')) return 'hourglass';
        return 'info.circle.fill';
    };

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
        setBookingModalVisible(true);
    };

    const handleBookingConfirm = async (bookingData: BookingData) => {
        try {
            setBookingLoading(true);
            console.log('Creating order with data:', bookingData);

            const response = await ordersService.create(bookingData);

            if (response.success && response.data) {
                Alert.alert(
                    t.success || 'Success',
                    t.booking_confirmed || 'Your booking has been confirmed!',
                    [
                        {
                            text: t.view_booking || 'View Booking',
                            onPress: () => {
                                setBookingModalVisible(false);
                                // Navigate to my-bookings tab
                                router.push('/(user)/my-bookings' as any);
                            },
                        },
                        {
                            text: t.continue_shopping || 'Continue Shopping',
                            onPress: () => setBookingModalVisible(false),
                        },
                    ]
                );
            } else {
                Alert.alert(t.error || 'Error', t.booking_failed || 'Booking failed');
            }
        } catch (error: any) {
            console.error('Booking error:', error);
            Alert.alert(
                t.error || 'Error',
                error?.message || t.something_went_wrong || 'Something went wrong. Please try again.'
            );
        } finally {
            setBookingLoading(false);
        }
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
                {service.metadata && Object.keys(service.metadata).length > 0 && (
                    <View style={[styles.card, { backgroundColor: card }]}>
                        <Text style={[styles.sectionTitle, { color: text }]}>Additional Information</Text>
                        {Array.isArray(service.metadata) ? (
                            service.metadata.map((meta: { [s: string]: unknown; } | ArrayLike<unknown>, index: React.Key | null | undefined) => (
                                <View key={index}>
                                    {Object.entries(meta).map(([key, value]) => (
                                        <View key={key} style={[styles.metadataRow, { borderBottomColor: border }]}>
                                            <View style={[styles.metadataIcon, { backgroundColor: `${tint}15` }]}>
                                                <IconSymbol name={getMetadataIcon(key)} size={18} color={tint} />
                                            </View>
                                            <View style={styles.metadataContent}>
                                                <Text style={[styles.metadataLabel, { color: muted }]}>{formatFieldName(key)}</Text>
                                                <Text style={[styles.metadataValueText, { color: text }]}>
                                                    {formatMetadataValue(value)}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            ))
                        ) : (
                            <View>
                                {Object.entries(service.metadata).map(([key, value]) => {
                                    // Special rendering for open_hours
                                    if (key.toLowerCase().includes('hour') && typeof value === 'object') {
                                        return (
                                            <View key={key}>
                                                <View style={[styles.metadataRow, { borderBottomColor: border }]}>
                                                    <View style={[styles.metadataIcon, { backgroundColor: `${tint}15` }]}>
                                                        <IconSymbol name="clock.fill" size={18} color={tint} />
                                                    </View>
                                                    <View style={styles.metadataContent}>
                                                        <Text style={[styles.metadataLabel, { color: muted }]}>{formatFieldName(key)}</Text>
                                                    </View>
                                                </View>
                                                <View style={styles.hoursContainer}>
                                                    {Object.entries(value as Record<string, any>).map(([day, hours]) => (
                                                        <View key={day} style={[styles.hourRow, { backgroundColor: card }]}>
                                                            <Text style={[styles.dayName, { color: text }]}>{day}</Text>
                                                            <Text style={[styles.hoursTime, { color: tint }]}>{String(hours)}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            </View>
                                        );
                                    }
                                    
                                    // Regular metadata rendering
                                    return (
                                        <View key={key} style={[styles.metadataRow, { borderBottomColor: border }]}>
                                            <View style={[styles.metadataIcon, { backgroundColor: `${tint}15` }]}>
                                                <IconSymbol name={getMetadataIcon(key)} size={18} color={tint} />
                                            </View>
                                            <View style={styles.metadataContent}>
                                                <Text style={[styles.metadataLabel, { color: muted }]}>{formatFieldName(key)}</Text>
                                                <Text style={[styles.metadataValueText, { color: text }]}>
                                                    {formatMetadataValue(value)}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                )}
                {/* Book Now Button */}
                <View style={[styles.footer, { backgroundColor: card, borderTopColor: border }]}>
                    <TouchableOpacity
                        style={[styles.bookButton, { backgroundColor: tint }]}
                        onPress={handleBookNow}
                        disabled={bookingLoading}
                    >
                        <Text style={styles.bookButtonText}>
                            {bookingLoading ? 'Processing...' : `${t.book_now || 'Book Now'} - ₹${service.price}`}
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.bottomPadding} />
            </ScrollView>



            {/* Booking Modal */}
            <BookingModal
                visible={bookingModalVisible}
                onClose={() => setBookingModalVisible(false)}
                onConfirm={handleBookingConfirm}
                serviceId={service.id || ''}
                serviceName={service.name}
                servicePrice={service.price}
                businessId={service.bid}
            />
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
        paddingTop: platformConfig.isAndroid ? 50 : 20,
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
        alignItems: 'flex-start',
        gap: 12,
        paddingVertical: 12,
        paddingBottom: 15,
        borderBottomWidth: 0.5,
        marginBottom: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    metadataIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
        paddingBottom: 8,
    },
    metadataContent: {
        flex: 1,
    },
    metadataLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    metadataValueText: {
        fontSize: 16,
        fontWeight: '500',
        lineHeight: 22,
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
    hoursContainer: {
        marginLeft: 52,
        marginTop: 8,
        marginBottom: 8,
        borderRadius: 12,
        overflow: 'hidden',
    },
    hourRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    dayName: {
        fontSize: 15,
        fontWeight: '600',
    },
    hoursTime: {
        fontSize: 14,
        fontWeight: '600',
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
