import BookingCard, { Booking } from '@/components/bookings/BookingCard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getLanguageTranslations } from '@/constants/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { bookingsService, servicesService, businessService } from '@/services';
import { OrderModel } from '@/services/orders.service';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';

const STATUS_FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'completed', label: 'Completed' },
];

export default function MyBookingsScreen() {
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);

    // Create translated filter labels
    const STATUS_FILTERS_TRANSLATED = [
        { key: 'all', label: t.all || 'All' },
        { key: 'active', label: t.active || 'Active' },
        { key: 'upcoming', label: t.upcoming || 'Upcoming' },
        { key: 'completed', label: t.completed || 'Completed' },
    ];
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [rawOrders, setRawOrders] = useState<OrderModel[]>([]);

    // Theme colors
    const screenBg = useThemeColor('background');
    const cardBg = useThemeColor('card');
    const text = useThemeColor('text');
    const mutedText = useThemeColor('mutedText');
    const tint = useThemeColor('tint');
    const border = useThemeColor('border');

    useEffect(() => {
        loadBookings();
    }, []);

    useEffect(() => {
        filterBookings();
    }, [selectedFilter, bookings]);

    const loadBookings = async () => {
        try {
            setLoading(true);
            const response = await bookingsService.getMyBookings({ skip: 0, limit: 100 });

            if (response.success && response.data) {
                const orders = response.data;
                setRawOrders(orders);

                // Transform OrderModel to Booking format
                const transformedBookings: Booking[] = await Promise.all(
                    orders.map(async (order) => {
                        try {
                            // Get service details
                            const serviceResponse = await servicesService.get(order.service_id);
                            const serviceName = serviceResponse.data?.name || 'Service';

                            // Determine booking status based on order and payment status
                            let status: 'active' | 'upcoming' | 'completed' | 'cancelled' = 'upcoming';

                            if (order.order_status === 'cancelled') {
                                status = 'cancelled';
                            } else if (order.order_status === 'completed') {
                                status = 'completed';
                            } else if (order.order_status === 'confirmed' && order.payment_status === 'completed') {
                                status = 'active';
                            }

                            return {
                                id: order.id,
                                serviceName,
                                bookingDate: new Date(order.created_at).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US'),
                                status,
                                serviceType: order.metadata?.type || 'Service',
                                price: order.amount,
                                bookingCode: order.id.substring(0, 8).toUpperCase(),
                            };
                        } catch (error) {
                            console.error(`Error transforming order ${order.id}:`, error);
                            return {
                                id: order.id,
                                serviceName: 'Service',
                                bookingDate: new Date(order.created_at).toLocaleDateString(),
                                status: 'upcoming' as const,
                                serviceType: 'Service',
                                price: order.amount,
                                bookingCode: order.id.substring(0, 8).toUpperCase(),
                            };
                        }
                    })
                );

                console.log('Loaded bookings:', transformedBookings);
                setBookings(transformedBookings.sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime()));
            } else {
                console.warn('Failed to load bookings:', response.errors);
                setBookings([]);
            }
        } catch (error) {
            console.error('Failed to load bookings:', error);
            Alert.alert(t.error || 'Error', t.failed_load_bookings || 'Failed to load bookings');
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    const filterBookings = () => {
        if (selectedFilter === 'all') {
            setFilteredBookings(bookings);
        } else {
            setFilteredBookings(bookings.filter(booking => booking.status === selectedFilter));
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadBookings();
        setRefreshing(false);
    };

    const handleBookingPress = (booking: Booking) => {
        console.log('Booking pressed:', booking);
        Alert.alert(
            booking.bookingCode || booking.id,
            `${booking.serviceName}\n₹${booking.price}\nStatus: ${booking.status}`
        );
    };

    const handlePayment = async (order: OrderModel) => {
        Alert.alert(
            t.pay || 'Pay Now',
            `${t.paymentAmount || 'Payment Amount'}: ₹${order.amount}`,
            [
                { text: t.cancel || 'Cancel', style: 'cancel' },
                {
                    text: t.confirm || 'Confirm',
                    onPress: async () => {
                        try {
                            // Call payment update
                            const resp = await bookingsService.markPaymentCompleted(order.id);
                            if (resp.success) {
                                Alert.alert(t.success || 'Success', t.paymentSuccessful || 'Payment successful! Your booking is now in progress.');
                                loadBookings();
                            }
                        } catch (error: any) {
                            Alert.alert(t.error || 'Error', error.message || t.paymentFailed || 'Payment failed. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const activeCount = bookings.filter(b => b.status === 'active').length;
    const upcomingCount = bookings.filter(b => b.status === 'upcoming').length;

    return (
        <View style={[styles.container, { backgroundColor: screenBg }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: cardBg }]}>
                <View>
                    <Text style={[styles.headerTitle, { color: text }]}>{t.myBookings}</Text>
                    <Text style={[styles.headerSubtitle, { color: mutedText }]}>{t.bookingHistory}</Text>
                </View>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={[styles.statCard, { backgroundColor: cardBg }]}>
                    <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
                        <IconSymbol name="checkmark.circle.fill" size={24} color="#10b981" />
                    </View>
                    <Text style={[styles.statValue, { color: text }]}>{activeCount}</Text>
                    <Text style={[styles.statLabel, { color: mutedText }]}>{t.active || 'Active'}</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: cardBg }]}>
                    <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
                        <IconSymbol name="clock.fill" size={24} color="#3b82f6" />
                    </View>
                    <Text style={[styles.statValue, { color: text }]}>{upcomingCount}</Text>
                    <Text style={[styles.statLabel, { color: mutedText }]}>{t.upcoming || 'Upcoming'}</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: cardBg }]}>
                    <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                        <IconSymbol name="indianrupeesign.circle.fill" size={24} color="#f59e0b" />
                    </View>
                    <Text style={[styles.statValue, { color: text }]}>
                        {bookings.reduce((sum, b) => sum + b.price, 0)}
                    </Text>
                    <Text style={[styles.statLabel, { color: mutedText }]}>{t.totalSpent || 'Total Spent'}</Text>
                </View>
            </View>

            {/* Filters */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filtersContainer}
                contentContainerStyle={styles.filtersContent}
            >
                {STATUS_FILTERS_TRANSLATED.map((filter) => (
                    <TouchableOpacity
                        key={filter.key}
                        style={[
                            styles.filterChip,
                            { backgroundColor: cardBg, borderColor: border },
                            selectedFilter === filter.key && { backgroundColor: tint, borderColor: tint },
                        ]}
                        onPress={() => setSelectedFilter(filter.key)}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                { color: mutedText },
                                selectedFilter === filter.key && styles.filterTextActive,
                            ]}
                        >
                            {filter.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Bookings List */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {loading ? (
                    <View style={styles.emptyState}>
                        <ActivityIndicator size="large" color={tint as string} />
                        <Text style={[styles.emptyTitle, { color: text, marginTop: 16 }]}>
                            {t.loading_bookings || 'Loading bookings...'}
                        </Text>
                    </View>
                ) : filteredBookings.length > 0 ? (
                    filteredBookings.map((booking) => {
                        // Find the corresponding raw order
                        const rawOrder = rawOrders.find(o => o.id === booking.id);
                        const needsPayment = rawOrder && rawOrder.order_status === 'confirmed' && rawOrder.payment_status === 'pending';

                        return (
                            <View key={booking.id}>
                                <BookingCard
                                    booking={booking}
                                    onPress={handleBookingPress}
                                />
                                {needsPayment && (
                                    <TouchableOpacity
                                        style={[styles.payButton, { backgroundColor: tint }]}
                                        onPress={() => handlePayment(rawOrder)}
                                    >
                                        <IconSymbol name="creditcard.fill" size={18} color="#fff" />
                                        <Text style={styles.payButtonText}>{t.pay || 'Pay Now'}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    })
                ) : (
                    <View style={styles.emptyState}>
                        <IconSymbol name="calendar.badge.exclamationmark" size={64} color={border as string} />
                        <Text style={[styles.emptyTitle, { color: text }]}>{t.noBookings || 'No bookings'}</Text>
                        <Text style={[styles.emptySubtitle, { color: mutedText }]}>
                            {selectedFilter === 'all'
                                ? t.explore_places || 'Explore and book services'
                                : t.noBookings || 'No bookings'}
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 20,
        paddingTop: 60,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 15,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 12,
    },
    statCard: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 4,
    },
    statLabel: {
        fontSize: 12,
        marginTop: 2,
    },
    filtersContainer: {
        marginBottom: 8,
        maxHeight: 50,
    },
    filtersContent: {
        paddingHorizontal: 20,
        gap: 8,
        alignItems: 'center',
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterChipActive: {
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
    },
    filterTextActive: {
        color: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    exploreButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    exploreButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    payButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: 16,
        marginBottom: 12,
        paddingVertical: 12,
        borderRadius: 12,
    },
    payButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
