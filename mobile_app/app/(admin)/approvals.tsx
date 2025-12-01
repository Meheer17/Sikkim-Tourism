import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { businessService, BusinessModel } from '@/services/business.service';
import { useRouter } from 'expo-router';

export default function ApprovalsScreen() {
    const router = useRouter();
    const [pendingBusinesses, setPendingBusinesses] = useState<BusinessModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');
    const border = useThemeColor('border');

    useEffect(() => {
        loadPendingApprovals();
    }, []);

    const loadPendingApprovals = async () => {
        try {
            setLoading(true);
            const response = await businessService.list({ skip: 0, limit: 100 });
            const businesses = response.data || [];

            // Filter for pending approvals
            const pending = businesses.filter(b => !b.approved);
            setPendingBusinesses(pending);
        } catch (error) {
            console.error('Failed to load pending approvals:', error);
            Alert.alert('Error', 'Failed to load pending approvals');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadPendingApprovals();
        setRefreshing(false);
    };

    const handleApprove = async (business: BusinessModel) => {
        Alert.alert(
            'Approve Business',
            `Are you sure you want to approve "${business.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: async () => {
                        try {
                            await businessService.approve(business._id);
                            Alert.alert('Success', 'Business approved successfully');
                            loadPendingApprovals();
                        } catch (error: any) {
                            console.error('Failed to approve business:', error);
                            Alert.alert('Error', error.response?.data?.detail || 'Failed to approve business');
                        }
                    },
                },
            ]
        );
    };

    const handleReject = async (business: BusinessModel) => {
        Alert.alert(
            'Reject Business',
            `Are you sure you want to reject "${business.name}"? This will delete the business.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await businessService.remove(business._id);
                            Alert.alert('Success', 'Business rejected and deleted');
                            loadPendingApprovals();
                        } catch (error: any) {
                            console.error('Failed to reject business:', error);
                            Alert.alert('Error', error.response?.data?.detail || 'Failed to reject business');
                        }
                    },
                },
            ]
        );
    };

    const handleViewDetails = (business: BusinessModel) => {
        router.push({
            pathname: '/(user)/(stack)/business-details',
            params: { id: business._id }
        } as any);
    };

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: card, borderBottomColor: border }]}>
                <Text style={[styles.headerTitle, { color: text }]}>Pending Approvals</Text>
                <View style={[styles.badge, { backgroundColor: '#fef3c7' }]}>
                    <Text style={[styles.badgeText, { color: '#f59e0b' }]}>{pendingBusinesses.length}</Text>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {loading ? (
                    <View style={styles.emptyState}>
                        <Text style={[styles.emptyText, { color: muted }]}>Loading...</Text>
                    </View>
                ) : pendingBusinesses.length === 0 ? (
                    <View style={styles.emptyState}>
                        <IconSymbol name="checkmark.circle.fill" size={64} color="#10b981" />
                        <Text style={[styles.emptyTitle, { color: text }]}>All caught up!</Text>
                        <Text style={[styles.emptyText, { color: muted }]}>No pending approvals at the moment</Text>
                    </View>
                ) : (
                    pendingBusinesses.map((business) => (
                        <View key={business._id} style={[styles.card, { backgroundColor: card, borderColor: border }]}>
                            {/* Type Badge */}
                            <View style={styles.cardHeader}>
                                <View style={[styles.typeBadge, { backgroundColor: '#dbeafe' }]}>
                                    <IconSymbol
                                        name={business.scheduled_at ? 'calendar' : 'building.2.fill'}
                                        size={14}
                                        color="#3b82f6"
                                    />
                                    <Text style={[styles.typeBadgeText, { color: '#3b82f6' }]}>
                                        {business.scheduled_at ? 'Event' : 'Service'}
                                    </Text>
                                </View>
                                <Text style={[styles.timestamp, { color: muted }]}>
                                    {new Date(business.created_at || '').toLocaleDateString()}
                                </Text>
                            </View>

                            {/* Business Info */}
                            <TouchableOpacity onPress={() => handleViewDetails(business)}>
                                <Text style={[styles.businessName, { color: text }]}>{business.name}</Text>
                                <Text style={[styles.businessDesc, { color: muted }]} numberOfLines={2}>
                                    {business.short_description || business.description}
                                </Text>
                                {business.scheduled_at && (
                                    <View style={styles.eventInfo}>
                                        <IconSymbol name="calendar" size={14} color={muted as string} />
                                        <Text style={[styles.eventDate, { color: muted }]}>
                                            {new Date(business.scheduled_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            {/* Actions */}
                            <View style={styles.actions}>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.approveButton, { backgroundColor: '#10b981' }]}
                                    onPress={() => handleApprove(business)}
                                >
                                    <IconSymbol name="checkmark" size={18} color="#fff" />
                                    <Text style={styles.actionButtonText}>Approve</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.rejectButton, { backgroundColor: '#ef4444' }]}
                                    onPress={() => handleReject(business)}
                                >
                                    <IconSymbol name="xmark" size={18} color="#fff" />
                                    <Text style={styles.actionButtonText}>Reject</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.viewButton, { borderColor: border }]}
                                    onPress={() => handleViewDetails(business)}
                                >
                                    <IconSymbol name="eye" size={18} color={tint as string} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
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
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    badgeText: {
        fontSize: 14,
        fontWeight: '700',
    },
    content: {
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
    emptyText: {
        fontSize: 15,
    },
    card: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    typeBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    timestamp: {
        fontSize: 12,
    },
    businessName: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 6,
    },
    businessDesc: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    eventInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    eventDate: {
        fontSize: 13,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        flex: 1,
    },
    approveButton: {},
    rejectButton: {},
    viewButton: {
        flex: 0,
        borderWidth: 1,
        paddingHorizontal: 12,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});
