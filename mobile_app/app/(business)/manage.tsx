import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/theme';
import BusinessBookings from './bookings';
import BusinessRequests from './requests';

export default function BusinessManage() {
    const [tab, setTab] = useState<'bookings' | 'requests'>('bookings');

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Manage</Text>
                <Text style={styles.headerSub}>Bookings are confirmed reservations. Requests are items awaiting your approval (new bookings, changes, refunds, special quotes).</Text>
            </View>

            <View style={styles.switchRow}>
                <TouchableOpacity
                    style={[styles.switchBtn, tab === 'bookings' && styles.switchBtnActive]}
                    onPress={() => setTab('bookings')}
                >
                    <Text style={[styles.switchText, tab === 'bookings' && styles.switchTextActive]}>Bookings</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.switchBtn, tab === 'requests' && styles.switchBtnActive]}
                    onPress={() => setTab('requests')}
                >
                    <Text style={[styles.switchText, tab === 'requests' && styles.switchTextActive]}>Requests</Text>
                </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
                {tab === 'bookings' ? <BusinessBookings /> : <BusinessRequests />}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: { padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    headerTitle: { fontSize: 28, fontWeight: '700', color: '#11181C' },
    headerSub: { fontSize: 13, color: '#687076', marginTop: 6 },
    switchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    switchBtn: { flex: 1, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', alignItems: 'center' },
    switchBtnActive: { backgroundColor: '#e0f2fe', borderColor: '#38bdf8' },
    switchText: { fontSize: 13, color: '#334155', fontWeight: '600' },
    switchTextActive: { color: Colors.tint },
});
