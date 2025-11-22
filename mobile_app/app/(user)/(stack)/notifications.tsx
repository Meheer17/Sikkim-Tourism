import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function NotificationsScreen() {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <IconSymbol name="bell.fill" size={48} color="#f59e0b" />
                <Text style={styles.title}>Notifications</Text>
                <Text style={styles.subtitle}>Manage your notification preferences</Text>
            </View>

            <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>Notification settings coming soon...</Text>
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
    placeholder: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 16,
        color: '#687076',
    },
});
