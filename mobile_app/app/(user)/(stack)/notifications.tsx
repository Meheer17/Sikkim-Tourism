import { IconSymbol } from '@/components/ui/icon-symbol';
import { getLanguageTranslations } from '@/constants/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function NotificationsScreen() {
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <IconSymbol name="bell.fill" size={48} color="#f59e0b" />
                <Text style={styles.title}>{t.notificationSettings}</Text>
                <Text style={styles.subtitle}>{t.notificationsSubtitle}</Text>
            </View>

            <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>{t.notificationsComingSoon}</Text>
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
