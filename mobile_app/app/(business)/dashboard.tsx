import { IconSymbol } from '@/components/ui/icon-symbol';
import { getLanguageTranslations } from '@/constants/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import bookingsService from '@/services/bookings.service';

interface BookingStats {
    total?: number;
    pending?: number;
    revenue?: number;
    confirmed?: number;
    completed?: number;
    cancelled?: number;
    in_progress?: number;
}

export default function BusinessDashboard() {
    const router = useRouter();
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const textColor = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [bookingStats, setBookingStats] = useState<BookingStats>({});

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            // Fetch today's bookings count
            const todayBookingsRes = await bookingsService.getTodaysBookingsCount();
            if (todayBookingsRes.success) {
                setBookingStats(todayBookingsRes.data as BookingStats);
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    // Build stats with real data
    const defaultStats = [
        {
            title: t.todayBookings || 'Today Bookings',
            value: String(bookingStats.total || 0),
            icon: 'ticket.fill',
            color: '#f59e0b',
            bg: '#fef3c7',
            subtitle: `${bookingStats.pending || 0} pending`
        },
        {
            title: t.revenue || 'Revenue',
            value: '₹' + (bookingStats.revenue || 0).toFixed(2),
            icon: 'indianrupeesign.circle.fill',
            color: '#10b981',
            bg: '#d1fae5',
            subtitle: `${bookingStats.completed || 0} completed`
        },
        {
            title: t.activeServices || 'Active Services',
            value: '5',
            icon: 'square.grid.2x2.fill',
            color: '#3b82f6',
            bg: '#dbeafe'
        },
        {
            title: t.pendingRequests || 'Pending Requests',
            value: String(bookingStats.pending || 0),
            icon: 'tray.full.fill',
            color: '#8b5cf6',
            bg: '#ede9fe'
        },
    ];

    useEffect(() => {
        setStats(defaultStats);
    }, [bookingStats]);

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { backgroundColor: background }]} showsVerticalScrollIndicator={false}>
                <View style={[styles.header, { backgroundColor: card }]}>
                    <Text style={[styles.headerTitle, { color: textColor }]}>{t.businessDashboard || 'Business Dashboard'}</Text>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={tint} />
                    </View>
                ) : (
                    <>
                        <View style={styles.statsGrid}>
                            {stats.map((s, i) => (
                                <View key={i} style={[styles.statCard, { backgroundColor: card }]}>
                                    <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                                        <IconSymbol name={s.icon as any} size={24} color={s.color} />
                                    </View>
                                    <Text style={[styles.statValue, { color: textColor }]}>{s.value}</Text>
                                    <Text style={[styles.statTitle, { color: muted }]}>{s.title}</Text>
                                    {s.subtitle && <Text style={[styles.statSubtitle, { color: muted }]}>{s.subtitle}</Text>}
                                </View>
                            ))}
                        </View>

                        <View style={[styles.statusBreakdown, { backgroundColor: card, borderColor: muted }]}>
                            <Text style={[styles.statusTitle, { color: textColor }]}>{t.bookingStatus || 'Booking Status'}</Text>
                            <View style={styles.statusRow}>
                                <View style={styles.statusItem}>
                                    <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
                                    <Text style={[styles.statusLabel, { color: muted }]}>{t.confirmed || 'Confirmed'}</Text>
                                    <Text style={[styles.statusValue, { color: '#10b981' }]}>{bookingStats.confirmed || 0}</Text>
                                </View>
                                <View style={styles.statusItem}>
                                    <View style={[styles.statusDot, { backgroundColor: '#3b82f6' }]} />
                                    <Text style={[styles.statusLabel, { color: muted }]}>{t.inProgress || 'In Progress'}</Text>
                                    <Text style={[styles.statusValue, { color: '#3b82f6' }]}>{bookingStats.in_progress || 0}</Text>
                                </View>
                                <View style={styles.statusItem}>
                                    <View style={[styles.statusDot, { backgroundColor: '#ef4444' }]} />
                                    <Text style={[styles.statusLabel, { color: muted }]}>{t.cancelled || 'Cancelled'}</Text>
                                    <Text style={[styles.statusValue, { color: '#ef4444' }]}>{bookingStats.cancelled || 0}</Text>
                                </View>
                            </View>
                        </View>

                        <Text style={[styles.sectionTitle, { color: textColor }]}>{t.quickActions || 'Quick Actions'}</Text>
                        <View style={styles.quickActionsGrid}>
                            <TouchableOpacity style={[styles.actionCard, { backgroundColor: card, borderColor: '#10b981' }]} onPress={() => router.push('/(business)/(stack)/add-place' as any)}>
                                <View style={styles.actionIconWrapper}>
                                    <IconSymbol name="map.fill" size={28} color="#10b981" />
                                </View>
                                <Text style={[styles.actionText, { color: textColor }]}>{t.addPlace || 'Add Place'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionCard, { backgroundColor: card, borderColor: tint }]} onPress={() => router.push('/(business)/(stack)/add-service' as any)}>
                                <View style={styles.actionIconWrapper}>
                                    <IconSymbol name="plus.circle.fill" size={28} color={tint} />
                                </View>
                                <Text style={[styles.actionText, { color: textColor }]}>{t.addService || 'Add Service'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionCard, { backgroundColor: card, borderColor: '#f59e0b' }]} onPress={() => router.push('/(business)/(stack)/add-event' as any)}>
                                <View style={styles.actionIconWrapper}>
                                    <IconSymbol name="calendar.badge.plus" size={28} color="#f59e0b" />
                                </View>
                                <Text style={[styles.actionText, { color: textColor }]}>{t.addEvent || 'Add Event'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionCard, { backgroundColor: card, borderColor: '#ef4444' }]} onPress={() => router.push('/(business)/bookings' as any)}>
                                <View style={styles.actionIconWrapper}>
                                    <IconSymbol name="ticket.fill" size={28} color="#ef4444" />
                                </View>
                                <Text style={[styles.actionText, { color: textColor }]}>{t.bookings || 'Bookings'}</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, borderBottomWidth: 0 },
    headerTitle: { fontSize: 28, fontWeight: '700' },
    profileBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    scroll: { flex: 1 },
    content: { padding: 20, paddingBottom: 100 },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: 300,
        marginTop: 100
    },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    statCard: { width: '48%', borderRadius: 16, padding: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8 },
    statIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    statValue: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
    statTitle: { fontSize: 13, fontWeight: '600' },
    statSubtitle: { fontSize: 11, marginTop: 2, fontWeight: '500' },
    statusBreakdown: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8
    },
    statusTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    statusItem: { alignItems: 'center', flex: 1, backgroundColor: 'rgba(0,0,0,0.02)', padding: 12, borderRadius: 12 },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
    statusLabel: { fontSize: 11, marginBottom: 6, fontWeight: '600' },
    statusValue: { fontSize: 20, fontWeight: '700' },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, marginTop: 8 },
    quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    actionCard: { width: '48%', borderRadius: 14, padding: 16, alignItems: 'center', gap: 8, borderWidth: 2, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    actionIconWrapper: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.04)' },
    actionText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
