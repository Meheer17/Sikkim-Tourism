import { IconSymbol } from '@/components/ui/icon-symbol';
import { getLanguageTranslations } from '@/constants/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/hooks/useAuth';
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { bookingsService } from '@/services/bookings.service';
import { OrderModel } from '@/services/orders.service';
import { businessService, BusinessModel } from '@/services/business.service';
import { useFocusEffect } from '@react-navigation/native';

export default function BusinessBookings() {
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const { user } = useAuth();
    const [bookings, setBookings] = useState<OrderModel[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<OrderModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [businesses, setBusinesses] = useState<BusinessModel[]>([]);
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');

    const statusColor = (orderStatus: string, paymentStatus: string) => {
        if (paymentStatus === 'pending') return '#f59e0b';
        if (orderStatus === 'confirmed') return '#10b981';
        if (orderStatus === 'cancelled') return '#ef4444';
        return '#3b82f6';
    };
    const statusBg = (orderStatus: string, paymentStatus: string) => {
        if (paymentStatus === 'pending') return '#fef3c7';
        if (orderStatus === 'confirmed') return '#d1fae5';
        if (orderStatus === 'cancelled') return '#fee2e2';
        return '#dbeafe';
    };

    useFocusEffect(
        React.useCallback(() => {
            loadData();
        }, [])
    );

    useEffect(() => {
        applyFilter();
    }, [bookings, selectedFilter]);

    const applyFilter = () => {
        let filtered = bookings;

        switch (selectedFilter) {
            case 'pending':
                filtered = bookings.filter(b => b.order_status === 'created' && b.payment_status === 'pending');
                break;
            case 'confirmed':
                filtered = bookings.filter(b => b.order_status === 'confirmed' && b.payment_status === 'pending');
                break;
            case 'completed':
                filtered = bookings.filter(b => b.order_status === 'completed' && b.payment_status != 'pending');
                break;
            case 'all':
            default:
                break;
        }

        setFilteredBookings(filtered);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            // Load user's businesses
            const bizResp = await businessService.mine({ skip: 0, limit: 50 });
            if (bizResp.success && bizResp.data) {
                setBusinesses(bizResp.data);
                // Load bookings for all businesses
                await loadBookingsForBusinesses(bizResp.data);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            Alert.alert(t.error || 'Error', t.failedToLoadBookings || 'Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const loadBookingsForBusinesses = async (businesses: BusinessModel[]) => {
        try {
            const allBookings: OrderModel[] = [];
            for (const biz of businesses) {
                const resp = await bookingsService.getBusinessBookings(biz.id, { skip: 0, limit: 100 });
                if (resp.success && resp.data) {
                    allBookings.push(...resp.data);
                }
            }
            setBookings(allBookings);
        } catch (error) {
            console.error('Failed to load bookings:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            const bizResp = await businessService.mine({ skip: 0, limit: 50 });
            if (bizResp.success && bizResp.data) {
                setBusinesses(bizResp.data);
                await loadBookingsForBusinesses(bizResp.data);
            }
        } catch (error) {
            console.error('Refresh failed:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleConfirm = async (booking: OrderModel) => {
        try {
            // Use the business_id from the booking itself
            const resp = await bookingsService.confirmBooking(booking.business_id, booking.id);
            if (resp.success) {
                Alert.alert(t.success || 'Success', t.bookingConfirmed || 'Booking confirmed');
                loadData();
            }
        } catch (error: any) {
            Alert.alert(t.error || 'Error', error.message || t.failedToConfirm || 'Failed to confirm booking');
        }
    };

    const handleCancel = async (booking: OrderModel) => {
        Alert.alert(
            t.cancelBooking || 'Cancel Booking',
            t.confirmCancelBooking || 'Are you sure?',
            [
                { text: t.no || 'No', style: 'cancel' },
                {
                    text: t.yes || 'Yes',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Use the business_id from the booking itself
                            const resp = await bookingsService.cancelBooking(booking.business_id, booking.id);
                            if (resp.success) {
                                Alert.alert(t.success || 'Success', t.bookingCancelled || 'Booking cancelled');
                                loadData();
                            }
                        } catch (error: any) {
                            Alert.alert(t.error || 'Error', error.message || t.failedToCancel || 'Failed to cancel');
                        }
                    }
                }
            ]
        );
    };

    const handleMarkCompleted = async (booking: OrderModel) => {
        try {
            const resp = await bookingsService.markCompleted(booking.business_id, booking.id);
            if (resp.success) {
                Alert.alert(t.success || 'Success', t.bookingMarkedCompleted || 'Booking marked as completed');
                loadData();
            }
        } catch (error: any) {
            Alert.alert(t.error || 'Error', error.message || t.failedToComplete || 'Failed to mark as completed');
        }
    };

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const textColor = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    const getStatusLabel = (orderStatus: string, paymentStatus: string) => {
        if (paymentStatus === 'pending') return t.pending || 'Pending Payment';
        if (orderStatus === 'confirmed') return t.confirmed || 'Confirmed';
        if (orderStatus === 'cancelled') return t.cancelled || 'Cancelled';
        return orderStatus || t.created || 'Created';
    };

    const getServiceName = (booking: OrderModel) => `Service #${booking.service_id.substring(0, 8)}`;

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.content, { backgroundColor: background }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={[styles.header, { backgroundColor: card }]}>
                    <Text style={[styles.headerTitle, { color: textColor }]}>{t.bookings || 'Bookings'}</Text>
                </View>

                {/* Filter Tabs */}
                <View style={styles.filterContainer}>
                    {(['all', 'pending', 'confirmed', 'completed'] as const).map((filter) => (
                        <TouchableOpacity
                            key={filter}
                            style={[
                                styles.filterTab,
                                selectedFilter === filter
                                    ? { backgroundColor: tint, borderColor: tint }
                                    : { backgroundColor: card, borderColor: muted }
                            ]}
                            onPress={() => setSelectedFilter(filter)}
                        >
                            <Text
                                style={[
                                    styles.filterTabText,
                                    { color: selectedFilter === filter ? '#fff' : textColor }
                                ]}
                            >
                                {t[`filter${filter.charAt(0).toUpperCase()}${filter.slice(1)}`] || filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={tint} />
                    </View>
                ) : filteredBookings.length === 0 ? (
                    <View style={[styles.emptyCard, { backgroundColor: card }]}>
                        <IconSymbol name="ticket" size={48} color={muted} />
                        <Text style={[styles.emptyText, { color: muted }]}>
                            {selectedFilter === 'all'
                                ? t.noBookings || 'No bookings yet'
                                : `${t.no || 'No'} ${selectedFilter} ${t.bookings || 'bookings'}`}
                        </Text>
                    </View>
                ) : (
                    filteredBookings.map((b) => (
                        <View key={b.id} style={[styles.card, { backgroundColor: card }]}>
                            <View style={styles.row}>
                                <Text style={[styles.service, { color: textColor }]}>{getServiceName(b)}</Text>
                                <View style={[styles.badge, { backgroundColor: statusBg(b.order_status, b.payment_status) }]}>
                                    <Text style={[styles.badgeText, { color: statusColor(b.order_status, b.payment_status) }]}>
                                        {getStatusLabel(b.order_status, b.payment_status)}
                                    </Text>
                                </View>
                            </View>
                            <Text style={[styles.subText, { color: muted }]}>
                                {new Date(b.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'en-IN')}
                            </Text>
                            <View style={styles.row}>
                                <Text style={[styles.subText, { color: muted }]}>ID: {b.id.substring(0, 12)}</Text>
                                <Text style={[styles.amount, { color: tint }]}>₹{b.amount.toFixed(2)}</Text>
                            </View>
                            {b.metadata && (
                                <>
                                    {b.metadata.from_time && (
                                        <Text style={[styles.subText, { color: muted }]}>
                                            {t.startTime || 'Start'}: {b.metadata.from_time}
                                        </Text>
                                    )}
                                    {b.metadata.to_time && (
                                        <Text style={[styles.subText, { color: muted }]}>
                                            {t.endTime || 'End'}: {b.metadata.to_time}
                                        </Text>
                                    )}
                                    {b.metadata.quantity && (
                                        <Text style={[styles.subText, { color: muted }]}>
                                            {t.quantity || 'Quantity'}: {b.metadata.quantity}
                                        </Text>
                                    )}
                                </>
                            )}
                            <View style={styles.actions}>
                                {b.order_status !== 'confirmed' && b.order_status !== 'cancelled' && b.order_status !== 'completed' && (
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { backgroundColor: tint }]}
                                        onPress={() => handleConfirm(b)}
                                    >
                                        <IconSymbol name="checkmark" size={16} color="#fff" />
                                        <Text style={styles.actionText}>{t.confirm || 'Confirm'}</Text>
                                    </TouchableOpacity>
                                )}
                                {b.order_status === 'confirmed' && (
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { backgroundColor: '#10b981' }]}
                                        onPress={() => handleMarkCompleted(b)}
                                    >
                                        <IconSymbol name="checkmark.circle.fill" size={16} color="#fff" />
                                        <Text style={styles.actionText}>{t.complete || 'Complete'}</Text>
                                    </TouchableOpacity>
                                )}
                                {b.order_status !== 'cancelled' && b.order_status !== 'completed' && (
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}
                                        onPress={() => handleCancel(b)}
                                    >
                                        <IconSymbol name="xmark" size={16} color="#fff" />
                                        <Text style={styles.actionText}>{t.cancel || 'Cancel'}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20, paddingTop: 60, borderBottomWidth: 0 },
    headerTitle: { fontSize: 28, fontWeight: '700' },
    scroll: { flex: 1 },
    content: { padding: 16, paddingBottom: 100 },
    filterContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
        paddingHorizontal: 4
    },
    filterTab: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        flex: 1,
        alignItems: 'center'
    },
    filterTabText: {
        fontSize: 12,
        fontWeight: '600'
    },
    card: { borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    service: { fontSize: 16, fontWeight: '700' },
    subText: { fontSize: 13, marginTop: 4 },
    amount: { fontSize: 18, fontWeight: '700' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    actions: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, flex: 1, minWidth: 100 },
    actionText: { fontSize: 13, fontWeight: '600', color: '#fff' },
    loadingContainer: { paddingVertical: 60, alignItems: 'center' },
    emptyCard: { borderRadius: 12, padding: 40, alignItems: 'center', marginTop: 40 },
    emptyText: { fontSize: 16, fontWeight: '600', marginTop: 16 },
});
