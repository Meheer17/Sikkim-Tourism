import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { DashboardStats, RecentActivity } from '@/types/admin.types';

// Mock data - replace with actual API calls
const MOCK_STATS: DashboardStats = {
    totalUsers: 1247,
    totalBusinesses: 89,
    totalPlaces: 156,
    totalBookings: 3421,
    revenue: 2456789,
    activeUsers: 892,
    pendingApprovals: 12,
};

const MOCK_ACTIVITIES: RecentActivity[] = [
    {
        id: '1',
        type: 'user_registered',
        title: 'New User Registration',
        description: 'John Doe joined the platform',
        timestamp: '2 minutes ago',
        userName: 'John Doe',
    },
    {
        id: '2',
        type: 'business_created',
        title: 'New Business Added',
        description: 'Mountain Trek Adventures added by Sarah Wilson',
        timestamp: '15 minutes ago',
        userName: 'Sarah Wilson',
    },
    {
        id: '3',
        type: 'place_added',
        title: 'New Place Created',
        description: 'Khecheopalri Lake added to explore',
        timestamp: '1 hour ago',
    },
    {
        id: '4',
        type: 'booking_made',
        title: 'New Booking',
        description: 'Cable Car Ride booked by Mike Chen',
        timestamp: '2 hours ago',
        userName: 'Mike Chen',
    },
    {
        id: '5',
        type: 'review_posted',
        title: 'New Review',
        description: '5-star review for Rumtek Monastery',
        timestamp: '3 hours ago',
    },
];

interface StatCardData {
    title: string;
    value: string;
    icon: string;
    color: string;
    bgColor: string;
    change?: string;
    changeType?: 'increase' | 'decrease';
}

export default function AdminDashboardScreen() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats>(MOCK_STATS);
    const [activities, setActivities] = useState<RecentActivity[]>(MOCK_ACTIVITIES);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        // TODO: Replace with actual API calls
        // const statsData = await apiClient.get('/admin/stats');
        // const activitiesData = await apiClient.get('/admin/activities');
        setStats(MOCK_STATS);
        setActivities(MOCK_ACTIVITIES);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadDashboardData();
        setRefreshing(false);
    };

    const statCards: StatCardData[] = [
        {
            title: 'Total Users',
            value: stats.totalUsers.toLocaleString(),
            icon: 'person.2.fill',
            color: '#3b82f6',
            bgColor: '#dbeafe',
            change: '+12%',
            changeType: 'increase',
        },
        {
            title: 'Businesses',
            value: stats.totalBusinesses.toString(),
            icon: 'building.2.fill',
            color: '#8b5cf6',
            bgColor: '#ede9fe',
            change: '+5%',
            changeType: 'increase',
        },
        {
            title: 'Places',
            value: stats.totalPlaces.toString(),
            icon: 'map.fill',
            color: '#10b981',
            bgColor: '#d1fae5',
            change: '+8%',
            changeType: 'increase',
        },
        {
            title: 'Bookings',
            value: stats.totalBookings.toLocaleString(),
            icon: 'ticket.fill',
            color: '#f59e0b',
            bgColor: '#fef3c7',
            change: '+18%',
            changeType: 'increase',
        },
        {
            title: 'Revenue',
            value: `₹${(stats.revenue / 100000).toFixed(1)}L`,
            icon: 'indianrupeesign.circle.fill',
            color: '#ef4444',
            bgColor: '#fee2e2',
            change: '+23%',
            changeType: 'increase',
        },
        {
            title: 'Active Users',
            value: stats.activeUsers.toString(),
            icon: 'person.circle.fill',
            color: '#06b6d4',
            bgColor: '#cffafe',
            change: '+7%',
            changeType: 'increase',
        },
    ];

    const getActivityIcon = (type: RecentActivity['type']) => {
        switch (type) {
            case 'user_registered':
                return 'person.badge.plus';
            case 'business_created':
                return 'building.2.fill';
            case 'place_added':
                return 'mappin.circle.fill';
            case 'booking_made':
                return 'ticket.fill';
            case 'review_posted':
                return 'star.fill';
            default:
                return 'bell.fill';
        }
    };

    const getActivityColor = (type: RecentActivity['type']) => {
        switch (type) {
            case 'user_registered':
                return '#3b82f6';
            case 'business_created':
                return '#8b5cf6';
            case 'place_added':
                return '#10b981';
            case 'booking_made':
                return '#f59e0b';
            case 'review_posted':
                return '#ef4444';
            default:
                return '#687076';
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Admin Dashboard</Text>
                    <Text style={styles.headerSubtitle}>Welcome back, Admin</Text>
                </View>
                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => router.push('/(admin)/profile' as any)}
                >
                    <IconSymbol name="person.circle.fill" size={32} color="#0a7ea4" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Pending Approvals Alert */}
                {stats.pendingApprovals > 0 && (
                    <TouchableOpacity
                        style={styles.alertCard}
                        onPress={() => {/* Navigate to approvals */ }}
                    >
                        <View style={styles.alertIcon}>
                            <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#f59e0b" />
                        </View>
                        <View style={styles.alertContent}>
                            <Text style={styles.alertTitle}>Pending Approvals</Text>
                            <Text style={styles.alertText}>
                                {stats.pendingApprovals} items need your attention
                            </Text>
                        </View>
                        <IconSymbol name="chevron.right" size={20} color="#687076" />
                    </TouchableOpacity>
                )}

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    {statCards.map((stat, index) => (
                        <View key={index} style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: stat.bgColor }]}>
                                <IconSymbol name={stat.icon as any} size={24} color={stat.color} />
                            </View>
                            <Text style={styles.statValue}>{stat.value}</Text>
                            <Text style={styles.statTitle}>{stat.title}</Text>
                            {stat.change && (
                                <View style={styles.statChange}>
                                    <IconSymbol
                                        name={stat.changeType === 'increase' ? 'arrow.up' : 'arrow.down'}
                                        size={12}
                                        color={stat.changeType === 'increase' ? '#10b981' : '#ef4444'}
                                    />
                                    <Text
                                        style={[
                                            styles.statChangeText,
                                            {
                                                color: stat.changeType === 'increase' ? '#10b981' : '#ef4444',
                                            },
                                        ]}
                                    >
                                        {stat.change}
                                    </Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => router.push('/(admin)/businesses' as any)}
                        >
                            <IconSymbol name="plus.circle.fill" size={32} color="#0a7ea4" />
                            <Text style={styles.actionText}>Add Business</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => router.push('/(admin)/places' as any)}
                        >
                            <IconSymbol name="plus.circle.fill" size={32} color="#10b981" />
                            <Text style={styles.actionText}>Add Place</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => router.push('/(admin)/users' as any)}
                        >
                            <IconSymbol name="person.badge.plus.fill" size={32} color="#8b5cf6" />
                            <Text style={styles.actionText}>Manage Users</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => router.push('/(admin)/roles' as any)}
                        >
                            <IconSymbol name="person.badge.key.fill" size={32} color="#f59e0b" />
                            <Text style={styles.actionText}>Assign Roles</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Recent Activity */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Activity</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAllText}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.activityList}>
                        {activities.map((activity) => (
                            <View key={activity.id} style={styles.activityItem}>
                                <View
                                    style={[
                                        styles.activityIcon,
                                        { backgroundColor: `${getActivityColor(activity.type)}20` },
                                    ]}
                                >
                                    <IconSymbol
                                        name={getActivityIcon(activity.type) as any}
                                        size={20}
                                        color={getActivityColor(activity.type)}
                                    />
                                </View>
                                <View style={styles.activityContent}>
                                    <Text style={styles.activityTitle}>{activity.title}</Text>
                                    <Text style={styles.activityDescription}>
                                        {activity.description}
                                    </Text>
                                    <Text style={styles.activityTime}>{activity.timestamp}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
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
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#11181C',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#687076',
    },
    profileButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    alertCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fffbeb',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#fde68a',
    },
    alertIcon: {
        marginRight: 12,
    },
    alertContent: {
        flex: 1,
    },
    alertTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#92400e',
        marginBottom: 2,
    },
    alertText: {
        fontSize: 14,
        color: '#b45309',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#11181C',
        marginBottom: 4,
    },
    statTitle: {
        fontSize: 13,
        color: '#687076',
        marginBottom: 8,
    },
    statChange: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statChangeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#11181C',
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0a7ea4',
    },
    quickActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    actionCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#11181C',
        textAlign: 'center',
    },
    activityList: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
    },
    activityItem: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    activityIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    activityContent: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#11181C',
        marginBottom: 4,
    },
    activityDescription: {
        fontSize: 13,
        color: '#687076',
        marginBottom: 4,
    },
    activityTime: {
        fontSize: 12,
        color: '#9ca3af',
    },
});
