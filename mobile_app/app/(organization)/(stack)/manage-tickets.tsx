import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function OrgManageTickets() {
    const router = useRouter();
    const items = [
        { id: 't1', title: 'Monastery Entry', price: 50, stock: 100, sold: 230 },
        { id: 't2', title: 'Cultural Night', price: 200, stock: 50, sold: 450 },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.back} onPress={() => router.back()}>
                    <IconSymbol name="chevron.left" size={24} color="#11181C" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manage Tickets</Text>
                <TouchableOpacity style={styles.add}><IconSymbol name="plus" size={18} color="#fff" /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                {items.map(i => (
                    <View key={i.id} style={styles.card}>
                        <View style={styles.row}>
                            <Text style={styles.title}>{i.title}</Text>
                            <Text style={styles.price}>₹{i.price}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.meta}>Stock {i.stock}</Text>
                            <View style={styles.row}><IconSymbol name="ticket.fill" size={16} color="#687076" /><Text style={styles.meta}> Sold {i.sold}</Text></View>
                        </View>
                        <View style={styles.actions}>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#0a7ea4' }]}>
                                <IconSymbol name="pencil" size={16} color="#fff" />
                                <Text style={styles.actionText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}>
                                <IconSymbol name="trash" size={16} color="#fff" />
                                <Text style={styles.actionText}>Delete</Text>
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
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    back: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#11181C' },
    add: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#0a7ea4', alignItems: 'center', justifyContent: 'center' },
    content: { padding: 16, paddingBottom: 120 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 16, fontWeight: '700', color: '#11181C' },
    price: { fontSize: 18, fontWeight: '700', color: '#0a7ea4' },
    meta: { fontSize: 13, color: '#687076' },
    actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
    actionText: { fontSize: 13, fontWeight: '600', color: '#fff' },
});
