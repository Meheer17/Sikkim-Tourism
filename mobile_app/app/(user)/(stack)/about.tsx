import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function AboutScreen() {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <IconSymbol name="info.circle.fill" size={48} color="#0a7ea4" />
                <Text style={styles.title}>About Tourist App</Text>
            </View>

            <View style={styles.textContent}>
                <Text style={styles.paragraph}>
                    Tourist App is your ultimate travel companion for exploring Sikkim.
                </Text>
                <Text style={styles.sectionTitle}>Version</Text>
                <Text style={styles.paragraph}>1.0.0</Text>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.paragraph}>
                    We help travelers discover amazing places, book services, and create unforgettable memories.
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
