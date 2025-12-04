import { IconSymbol } from '@/components/ui/icon-symbol';
import { getLanguageTranslations } from '@/constants/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function TermsScreen() {
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <IconSymbol name="doc.text.fill" size={48} color="#0a7ea4" />
                <Text style={styles.title}>{t.termsAndConditions}</Text>
            </View>

            <View style={styles.textContent}>
                <Text style={styles.paragraph}>
                    {t.acceptAgreement}
                </Text>
                <Text style={styles.sectionTitle}>1. {t.acceptanceOfTerms}</Text>
                <Text style={styles.paragraph}>
                    {t.acceptAgreement}
                </Text>
                <Text style={styles.sectionTitle}>2. {t.useLicense}</Text>
                <Text style={styles.paragraph}>
                    {t.usePermission}
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
