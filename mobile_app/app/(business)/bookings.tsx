import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function BusinessBookings() {
    const bookings = [
        { id: 'b1', service: 'Cab Ride', customer: 'John Doe', date: 'Nov 28, 2025', status: 'confirmed', amount: 800 },
        { id: 'b2', service: 'Trekking', customer: 'Sara', date: 'Nov 29, 2025', status: 'pending', amount: 2500 },
    ];

    const statusColor = (s: string) => s === 'confirmed' ? '#10b981' : s === 'pending' ? '#f59e0b' : '#ef4444';
    const statusBg = (s: string) => s === 'confirmed' ? '#d1fae5' : s === 'pending' ? '#fef3c7' : '#fee2e2';

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const textColor = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');
    return (
        <View style={styles.container}>
            <ScrollView style={styles.scroll} contentContainerStyle={[styles.content,{backgroundColor:background}]}>
                <View style={[styles.header,{backgroundColor:card}]}>
                    <Text style={[styles.headerTitle,{color:textColor}]}>Bookings</Text>
                </View>
                {bookings.map(b => (
                    <View key={b.id} style={[styles.card,{backgroundColor:card}]}>
                        <View style={styles.row}>
                            <Text style={[styles.service,{color:textColor}]}>{b.service}</Text>
                            <View style={[styles.badge, { backgroundColor: statusBg(b.status) }]}>
                                <Text style={[styles.badgeText, { color: statusColor(b.status) }]}>{b.status}</Text>
                            </View>
                        </View>
                        <Text style={[styles.subText,{color:muted}]}>Customer: {b.customer}</Text>
                        <View style={styles.row}>
                            <Text style={[styles.subText,{color:muted}]}>{b.date}</Text>
                            <Text style={[styles.amount,{color:tint}]}>₹{b.amount}</Text>
                        </View>
                        <View style={styles.actions}>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: tint }]}>
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
    container: { flex: 1 },
    header: { padding: 20, paddingTop: 60, borderBottomWidth: 0 },
    headerTitle: { fontSize: 28, fontWeight: '700' },
    scroll: { flex: 1 },
    content: { padding: 16, paddingBottom: 100 },
    card: { borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    service: { fontSize: 16, fontWeight: '700' },
    subText: { fontSize: 13, marginTop: 4 },
    amount: { fontSize: 18, fontWeight: '700' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
    actionText: { fontSize: 13, fontWeight: '600', color: '#fff' },
});
