import { IconSymbol } from '@/components/ui/icon-symbol';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';
import { getLanguageTranslations } from '@/constants/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LanguageScreen() {
    const { language, setLanguage } = useLanguage();
    const t = getLanguageTranslations(language);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <IconSymbol name="globe" size={48} color="#3b82f6" />
                <Text style={styles.title}>{t.language ?? 'Language'}</Text>
                <Text style={styles.subtitle}>{t.chooseLanguage ?? 'Choose your preferred language'}</Text>
            </View>

            <View style={styles.languagesContainer}>
                {SUPPORTED_LANGUAGES.map((lang) => (
                    <TouchableOpacity
                        key={lang.code}
                        style={[
                            styles.languageOption,
                            language === lang.code && styles.languageOptionActive,
                        ]}
                        onPress={() => setLanguage(lang.code)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.radioButton}>
                            {language === lang.code && <View style={styles.radioButtonInner} />}
                        </View>
                        <View style={styles.languageInfo}>
                            <Text style={[styles.languageText, language === lang.code && styles.languageTextActive]}>
                                {lang.name}
                            </Text>
                            <Text style={[styles.languageSubtext, language === lang.code && styles.languageSubtextActive]}>
                                {lang.nativeName}
                            </Text>
                        </View>
                        {lang.icon && <Text style={styles.languageIcon}>{lang.icon}</Text>}
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                    {t.addLanguagesInfo ?? '💡 You can easily add more languages to this app. Just update the language configuration file and add translations!'}
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
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#687076',
        textAlign: 'center',
    },
    languagesContainer: {
        gap: 16,
    },
    languageOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 2,
        borderColor: '#e5e7eb',
    },
    languageOptionActive: {
        borderColor: '#3b82f6',
        backgroundColor: '#f0f9ff',
    },
    radioButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#d1d5db',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    radioButtonInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#3b82f6',
    },
    languageInfo: {
        flex: 1,
    },
    languageText: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
    },
    languageTextActive: {
        color: '#3b82f6',
        fontWeight: '600',
    },
    languageSubtext: {
        fontSize: 13,
        color: '#9ca3af',
        marginTop: 2,
    },
    languageSubtextActive: {
        color: '#3b82f6',
    },
    languageIcon: {
        fontSize: 24,
        marginLeft: 8,
    },
    infoBox: {
        backgroundColor: '#f0f9ff',
        borderRadius: 12,
        padding: 16,
        marginTop: 32,
        borderLeftWidth: 4,
        borderLeftColor: '#3b82f6',
    },
    infoText: {
        fontSize: 13,
        color: '#0369a1',
        lineHeight: 20,
    },
});
