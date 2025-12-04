import { IconSymbol } from '@/components/ui/icon-symbol';
import { getLanguageTranslations } from '@/constants/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function PrivacyScreen() {
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <IconSymbol name="lock.fill" size={48} color="#10b981" />
                <Text style={styles.title}>{t.privacyPolicy}</Text>
            </View>

            <View style={styles.textContent}>
                <Text style={styles.paragraph}>
                    {t.privacyDescription}
                </Text>
                <Text style={styles.sectionTitle}>{t.infoWeCollect}</Text>
                <Text style={styles.paragraph}>
                    {t.collectDescription}
                </Text>
                <Text style={styles.sectionTitle}>{t.howWeUse}</Text>
                <Text style={styles.paragraph}>
                    {t.useDescription}
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
