import { IconSymbol } from '@/components/ui/icon-symbol';
import { getLanguageTranslations } from '@/constants/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BusinessDetailsScreen() {
    const router = useRouter();
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const params = useLocalSearchParams();

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <IconSymbol name="chevron.left" size={24} color="#11181C" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Business Details</Text>
                <TouchableOpacity style={styles.editButton}>
                    <IconSymbol name="pencil" size={20} color="#0a7ea4" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.placeholderContainer}>
                    <IconSymbol name="building.2.fill" size={64} color="#0a7ea4" />
                    <Text style={styles.placeholderTitle}>Business Details</Text>
                    <Text style={styles.placeholderText}>
                        Detailed view with business information, analytics, and management options
                    </Text>
                    <Text style={styles.placeholderId}>Business ID: {params.id}</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#11181C',
    },
    editButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    placeholderContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    placeholderTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#11181C',
        marginTop: 20,
        marginBottom: 12,
    },
    placeholderText: {
        fontSize: 14,
        color: '#687076',
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 40,
    },
    placeholderId: {
        fontSize: 12,
        color: '#9ca3af',
        fontFamily: 'monospace',
    },
});
