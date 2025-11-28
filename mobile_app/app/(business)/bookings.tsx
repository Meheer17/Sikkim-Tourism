import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function BusinessBookings() {
    const bookings = [
        { id: 'b1', service: 'Cab Ride', customer: 'John Doe', date: 'Nov 28, 2025', status: 'confirmed', amount: 800 },
        { id: 'b2', service: 'Trekking', customer: 'Sara', date: 'Nov 29, 2025', status: 'pending', amount: 2500 },
    ];

    const statusColor = (s: string) => s === 'confirmed' ? '#10b981' : s === 'pending' ? '#f59e0b' : '#ef4444';
    const statusBg = (s: string) => s === 'confirmed' ? '#d1fae5' : s === 'pending' ? '#fef3c7' : '#fee2e2';

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Bookings</Text>
            </View>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
                {bookings.map(b => (
                    <View key={b.id} style={styles.card}>
                        <View style={styles.row}>
                            <Text style={styles.service}>{b.service}</Text>
                            <View style={[styles.badge, { backgroundColor: statusBg(b.status) }]}>
                                <Text style={[styles.badgeText, { color: statusColor(b.status) }]}>{b.status}</Text>
                            </View>
                        </View>
                        <Text style={styles.subText}>Customer: {b.customer}</Text>
                        <View style={styles.row}>
                            <Text style={styles.subText}>{b.date}</Text>
                            <Text style={styles.amount}>₹{b.amount}</Text>
                        </View>
                        <View style={styles.actions}>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10b981' }]}>
                                <IconSymbol name="checkmark" size={16} color="#fff" />
                                <Text style={styles.actionText}>Confirm</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}>
                                <IconSymbol name="xmark" size={16} color="#fff" />
                                <Text style={styles.actionText}>Cancel</Text>
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
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    service: { fontSize: 16, fontWeight: '700', color: '#11181C' },
    subText: { fontSize: 13, color: '#687076', marginTop: 4 },
    amount: { fontSize: 18, fontWeight: '700', color: '#0a7ea4' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
    actionText: { fontSize: 13, fontWeight: '600', color: '#fff' },
});
