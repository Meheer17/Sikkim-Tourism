import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import BookingCard, { Booking } from '@/components/bookings/BookingCard';

// Mock data - replace with actual API call
const MOCK_BOOKINGS: Booking[] = [
    {
        id: '1',
        serviceName: 'Local Cab Service',
        bookingDate: 'Today, 2:30 PM',
        status: 'active',
        serviceType: 'Transport',
        price: 800,
        bookingCode: 'TC-2024-001',
    },
    {
        id: '2',
        serviceName: 'Museum Entry Pass',
        bookingDate: 'Tomorrow, 10:00 AM',
        status: 'upcoming',
        serviceType: 'Culture',
        price: 150,
        bookingCode: 'ME-2024-002',
    },
    {
        id: '3',
        serviceName: 'Mountain Trekking Guide',
        bookingDate: 'Nov 25, 2024',
        status: 'upcoming',
        serviceType: 'Adventure',
        price: 2500,
        bookingCode: 'TG-2024-003',
    },
    {
        id: '4',
        serviceName: 'River Rafting',
        bookingDate: 'Nov 15, 2024',
        status: 'completed',
        serviceType: 'Adventure',
        price: 1500,
        bookingCode: 'RR-2024-004',
    },
];

const STATUS_FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'completed', label: 'Completed' },
];

export default function MyBookingsScreen() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [refreshing, setRefreshing] = useState(false);

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

        setBookings(MOCK_BOOKINGS);
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
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>My Bookings</Text>
                    <Text style={styles.headerSubtitle}>Track your reservations</Text>
                </View>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
                        <IconSymbol name="checkmark.circle.fill" size={24} color="#10b981" />
                    </View>
                    <Text style={styles.statValue}>{activeCount}</Text>
                    <Text style={styles.statLabel}>Active</Text>
                </View>
                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
                        <IconSymbol name="clock.fill" size={24} color="#3b82f6" />
                    </View>
                    <Text style={styles.statValue}>{upcomingCount}</Text>
                    <Text style={styles.statLabel}>Upcoming</Text>
                </View>
                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                        <IconSymbol name="indianrupeesign.circle.fill" size={24} color="#f59e0b" />
                    </View>
                    <Text style={styles.statValue}>
                        {bookings.reduce((sum, b) => sum + b.price, 0)}
                    </Text>
                    <Text style={styles.statLabel}>Total Spent</Text>
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
                            selectedFilter === filter.key && styles.filterChipActive,
                        ]}
                        onPress={() => setSelectedFilter(filter.key)}
                    >
                        <Text
                            style={[
                                styles.filterText,
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
                        <IconSymbol name="calendar.badge.exclamationmark" size={64} color="#d1d5db" />
                        <Text style={styles.emptyTitle}>No bookings found</Text>
                        <Text style={styles.emptySubtitle}>
                            {selectedFilter === 'all'
                                ? 'Start exploring and book your first service'
                                : `You have no ${selectedFilter} bookings`}
                        </Text>
                        <TouchableOpacity style={styles.exploreButton}>
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
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#fff',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: '#11181C',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 15,
        color: '#687076',
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
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
        color: '#11181C',
        marginTop: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#687076',
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
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterChipActive: {
        backgroundColor: '#0a7ea4',
        borderColor: '#0a7ea4',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#687076',
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
        color: '#11181C',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#687076',
        textAlign: 'center',
        marginBottom: 24,
    },
    exploreButton: {
        backgroundColor: '#0a7ea4',
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
