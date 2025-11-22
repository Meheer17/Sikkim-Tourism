import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function PrivacyScreen() {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <IconSymbol name="lock.fill" size={48} color="#10b981" />
                <Text style={styles.title}>Privacy Policy</Text>
            </View>

            <View style={styles.textContent}>
                <Text style={styles.paragraph}>
                    We value your privacy and are committed to protecting your personal information.
                </Text>
                <Text style={styles.sectionTitle}>Information We Collect</Text>
                <Text style={styles.paragraph}>
                    We collect information that you provide directly to us, such as when you create an account, make a booking, or contact us for support.
                </Text>
                <Text style={styles.sectionTitle}>How We Use Your Information</Text>
                <Text style={styles.paragraph}>
                    We use the information we collect to provide, maintain, and improve our services, and to communicate with you.
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
