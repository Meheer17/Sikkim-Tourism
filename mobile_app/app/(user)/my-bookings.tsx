import BookingCard, { Booking } from '@/components/bookings/BookingCard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getLanguageTranslations } from '@/constants/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const STATUS_FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'completed', label: 'Completed' },
];

export default function MyBookingsScreen() {
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [refreshing, setRefreshing] = useState(false);

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
        // TODO: Replace with actual API call
        // const response = await apiClient.get('/bookings');
        // setBookings(response.data);

        setBookings([]);
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
        // TODO: Navigate to booking details
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
                    <Text style={[styles.statLabel, { color: mutedText }]}>Active</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: cardBg }]}>
                    <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
                        <IconSymbol name="clock.fill" size={24} color="#3b82f6" />
                    </View>
                    <Text style={[styles.statValue, { color: text }]}>{upcomingCount}</Text>
                    <Text style={[styles.statLabel, { color: mutedText }]}>Upcoming</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: cardBg }]}>
                    <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                        <IconSymbol name="indianrupeesign.circle.fill" size={24} color="#f59e0b" />
                    </View>
                    <Text style={[styles.statValue, { color: text }]}>
                        {bookings.reduce((sum, b) => sum + b.price, 0)}
                    </Text>
                    <Text style={[styles.statLabel, { color: mutedText }]}>Total Spent</Text>
                </View>
            </View>

            {/* Filters */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filtersContainer}
                contentContainerStyle={styles.filtersContent}
            >
                {STATUS_FILTERS.map((filter) => (
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
                {filteredBookings.length > 0 ? (
                    filteredBookings.map((booking) => (
                        <BookingCard
                            key={booking.id}
                            booking={booking}
                            onPress={handleBookingPress}
                        />
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <IconSymbol name="calendar.badge.exclamationmark" size={64} color={border as string} />
                        <Text style={[styles.emptyTitle, { color: text }]}>{t.noBookings}</Text>
                        <Text style={[styles.emptySubtitle, { color: mutedText }]}>
                            {selectedFilter === 'all'
                                ? t.explore_places
                                : t.noBookings}
                        </Text>
                        <TouchableOpacity style={[styles.exploreButton, { backgroundColor: tint }]}>
                            <Text style={styles.exploreButtonText}>Explore Services</Text>
                        </TouchableOpacity>
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
});
