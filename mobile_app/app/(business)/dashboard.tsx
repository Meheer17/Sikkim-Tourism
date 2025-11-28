import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function BusinessDashboard() {
    const router = useRouter();
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const textColor = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');
    const stats = [
        { title: 'Today Bookings', value: '12', icon: 'ticket.fill', color: '#f59e0b', bg: '#fef3c7' },
        { title: 'Revenue', value: '₹32k', icon: 'indianrupeesign.circle.fill', color: '#10b981', bg: '#d1fae5' },
        { title: 'Active Services', value: '5', icon: 'square.grid.2x2.fill', color: '#3b82f6', bg: '#dbeafe' },
        { title: 'Pending Requests', value: '3', icon: 'tray.full.fill', color: '#8b5cf6', bg: '#ede9fe' },
    ];

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scroll} contentContainerStyle={[styles.content,{backgroundColor:background}]} showsVerticalScrollIndicator={false}>
                <View style={[styles.header,{backgroundColor:card}]}>
                    <Text style={[styles.headerTitle,{color:textColor}]}>Business Dashboard</Text>
                </View>
                <View style={styles.statsGrid}>
                    {stats.map((s, i) => (
                        <View key={i} style={[styles.statCard,{backgroundColor:card}]}>
                            <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                                <IconSymbol name={s.icon as any} size={24} color={s.color} />
                            </View>
                            <Text style={[styles.statValue,{color:textColor}]}>{s.value}</Text>
                            <Text style={[styles.statTitle,{color:muted}]}>{s.title}</Text>
                        </View>
                    ))}
                </View>

                <Text style={[styles.sectionTitle,{color:textColor}]}>Quick Actions</Text>
                <View style={styles.quickActions}>
                    <TouchableOpacity style={[styles.actionCard,{backgroundColor:card}]} onPress={() => router.push('/(business)/(stack)/add-service' as any)}>
                        <IconSymbol name="plus.circle.fill" size={32} color={tint} />
                        <Text style={[styles.actionText,{color:textColor}]}>Add Service</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionCard,{backgroundColor:card}]} onPress={() => router.push('/(business)/bookings' as any)}>
                        <IconSymbol name="ticket.fill" size={32} color="#f59e0b" />
                        <Text style={[styles.actionText,{color:textColor}]}>View Bookings</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionCard,{backgroundColor:card}]} onPress={() => router.push('/(business)/requests' as any)}>
                        <IconSymbol name="tray.full.fill" size={32} color="#8b5cf6" />
                        <Text style={[styles.actionText,{color:textColor}]}>Review Requests</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, borderBottomWidth: 0 },
    headerTitle: { fontSize: 28, fontWeight: '700' },
    profileBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    scroll: { flex: 1 },
    content: { padding: 20, paddingBottom: 100 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    statCard: { width: '48%', borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    statIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    statValue: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
    statTitle: { fontSize: 13 },
    sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
    quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    actionCard: { width: '48%', borderRadius: 12, padding: 20, alignItems: 'center', gap: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    actionText: { fontSize: 14, fontWeight: '600' },
});
