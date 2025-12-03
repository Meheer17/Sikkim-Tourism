import { IconSymbol } from '@/components/ui/icon-symbol';
import { getLanguageTranslations } from '@/constants/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function OrgEventDetails() {
    const router = useRouter();
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const { id } = useLocalSearchParams();
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.back} onPress={() => router.back()}>
                    <IconSymbol name="chevron.left" size={24} color="#11181C" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Event Details</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.placeholder}>
                    <IconSymbol name="calendar" size={64} color="#0a7ea4" />
                    <Text style={styles.title}>Event Details</Text>
                    <Text style={styles.idText}>Event ID: {id}</Text>
                    <Text style={styles.sub}>Overview with info, schedule, capacity, and ticket insights.</Text>
                </View>
            </ScrollView>
        </View>
    );
}
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    back: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#11181C' },
    content: { padding: 20, paddingBottom: 120 },
    placeholder: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    title: { fontSize: 24, fontWeight: '700', color: '#11181C', marginTop: 16, marginBottom: 8 },
    sub: { fontSize: 14, color: '#687076', textAlign: 'center', paddingHorizontal: 32 },
    idText: { fontSize: 12, color: '#9ca3af', marginTop: 8 },
});
