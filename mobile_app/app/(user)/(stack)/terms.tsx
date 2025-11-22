import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TermsScreen() {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <IconSymbol name="doc.text.fill" size={48} color="#0a7ea4" />
                <Text style={styles.title}>Terms & Conditions</Text>
            </View>

            <View style={styles.textContent}>
                <Text style={styles.paragraph}>
                    By using this application, you agree to our terms and conditions.
                </Text>
                <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
                <Text style={styles.paragraph}>
                    By accessing and using this service, you accept and agree to be bound by the terms and provisions of this agreement.
                </Text>
                <Text style={styles.sectionTitle}>2. Use License</Text>
                <Text style={styles.paragraph}>
                    Permission is granted to temporarily use this application for personal, non-commercial transitory viewing only.
                </Text>
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
        textAlign: 'center',
    },
    textContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#11181C',
        marginTop: 20,
        marginBottom: 12,
    },
    paragraph: {
        fontSize: 15,
        color: '#687076',
        lineHeight: 24,
        marginBottom: 12,
    },
});
