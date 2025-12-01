import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function AdminAnalytics() {
    const stats = [

        { label: 'Active Businesses', value: 48 },
        { label: 'Published Places', value: 126 },
        { label: 'Events This Month', value: 34 },
        { label: 'Tickets Sold', value: 5420 },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Analytics</Text>
                <Text style={styles.headerSub}>High-level trends and insights</Text>
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                {stats.map((s, i) => (
                    <View key={i} style={styles.card}>
                        <Text style={styles.cardLabel}>{s.label}</Text>
                        <Text style={styles.cardValue}>{s.value}</Text>
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
    headerSub: { fontSize: 13, color: '#687076', marginTop: 4 },
    content: { padding: 16, paddingBottom: 100 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
    cardLabel: { fontSize: 14, color: '#687076' },
    cardValue: { fontSize: 24, fontWeight: '700', color: '#0a7ea4', marginTop: 6 },
});
