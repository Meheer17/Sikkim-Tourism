import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { DashboardStats, RecentActivity } from '@/types/admin.types';
import { useApi } from '@/hooks/useApi';
import { useThemeColor } from '@/hooks/use-theme-color';

// Removed all static mock data. Dashboard now initializes empty and awaits API.

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
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        totalBusinesses: 0,
        totalPlaces: 0,
        totalBookings: 0,
        revenue: 0,
        activeUsers: 0,
        pendingApprovals: 0,
    });
    const [activities, setActivities] = useState<RecentActivity[]>([]);
    const [loadingStats, setLoadingStats] = useState<boolean>(true);
    const [loadingActivities, setLoadingActivities] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState(false);
    const { get: getStats } = useApi<DashboardStats>();
    const { get: getActivities } = useApi<RecentActivity[]>();
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    const loadDashboardData = useCallback(async () => {
        try {
            // Load stats (endpoint may not exist yet)
            try {
                const raw: any = await getStats('/admin/stats');
                if (raw) {
                    const mapped: DashboardStats = {
                        totalUsers: raw.total_users || 0,
                        totalBusinesses: raw.total_businesses || 0,
                        totalPlaces: raw.total_locations || 0,
                        totalBookings: 0,
                        revenue: 0,
                        activeUsers: raw.active_users || 0,
                        pendingApprovals: raw.pending_approvals || 0,
                    };
                    setStats(mapped);
                }
            } catch (e) {
                console.warn('Stats fetch failed');
            } finally {
                setLoadingStats(false);
            }
        } catch (error) {
            setLoadingStats(false);
        }

        try {
            // Load activities (endpoint may not exist yet)
            try {
                const activitiesData = await getActivities('/admin/activities');
                if (activitiesData) {
                    setActivities(activitiesData);
                }
            } catch (e) {
                console.warn('Activities fetch failed');
            } finally {
                setLoadingActivities(false);
            }
        } catch (error) {
            setLoadingActivities(false);
        }
    }, [getStats, getActivities]);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

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
        <View style={[styles.container, { backgroundColor: background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: card }]}>
                <View>
                    <Text style={[styles.headerTitle, { color: text }]}>Admin Dashboard</Text>
                    <Text style={[styles.headerSubtitle, { color: muted }]}>Welcome back, Admin</Text>
                </View>
                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => router.push('/(admin)/profile' as any)}
                >
                    <IconSymbol name="person.circle.fill" size={32} color={tint} />
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
                {!loadingStats && stats.pendingApprovals > 0 && (
                    <TouchableOpacity
                        style={[styles.alertCard, { backgroundColor: card }]}
                        onPress={() => router.push('/(admin)/approvals' as any)}
                    >
                        <View style={styles.alertIcon}>
                            <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#f59e0b" />
                        </View>
                        <View style={styles.alertContent}>
                            <Text style={[styles.alertTitle, { color: text }]}>Pending Approvals</Text>
                            <Text style={[styles.alertText, { color: muted }]}> {stats.pendingApprovals} items need your attention</Text>
                        </View>
                        <IconSymbol name="chevron.right" size={20} color={muted} />
                    </TouchableOpacity>
                )}

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    {statCards.map((stat, index) => (
                        <View key={index} style={[styles.statCard, { backgroundColor: card }]}>
                            <View style={[styles.statIcon, { backgroundColor: stat.bgColor }]}>
                                <IconSymbol name={stat.icon as any} size={24} color={stat.color} />
                            </View>
                            <Text style={[styles.statValue, { color: text }]}>{stat.value}</Text>
                            <Text style={[styles.statTitle, { color: muted }]}>{stat.title}</Text>
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
                    <Text style={[styles.sectionTitle, { color: text }]}>Quick Actions</Text>
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: card }]}
                            onPress={() => router.push('/(admin)/approvals' as any)}
                        >
                            <IconSymbol name="checkmark.seal.fill" size={32} color="#f59e0b" />
                            <Text style={[styles.actionText, { color: text }]}>Approvals</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: card }]}
                            onPress={() => router.push('/(admin)/businesses' as any)}
                        >
                            <IconSymbol name="plus.circle.fill" size={32} color={tint} />
                            <Text style={[styles.actionText, { color: text }]}>Add Business</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: card }]}
                            onPress={() => router.push('/(admin)/places' as any)}
                        >
                            <IconSymbol name="plus.circle.fill" size={32} color="#10b981" />
                            <Text style={[styles.actionText, { color: text }]}>Add Place</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: card }]}
                            onPress={() => router.push('/(admin)/users' as any)}
                        >
                            <IconSymbol name="person.badge.plus.fill" size={32} color="#8b5cf6" />
                            <Text style={[styles.actionText, { color: text }]}>Manage Users</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: card }]}
                            onPress={() => router.push('/(admin)/roles' as any)}
                        >
                            <IconSymbol name="person.badge.key.fill" size={32} color="#f59e0b" />
                            <Text style={[styles.actionText, { color: text }]}>Assign Roles</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Recent Activity */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: text }]}>Recent Activity</Text>
                        <TouchableOpacity>
                            <Text style={[styles.seeAllText, { color: tint }]}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.activityList}>
                        {loadingActivities && (
                            <View style={styles.activityItem}><Text style={[styles.activityDescription, { color: muted }]}>Loading activity...</Text></View>
                        )}
                        {!loadingActivities && activities.length === 0 && (
                            <View style={styles.activityItem}><Text style={[styles.activityDescription, { color: muted }]}>No recent activity.</Text></View>
                        )}
                        {!loadingActivities && activities.map((activity) => (
                            <View key={activity.id} style={[styles.activityItem, { backgroundColor: card }]}>
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
                                    <Text style={[styles.activityTitle, { color: text }]}>{activity.title}</Text>
                                    <Text style={[styles.activityDescription, { color: muted }]}>
                                        {activity.description}
                                    </Text>
                                    <Text style={[styles.activityTime, { color: muted }]}>{activity.timestamp}</Text>
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
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 4,
    },
    headerSubtitle: {
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
        marginBottom: 4,
    },
    statTitle: {
        fontSize: 13,
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
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '600',
    },
    quickActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    actionCard: {
        width: '48%',
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
        textAlign: 'center',
    },
    activityList: {
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
        marginBottom: 4,
    },
    activityDescription: {
        fontSize: 13,
        marginBottom: 4,
    },
    activityTime: {
        fontSize: 12,
    },
});
