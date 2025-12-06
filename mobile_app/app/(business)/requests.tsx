import { IconSymbol } from '@/components/ui/icon-symbol';
import { getLanguageTranslations } from '@/constants/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { bookingsService } from '@/services/bookings.service';
import { OrderModel } from '@/services/orders.service';
import { businessService, BusinessModel } from '@/services/business.service';
import { useFocusEffect } from '@react-navigation/native';

export default function BusinessRequests() {
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const [requests, setRequests] = useState<OrderModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [businesses, setBusinesses] = useState<BusinessModel[]>([]);

    const iconFor = (payment: string) => payment === 'pending' ? 'hourglass.bottomhalf.fill' : 'arrow.uturn.left';
    const colorFor = (payment: string) => payment === 'pending' ? '#f59e0b' : '#10b981';
    const bgFor = (payment: string) => payment === 'pending' ? '#fef3c7' : '#d1fae5';

    useFocusEffect(
        React.useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        setLoading(true);
        try {
            // Load user's businesses
            const bizResp = await businessService.mine({ skip: 0, limit: 50 });
            if (bizResp.success && bizResp.data) {
                setBusinesses(bizResp.data);
                // Load pending bookings for all businesses
                await loadPendingRequests(bizResp.data);
            }
        } catch (error) {
            console.error('Failed to load requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadPendingRequests = async (businesses: BusinessModel[]) => {
        try {
            const allRequests: OrderModel[] = [];
            for (const biz of businesses) {
                // Get pending payment bookings
                const resp = await bookingsService.getBusinessBookings(biz.id, {
                    skip: 0,
                    limit: 100,
                    payment_status: 'pending'
                });
                if (resp.success && resp.data) {
                    allRequests.push(...resp.data);
                }
            }
            setRequests(allRequests);
        } catch (error) {
            console.error('Failed to load requests:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            const bizResp = await businessService.mine({ skip: 0, limit: 50 });
            if (bizResp.success && bizResp.data) {
                setBusinesses(bizResp.data);
                await loadPendingRequests(bizResp.data);
            }
        } catch (error) {
            console.error('Refresh failed:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleApprove = async (request: OrderModel) => {
        try {
            // Use the business_id from the request itself
            const resp = await bookingsService.confirmBooking(request.business_id, request.id);
            if (resp.success) {
                Alert.alert(t.success || 'Success', t.approved || 'Request approved');
                loadData();
            }
        } catch (error: any) {
            Alert.alert(t.error || 'Error', error.message || 'Failed to approve');
        }
    };

    const handleReject = async (request: OrderModel) => {
        Alert.alert(
            t.reject || 'Reject Request',
            t.confirmReject || 'Are you sure?',
            [
                { text: t.no || 'No', style: 'cancel' },
                {
                    text: t.yes || 'Yes',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Use the business_id from the request itself
                            const resp = await bookingsService.cancelBooking(request.business_id, request.id);
                            if (resp.success) {
                                Alert.alert(t.success || 'Success', t.rejected || 'Request rejected');
                                loadData();
                            }
                        } catch (error: any) {
                            Alert.alert(t.error || 'Error', error.message || 'Failed to reject');
                        }
                    }
                }
            ]
        );
    };

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const textColor = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    const getTimeAgo = (date: string) => {
        const now = new Date();
        const then = new Date(date);
        const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
        if (diff < 60) return t.justNow || 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ${t.ago || 'ago'}`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ${t.ago || 'ago'}`;
        return `${Math.floor(diff / 86400)}d ${t.ago || 'ago'}`;
    };

    const getRequestTitle = (request: OrderModel) => {
        if (request.payment_status === 'pending') {
            return t.newBooking || 'New Booking Request';
        }
        return t.bookingRequest || 'Booking Request';
    };

    const getRequestDetail = (request: OrderModel) => {
        return `${t.amount || 'Amount'}: ₹${request.amount} • ${new Date(request.created_at).toLocaleDateString()}`;
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.content, { backgroundColor: background }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={[styles.header, { backgroundColor: card }]}>
                    <Text style={[styles.headerTitle, { color: textColor }]}>{t.requests || 'Requests'}</Text>
                </View>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={tint} />
                    </View>
                ) : requests.length === 0 ? (
                    <View style={[styles.emptyCard, { backgroundColor: card }]}>
                        <IconSymbol name="tray" size={48} color={muted} />
                        <Text style={[styles.emptyText, { color: muted }]}>{t.noRequests || 'No pending requests'}</Text>
                    </View>
                ) : (
                    requests.map((r) => (
                        <View key={r.id} style={[styles.card, { backgroundColor: card }]}>
                            <View style={styles.row}>
                                <View style={[styles.iconWrap, { backgroundColor: bgFor(r.payment_status) }]}>
                                    <IconSymbol name={iconFor(r.payment_status) as any} size={20} color={colorFor(r.payment_status)} />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={[styles.title, { color: textColor }]}>{getRequestTitle(r)}</Text>
                                    <Text style={[styles.detail, { color: muted }]}>{getRequestDetail(r)}</Text>
                                    <Text style={[styles.time, { color: muted }]}>{getTimeAgo(r.created_at)}</Text>
                                </View>
                                <IconSymbol name="chevron.right" size={18} color="#9ca3af" />
                            </View>
                            <View style={styles.actions}>
                                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: tint }]} onPress={() => handleApprove(r)}>
                                    <IconSymbol name="checkmark" size={16} color="#fff" />
                                    <Text style={styles.actionText}>{t.approve || 'Approve'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ef4444' }]} onPress={() => handleReject(r)}>
                                    <IconSymbol name="xmark" size={16} color="#fff" />
                                    <Text style={styles.actionText}>{t.reject || 'Reject'}</Text>
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
    container: { flex: 1 },
    header: { padding: 20, paddingTop: 60, borderBottomWidth: 0 },
    headerTitle: { fontSize: 28, fontWeight: '700' },
    scroll: { flex: 1 },
    content: { padding: 16, paddingBottom: 100 },
    card: { borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    row: { flexDirection: 'row', alignItems: 'center' },
    iconWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 15, fontWeight: '700' },
    detail: { fontSize: 13, marginTop: 2 },
    time: { fontSize: 12, marginTop: 4 },
    actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, flex: 1 },
    actionText: { fontSize: 13, fontWeight: '600', color: '#fff' },
    loadingContainer: { paddingVertical: 60, alignItems: 'center' },
    emptyCard: { borderRadius: 12, padding: 40, alignItems: 'center', marginTop: 40 },
    emptyText: { fontSize: 16, fontWeight: '600', marginTop: 16 },
});
