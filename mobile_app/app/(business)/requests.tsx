import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function BusinessRequests() {
    const requests = [
        { id: 'r1', type: 'service_approval', title: 'New Service Approval', detail: 'Approve "City Cab Premium"', time: '2h ago' },
        { id: 'r2', type: 'booking_refund', title: 'Refund Request', detail: 'Refund for booking #B1234', time: '1d ago' },
    ];

    const iconFor = (t: string) => t === 'service_approval' ? 'checkmark.seal.fill' : 'arrow.uturn.left';
    const colorFor = (t: string) => t === 'service_approval' ? '#10b981' : '#f59e0b';
    const bgFor = (t: string) => t === 'service_approval' ? '#d1fae5' : '#fef3c7';

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Requests</Text>
            </View>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
                {requests.map(r => (
                    <View key={r.id} style={styles.card}>
                        <View style={styles.row}>
                            <View style={[styles.iconWrap, { backgroundColor: bgFor(r.type) }]}>
                                <IconSymbol name={iconFor(r.type) as any} size={20} color={colorFor(r.type)} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.title}>{r.title}</Text>
                                <Text style={styles.detail}>{r.detail}</Text>
                                <Text style={styles.time}>{r.time}</Text>
                            </View>
                            <IconSymbol name="chevron.right" size={18} color="#9ca3af" />
                        </View>
                        <View style={styles.actions}>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10b981' }]}>
                                <IconSymbol name="checkmark" size={16} color="#fff" />
                                <Text style={styles.actionText}>Approve</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}>
                                <IconSymbol name="xmark" size={16} color="#fff" />
                                <Text style={styles.actionText}>Reject</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: { padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    headerTitle: { fontSize: 28, fontWeight: '700', color: '#11181C' },
    scroll: { flex: 1 },
    content: { padding: 16, paddingBottom: 100 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    row: { flexDirection: 'row', alignItems: 'center' },
    iconWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 15, fontWeight: '700', color: '#11181C' },
    detail: { fontSize: 13, color: '#687076', marginTop: 2 },
    time: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
    actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
    actionText: { fontSize: 13, fontWeight: '600', color: '#fff' },
});
