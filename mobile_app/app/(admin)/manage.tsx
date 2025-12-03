import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import AdminBusinesses from './businesses';
import AdminUsers from './users';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageTranslations } from '@/constants/translations';

export default function AdminManage() {
    const [tab, setTab] = useState<'businesses' | 'users'>('businesses');
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    const tabs: { key: 'businesses' | 'users'; label: string }[] = [
        { key: 'businesses', label: t.businesses || 'Businesses' },
        { key: 'users', label: t.users || 'Users' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            <View style={[styles.header, { backgroundColor: card, borderBottomColor: muted + '40' }]}>
                <Text style={[styles.headerTitle, { color: text }]}>{t.manage || 'Manage'}</Text>
                <Text style={[styles.headerSub, { color: muted }]}>{t.reviewManageEntities || 'Review and manage entities from one place'}</Text>
            </View>

            <View style={[styles.tabSwitch, { backgroundColor: card }]}>
                {tabs.map(t => (
                    <TouchableOpacity 
                        key={t.key} 
                        style={[
                            styles.switchBtn,
                            { backgroundColor: card, borderColor: muted + '40' },
                            tab === t.key && [styles.switchBtnActive, { backgroundColor: tint + '15', borderColor: tint }]
                        ]} 
                        onPress={() => setTab(t.key)}
                    >
                        <Text style={[styles.switchText, { color: muted }, tab === t.key && [styles.switchTextActive, { color: tint }]]}>{t.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }}>
                {tab === 'businesses' && <AdminBusinesses />}
                {tab === 'users' && <AdminUsers />}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20, paddingTop: 60, borderBottomWidth: 1 },
    headerTitle: { fontSize: 28, fontWeight: '700' },
    headerSub: { fontSize: 13, marginTop: 4 },
    tabSwitch: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
    switchBtn: { flex: 1, paddingVertical: 10, borderRadius: 999, borderWidth: 1, alignItems: 'center' },
    switchBtnActive: {},
    switchText: { fontSize: 13, fontWeight: '600' },
    switchTextActive: {},
});
