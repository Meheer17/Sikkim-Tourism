import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function BusinessDashboard() {
    const router = useRouter();
    const stats = [
        { title: 'Today Bookings', value: '12', icon: 'ticket.fill', color: '#f59e0b', bg: '#fef3c7' },
        { title: 'Revenue', value: '₹32k', icon: 'indianrupeesign.circle.fill', color: '#10b981', bg: '#d1fae5' },
        { title: 'Active Services', value: '5', icon: 'square.grid.2x2.fill', color: '#3b82f6', bg: '#dbeafe' },
        { title: 'Pending Requests', value: '3', icon: 'tray.full.fill', color: '#8b5cf6', bg: '#ede9fe' },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Business Dashboard</Text>
                <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(business)/profile' as any)}>
                    <IconSymbol name="person.circle.fill" size={32} color="#0a7ea4" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.statsGrid}>
                    {stats.map((s, i) => (
                        <View key={i} style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                                <IconSymbol name={s.icon as any} size={24} color={s.color} />
                            </View>
                            <Text style={styles.statValue}>{s.value}</Text>
                            <Text style={styles.statTitle}>{s.title}</Text>
                        </View>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.quickActions}>
                    <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(business)/(stack)/add-service' as any)}>
                        <IconSymbol name="plus.circle.fill" size={32} color="#0a7ea4" />
                        <Text style={styles.actionText}>Add Service</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(business)/bookings' as any)}>
                        <IconSymbol name="ticket.fill" size={32} color="#f59e0b" />
                        <Text style={styles.actionText}>View Bookings</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(business)/requests' as any)}>
                        <IconSymbol name="tray.full.fill" size={32} color="#8b5cf6" />
                        <Text style={styles.actionText}>Review Requests</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    headerTitle: { fontSize: 28, fontWeight: '700', color: '#11181C' },
    profileBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    scroll: { flex: 1 },
    content: { padding: 20, paddingBottom: 100 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    statCard: { width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    statIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    statValue: { fontSize: 24, fontWeight: '700', color: '#11181C', marginBottom: 4 },
    statTitle: { fontSize: 13, color: '#687076' },
    sectionTitle: { fontSize: 20, fontWeight: '700', color: '#11181C', marginBottom: 12 },
    quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    actionCard: { width: '48%', backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center', gap: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    actionText: { fontSize: 14, fontWeight: '600', color: '#11181C' },
});
