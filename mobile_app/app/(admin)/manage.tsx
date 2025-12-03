import { Colors } from '@/constants/theme';
import { getLanguageTranslations } from '@/constants/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AdminBusinesses from './businesses';
import AdminOrganizations from './organizations';
import AdminUsers from './users';

export default function AdminManage() {
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const [tab, setTab] = useState<'businesses' | 'organizations' | 'users'>('businesses');

    const tabs: { key: 'businesses' | 'organizations' | 'users'; label: string }[] = [
        { key: 'businesses', label: 'Businesses' },
        { key: 'organizations', label: 'Organizations' },
        { key: 'users', label: 'Users' },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Manage</Text>
                <Text style={styles.headerSub}>Review and manage entities from one place</Text>
            </View>

            <View style={styles.tabSwitch}>
                {tabs.map(t => (
                    <TouchableOpacity key={t.key} style={[styles.switchBtn, tab === t.key && styles.switchBtnActive]} onPress={() => setTab(t.key)}>
                        <Text style={[styles.switchText, tab === t.key && styles.switchTextActive]}>{t.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }}>
                {tab === 'businesses' && <AdminBusinesses />}
                {tab === 'organizations' && <AdminOrganizations />}
                {tab === 'users' && <AdminUsers />}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: { padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    headerTitle: { fontSize: 28, fontWeight: '700', color: '#11181C' },
    headerSub: { fontSize: 13, color: '#687076', marginTop: 4 },
    tabSwitch: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', gap: 8 },
    switchBtn: { flex: 1, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', alignItems: 'center' },
    switchBtnActive: { backgroundColor: '#e0f2fe', borderColor: '#38bdf8' },
    switchText: { fontSize: 13, color: '#334155', fontWeight: '600' },
    switchTextActive: { color: Colors.tint },
});
