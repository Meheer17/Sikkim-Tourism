import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function AdminAnalytics() {
    const router = useRouter();
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');
    const stats = [

        { label: 'Active Businesses', value: 48 },
        { label: 'Published Places', value: 126 },
        { label: 'Events This Month', value: 34 },
        { label: 'Tickets Sold', value: 5420 },
    ];

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            <View style={[styles.header, { backgroundColor: card, borderBottomColor: muted + '40' }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <IconSymbol name="chevron.left" size={24} color={text} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={[styles.headerTitle, { color: text }]}>Analytics</Text>
                    <Text style={[styles.headerSub, { color: muted }]}>High-level trends and insights</Text>
                </View>
                <View style={styles.placeholder} />
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                {stats.map((s, i) => (
                    <View key={i} style={[styles.card, { backgroundColor: card, borderColor: muted + '20' }]}>
                        <Text style={[styles.cardLabel, { color: muted }]}>{s.label}</Text>
                        <Text style={[styles.cardValue, { color: tint }]}>{s.value}</Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContent: {
        flex: 1,
        alignItems: 'center',
    },
    placeholder: {
        width: 40,
    },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    headerSub: { fontSize: 13, marginTop: 4 },
    content: { padding: 16, paddingBottom: 100 },
    card: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
    },
    cardLabel: { fontSize: 14 },
    cardValue: { fontSize: 24, fontWeight: '700', marginTop: 6 },
});
