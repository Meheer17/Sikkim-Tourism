import { IconSymbol } from '@/components/ui/icon-symbol';
import { getLanguageTranslations } from '@/constants/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function OrganizationEvents() {
    const router = useRouter();
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const tint = useThemeColor('tint');
    const events = [
        { id: 'e1', title: 'Cultural Night', date: 'Dec 10, 2025', status: 'upcoming' },
        { id: 'e2', title: 'Harvest Festival', date: 'Nov 15, 2025', status: 'past' },
    ];
    const color = (s: string) => s === 'upcoming' ? '#10b981' : '#6b7280';
    const bg = (s: string) => s === 'upcoming' ? '#d1fae5' : '#f3f4f6';

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const textColor = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    return (
        <View style={styles.container}>
            <ScrollView style={styles.scroll} contentContainerStyle={[styles.content,{backgroundColor:background}]}>
                <View style={[styles.header,{backgroundColor:card}]}>
                    <Text style={[styles.headerTitle,{color:textColor}]}>Events</Text>
                    <TouchableOpacity style={[styles.addBtn,{backgroundColor:tint}]} onPress={() => router.push('/(organization)/(stack)/add-event' as any)}>
                        <IconSymbol name="plus" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
                {events.map(e => (
                    <View key={e.id} style={[styles.card,{backgroundColor:card}]}>
                        <View style={styles.row}>
                            <Text style={[styles.title,{color:textColor}]}>{e.title}</Text>
                            <View style={[styles.badge, { backgroundColor: bg(e.status) }]}>
                                <Text style={[styles.badgeText, { color: color(e.status) }]}>{e.status}</Text>
                            </View>
                        </View>
                        <Text style={[styles.date,{color:muted}]}>{e.date}</Text>
                        <View style={styles.actions}>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: tint }]} onPress={() => router.push(`/(organization)/(stack)/edit-event?id=${e.id}` as any)}>
                                <IconSymbol name="pencil" size={16} color="#fff" />
                                <Text style={styles.actionText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: tint }]}>
                                <IconSymbol name="calendar" size={16} color="#fff" />
                                <Text style={styles.actionText}>Schedule</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
    headerTitle: { fontSize: 28, fontWeight: '700', color: '#11181C' },
    addBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    scroll: { flex: 1 },
    content: { padding: 16, paddingBottom: 100 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 16, fontWeight: '700', color: '#11181C' },
    date: { fontSize: 13, color: '#687076', marginTop: 4 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
    actionText: { fontSize: 13, fontWeight: '600', color: '#fff' },
});
