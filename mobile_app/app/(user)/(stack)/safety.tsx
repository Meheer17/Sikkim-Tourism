import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

const SAFETY_TIPS = [
    {
        id: '1',
        title: 'Verify Service Providers',
        description: 'Always check ratings and reviews before booking',
        icon: 'checkmark.shield.fill',
    },
    {
        id: '2',
        title: 'Emergency Contacts',
        description: 'Keep local emergency numbers handy',
        icon: 'phone.fill',
    },
    {
        id: '3',
        title: 'Share Your Location',
        description: 'Let someone know your travel plans',
        icon: 'location.fill',
    },
    {
        id: '4',
        title: 'Secure Payments',
        description: 'Always use secure payment methods',
        icon: 'lock.fill',
    },
];

export default function SafetyScreen() {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <IconSymbol name="shield.fill" size={48} color="#10b981" />
                <Text style={styles.title}>Safety Center</Text>
                <Text style={styles.subtitle}>Your safety is our priority</Text>
            </View>

            <View style={styles.emergencyCard}>
                <IconSymbol name="exclamationmark.triangle.fill" size={32} color="#ef4444" />
                <Text style={styles.emergencyTitle}>Emergency Helpline</Text>
                <Text style={styles.emergencyNumber}>+91-100</Text>
            </View>

            <Text style={styles.sectionTitle}>Safety Tips</Text>
            {SAFETY_TIPS.map((tip) => (
                <View key={tip.id} style={styles.tipCard}>
                    <View style={styles.tipIconContainer}>
                        <IconSymbol name={tip.icon as any} size={24} color="#10b981" />
                    </View>
                    <View style={styles.tipContent}>
                        <Text style={styles.tipTitle}>{tip.title}</Text>
                        <Text style={styles.tipDescription}>{tip.description}</Text>
                    </View>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    content: {
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#11181C',
        marginTop: 16,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#687076',
        textAlign: 'center',
    },
    emergencyCard: {
        backgroundColor: '#fee2e2',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 32,
    },
    emergencyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#11181C',
        marginTop: 12,
        marginBottom: 8,
    },
    emergencyNumber: {
        fontSize: 32,
        fontWeight: '700',
        color: '#ef4444',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#11181C',
        marginBottom: 16,
    },
    tipCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        gap: 16,
    },
    tipIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#dcfce7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tipContent: {
        flex: 1,
    },
    tipTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#11181C',
        marginBottom: 4,
    },
    tipDescription: {
        fontSize: 14,
        color: '#687076',
        lineHeight: 20,
    },
});
