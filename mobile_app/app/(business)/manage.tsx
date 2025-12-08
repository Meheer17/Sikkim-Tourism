import { IconSymbol } from '@/components/ui/icon-symbol';
import { getLanguageTranslations } from '@/constants/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/hooks/useAuth';
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert, RefreshControl, TextInput } from 'react-native';
import { bookingsService } from '@/services/bookings.service';
import { OrderModel } from '@/services/orders.service';
import { businessService, BusinessModel } from '@/services/business.service';
import { useFocusEffect } from '@react-navigation/native';
import BusinessRequests from './requests';

export default function BusinessManage() {
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const { user } = useAuth();
    const [tab, setTab] = useState<'bookings' | 'requests'>('bookings');
    const [bookings, setBookings] = useState<OrderModel[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<OrderModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [businesses, setBusinesses] = useState<BusinessModel[]>([]);
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'highest' | 'lowest'>('recent');

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const textColor = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

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
            if (tab === 'bookings') {
                loadData();
            }
        }, [tab])
    );

    useEffect(() => {
        applyFilter();
    }, [bookings, selectedFilter, searchQuery, sortBy]);

    const applyFilter = () => {
        let filtered = bookings;

        // Apply status filter
        switch (selectedFilter) {
            case 'pending':
                filtered = bookings.filter(b => b.order_status === 'created' && b.payment_status === 'pending');
                break;
            case 'confirmed':
                filtered = bookings.filter(b => b.order_status === 'confirmed');
                break;
            case 'completed':
                filtered = bookings.filter(b => b.order_status === 'completed');
                break;
            case 'all':
            default:
                break;
        }

        // Apply search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(b =>
                b.service_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                b.id.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply sorting
        switch (sortBy) {
            case 'recent':
                filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                break;
            case 'oldest':
                filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                break;
            case 'highest':
                filtered.sort((a, b) => b.amount - a.amount);
                break;
            case 'lowest':
                filtered.sort((a, b) => a.amount - b.amount);
                break;
        }

        setFilteredBookings(filtered);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const bizResp = await businessService.mine({ skip: 0, limit: 50 });
            if (bizResp.success && bizResp.data) {
                setBusinesses(bizResp.data);
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

    const handleMarkInProgress = async (booking: OrderModel) => {
        try {
            // Use orders service to update status
            const resp = await bookingsService.markPaymentCompleted(booking.id);
            if (resp.success) {
                Alert.alert(t.success || 'Success', t.bookingNowInProgress || 'Booking is now in progress');
                loadData();
            }
        } catch (error: any) {
            Alert.alert(t.error || 'Error', error.message || t.failedToComplete || 'Failed to update status');
        }
    };

    const getStatusLabel = (orderStatus: string, paymentStatus: string) => {
        if (paymentStatus === 'pending') return t.pending || 'Pending Payment';
        if (orderStatus === 'confirmed') return t.confirmed || 'Confirmed';
        if (orderStatus === 'cancelled') return t.cancelled || 'Cancelled';
        return orderStatus || t.created || 'Created';
    };

    const getServiceName = (booking: OrderModel) => `Service #${booking.service_id.substring(0, 8)}`;

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            {/* Main Content Scroll - includes header and filters */}
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.content, { backgroundColor: background }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Enhanced Header */}
                <View style={[styles.header, { backgroundColor: card }]}>
                    <Text style={[styles.headerTitle, { color: textColor }]}>{t.manage || 'Manage'}</Text>
                    <Text style={[styles.headerSub, { color: muted }]}>
                        {t.bookings || 'Bookings'} and requests management dashboard.
                    </Text>
                </View>

                {/* Search Bar */}
                <View style={[styles.searchBar, { backgroundColor: card, borderColor: muted }]}>
                    <IconSymbol name="magnifyingglass" size={16} color={muted} />
                    <TextInput
                        style={[styles.searchInput, { color: textColor }]}
                        placeholder={t.searchService || 'Search by service ID...'}
                        placeholderTextColor={muted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <IconSymbol name="xmark.circle.fill" size={16} color={muted} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Sort Selector */}
                <View style={[styles.sortSelector, { backgroundColor: card, borderColor: muted }]}>
                    <IconSymbol name="arrow.up.arrow.down" size={14} color={muted} />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                        {(['recent', 'oldest', 'highest', 'lowest'] as const).map((sort) => (
                            <TouchableOpacity
                                key={sort}
                                style={[
                                    styles.sortOption,
                                    sortBy === sort && { borderBottomColor: tint, borderBottomWidth: 2 }
                                ]}
                                onPress={() => setSortBy(sort)}
                            >
                                <Text style={[styles.sortOptionText, { color: sortBy === sort ? tint : muted }]}>
                                    {t[`sort${sort.charAt(0).toUpperCase()}${sort.slice(1)}`] || sort.charAt(0).toUpperCase() + sort.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Filter Tabs - Horizontal Scroll */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterTabsScroll}
                    contentContainerStyle={styles.filterTabsContainer}
                >
                    {(['all', 'pending', 'confirmed', 'completed'] as const).map((filter) => (
                        <TouchableOpacity
                            key={filter}
                            style={[
                                styles.filterTabHorizontal,
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
                                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                {/* Bookings List */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={tint} />
                        <Text style={[styles.loadingText, { color: muted }]}>{t.loadingBookings || 'Loading bookings...'}</Text>
                    </View>
                ) : filteredBookings.length === 0 ? (
                    <View style={[styles.emptyCard, { backgroundColor: card }]}>
                        <IconSymbol name="ticket" size={48} color={muted} />
                        <Text style={[styles.emptyText, { color: muted }]}>
                            {searchQuery ? t.noResults || 'No results found' : `${t.no || 'No'} ${selectedFilter} ${t.bookings || 'bookings'}`}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.bookingsGrid}>
                        {filteredBookings.map((b) => (
                            <View key={b.id} style={[styles.bookingCard, { backgroundColor: card }]}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.cardHeaderLeft}>
                                        <View style={[styles.serviceIcon, { backgroundColor: tint + '20' }]}>
                                            <IconSymbol name="checkmark.circle" size={20} color={tint} />
                                        </View>
                                        <View>
                                            <Text style={[styles.serviceName, { color: textColor }]}>{getServiceName(b)}</Text>
                                            <Text style={[styles.subText, { color: muted }]}>
                                                {new Date(b.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'en-IN')}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={[styles.badge, { backgroundColor: statusBg(b.order_status, b.payment_status) }]}>
                                        <Text style={[styles.badgeText, { color: statusColor(b.order_status, b.payment_status) }]}>
                                            {getStatusLabel(b.order_status, b.payment_status)}
                                        </Text>
                                    </View>
                                </View>

                                <View style={[styles.divider, { borderColor: muted + '20' }]} />

                                <View style={styles.cardDetails}>
                                    <View style={styles.detailRow}>
                                        <Text style={[styles.detailLabel, { color: muted }]}>{t.id || 'ID'}</Text>
                                        <Text style={[styles.detailValue, { color: textColor }]}>{b.id.substring(0, 12)}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={[styles.detailLabel, { color: muted }]}>{t.amount || 'Amount'}</Text>
                                        <Text style={[styles.detailValue, { color: tint, fontWeight: '700' }]}>₹{b.amount.toFixed(2)}</Text>
                                    </View>
                                    {b.metadata?.from_time && (
                                        <View style={styles.detailRow}>
                                            <Text style={[styles.detailLabel, { color: muted }]}>{t.startTime || 'Start'}</Text>
                                            <Text style={[styles.detailValue, { color: textColor }]}>{b.metadata.from_time}</Text>
                                        </View>
                                    )}
                                    {b.metadata?.to_time && (
                                        <View style={styles.detailRow}>
                                            <Text style={[styles.detailLabel, { color: muted }]}>{t.endTime || 'End'}</Text>
                                            <Text style={[styles.detailValue, { color: textColor }]}>{b.metadata.to_time}</Text>
                                        </View>
                                    )}
                                    {b.metadata?.quantity && (
                                        <View style={styles.detailRow}>
                                            <Text style={[styles.detailLabel, { color: muted }]}>{t.quantity || 'Qty'}</Text>
                                            <Text style={[styles.detailValue, { color: textColor }]}>{b.metadata.quantity}</Text>
                                        </View>
                                    )}
                                    {b.metadata?.notes && (
                                        <View style={styles.detailRow}>
                                            <Text style={[styles.detailLabel, { color: muted }]}>{t.notes || 'Notes'}</Text>
                                            <Text style={[styles.detailValue, { color: textColor }]} numberOfLines={1}>{b.metadata.notes}</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.cardActions}>
                                    {b.order_status !== 'confirmed' && b.order_status !== 'cancelled' && b.order_status !== 'completed' && b.order_status !== 'in_progress' && (
                                        <TouchableOpacity
                                            style={[styles.actionBtn, { backgroundColor: tint }]}
                                            onPress={() => handleConfirm(b)}
                                        >
                                            <IconSymbol name="checkmark" size={14} color="#fff" />
                                            <Text style={styles.actionText}>{t.confirm || 'Confirm'}</Text>
                                        </TouchableOpacity>
                                    )}
                                    {b.order_status === 'confirmed' && (
                                        <>
                                            <TouchableOpacity
                                                style={[styles.actionBtn, { backgroundColor: '#f59e0b' }]}
                                                onPress={() => handleMarkInProgress(b)}
                                            >
                                                <IconSymbol name="play.circle.fill" size={14} color="#fff" />
                                                <Text style={styles.actionText}>{t.markAsInProgress || 'In Progress'}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.actionBtn, { backgroundColor: '#10b981' }]}
                                                onPress={() => handleMarkCompleted(b)}
                                            >
                                                <IconSymbol name="checkmark.circle.fill" size={14} color="#fff" />
                                                <Text style={styles.actionText}>{t.complete || 'Complete'}</Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                    {b.order_status === 'in_progress' && (
                                        <TouchableOpacity
                                            style={[styles.actionBtn, { backgroundColor: '#10b981' }]}
                                            onPress={() => handleMarkCompleted(b)}
                                        >
                                            <IconSymbol name="checkmark.circle.fill" size={14} color="#fff" />
                                            <Text style={styles.actionText}>{t.complete || 'Complete'}</Text>
                                        </TouchableOpacity>
                                    )}
                                    {b.order_status !== 'cancelled' && b.order_status !== 'completed' && (
                                        <TouchableOpacity
                                            style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}
                                            onPress={() => handleCancel(b)}
                                        >
                                            <IconSymbol name="xmark" size={14} color="#fff" />
                                            <Text style={styles.actionText}>{t.cancel || 'Cancel'}</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { flex: 1 },
    content: { paddingBottom: 80 },

    // Header
    header: { padding: 20, paddingTop: 60 },
    headerTitle: { fontSize: 28, fontWeight: '700' },
    headerSub: { fontSize: 13, marginTop: 6, lineHeight: 18 },

    // Filter Tabs Scroll
    filterTabsScroll: {
        paddingHorizontal: 16,
        marginVertical: 6,
        height: 36,
    },
    filterTabsContainer: {
        gap: 8,
        paddingRight: 16,
    },
    filterTabHorizontal: {
        paddingVertical: 1,
        height: 32,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Main Tab Switch
    mainTabRow: {
        flexDirection: 'row',
        gap: 0,
        marginHorizontal: 16,
        marginVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        padding: 4,
    },
    mainTabBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
    },
    mainTabBtnActive: {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    mainTabText: { fontSize: 14, fontWeight: '600' },

    // Filter Tabs
    filterContainer: {
        flexDirection: 'row',
        gap: 8,
        marginHorizontal: 16,
        marginVertical: 12,
    },
    filterTab: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        flex: 1,
        alignItems: 'center',
    },
    filterTabText: { fontSize: 12, fontWeight: '600' },

    // Horizontal Scroll Container
    horizontalScrollContainer: {
        flex: 1,
    },
    statusSection: {
        flex: 1,
        flexDirection: 'column',
    },
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    statusHeaderTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    statusCount: {
        fontSize: 12,
        fontWeight: '500',
    },
    statusContent: {
        flex: 1,
    },

    // Bookings Grid
    bookingsGrid: { paddingHorizontal: 16 },
    bookingCard: {
        borderRadius: 14,
        marginBottom: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    serviceIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    serviceName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
    subText: { fontSize: 12 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 11, fontWeight: '600' },

    // Divider
    divider: { height: 1, borderBottomWidth: 1 },

    // Card Details
    cardDetails: { paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: { fontSize: 12, fontWeight: '500' },
    detailValue: { fontSize: 13, fontWeight: '600' },

    // Card Actions
    cardActions: {
        flexDirection: 'row',
        gap: 6,
        padding: 12,
        flexWrap: 'wrap',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
        flex: 1,
        minWidth: 90,
        justifyContent: 'center',
    },
    actionText: { fontSize: 12, fontWeight: '600', color: '#fff' },

    // Loading & Empty States
    loadingContainer: {
        paddingVertical: 80,
        alignItems: 'center',
        gap: 12,
    },
    loadingText: { fontSize: 14, fontWeight: '500' },
    emptyCard: {
        borderRadius: 14,
        padding: 40,
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 40,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    emptyText: { fontSize: 16, fontWeight: '600', marginTop: 16 },

    // Search Bar
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
        height: 44,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        padding: 0,
    },

    // Sort & Filter
    sortFilterRow: {
        gap: 12,
        marginHorizontal: 16,
        marginBottom: 12,
    },
    sortSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        marginHorizontal: 16,
        marginVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        gap: 8,
        height: 44,
    },
    sortOption: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sortOptionText: {
        fontSize: 12,
        fontWeight: '500',
    },
});
