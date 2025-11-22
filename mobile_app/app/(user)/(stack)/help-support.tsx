import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

const HELP_TOPICS = [
    { id: '1', title: 'How to book a service', icon: 'questionmark.circle' },
    { id: '2', title: 'Payment methods', icon: 'creditcard' },
    { id: '3', title: 'Cancellation policy', icon: 'xmark.circle' },
    { id: '4', title: 'Refund process', icon: 'arrow.uturn.backward' },
];

export default function HelpSupportScreen() {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <IconSymbol name="questionmark.circle.fill" size={48} color="#0a7ea4" />
                <Text style={styles.title}>Help & Support</Text>
                <Text style={styles.subtitle}>We're here to help you</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Common Topics</Text>
                {HELP_TOPICS.map((topic) => (
                    <TouchableOpacity key={topic.id} style={styles.topicCard}>
                        <IconSymbol name={topic.icon as any} size={24} color="#0a7ea4" />
                        <Text style={styles.topicTitle}>{topic.title}</Text>
                        <IconSymbol name="chevron.right" size={16} color="#687076" />
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.contactCard}>
                <Text style={styles.contactTitle}>Need more help?</Text>
                <Text style={styles.contactText}>Contact us at support@tourist.com</Text>
                <TouchableOpacity style={styles.contactButton}>
                    <Text style={styles.contactButtonText}>Contact Support</Text>
                </TouchableOpacity>
            </View>
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
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#11181C',
        marginBottom: 16,
    },
    topicCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        gap: 12,
    },
    topicTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#11181C',
    },
    contactCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
    },
    contactTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#11181C',
        marginBottom: 8,
    },
    contactText: {
        fontSize: 14,
        color: '#687076',
        marginBottom: 16,
    },
    contactButton: {
        backgroundColor: '#0a7ea4',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    contactButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
