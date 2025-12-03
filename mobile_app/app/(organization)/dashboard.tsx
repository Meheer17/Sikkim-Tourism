import { IconSymbol } from '@/components/ui/icon-symbol';
import { getLanguageTranslations } from '@/constants/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function OrganizationDashboard() {
    const router = useRouter();
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const tint = useThemeColor('tint');
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const textColor = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const stats = [
        { title: 'Active Places', value: '12', icon: 'mappin.circle.fill', color: '#10b981', bg: '#d1fae5' },
        { title: 'Events', value: '3', icon: 'calendar', color: '#3b82f6', bg: '#dbeafe' },
        { title: 'Tickets Sold', value: '2.1k', icon: 'ticket.fill', color: '#f59e0b', bg: '#fef3c7' },
        { title: 'Revenue', value: '₹4.6L', icon: 'indianrupeesign.circle.fill', color: '#ef4444', bg: '#fee2e2' },
    ];

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scroll} contentContainerStyle={[styles.content,{backgroundColor:background}]} showsVerticalScrollIndicator={false}>
                <View style={[styles.header,{backgroundColor:card}]}>
                    <Text style={[styles.headerTitle,{color:textColor}]}>Organization Dashboard</Text>
                    <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(organization)/profile' as any)}>
                        <IconSymbol name="person.circle.fill" size={32} color={tint} />
                    </TouchableOpacity>
                </View>
                <View style={styles.statsGrid}>
                    {stats.map((s, i) => (
                        <View key={i} style={[styles.statCard,{backgroundColor:card}]}>
                            <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                                <IconSymbol name={s.icon as any} size={24} color={s.color} />
                            </View>
                            <Text style={[styles.statValue,{color:textColor}]}>{s.value}</Text>
                            <Text style={[styles.statTitle,{color:muted}]}>{s.title}</Text>
                        </View>
                    ))}
                </View>

                <Text style={[styles.sectionTitle,{color:textColor}]}>Quick Actions</Text>
                <View style={styles.quickActions}>
                    <TouchableOpacity style={[styles.actionCard,{backgroundColor:card}]} onPress={() => router.push('/(organization)/(stack)/add-place' as any)}>
                        <IconSymbol name="plus.circle.fill" size={32} color={tint} />
                        <Text style={[styles.actionText,{color:textColor}]}>Add Place</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionCard,{backgroundColor:card}]} onPress={() => router.push('/(organization)/(stack)/add-event' as any)}>
                        <IconSymbol name="plus.circle.fill" size={32} color={tint} />
                        <Text style={[styles.actionText,{color:textColor}]}>Add Event</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionCard,{backgroundColor:card}]} onPress={() => router.push('/(organization)/tickets' as any)}>
                        <IconSymbol name="ticket.fill" size={32} color={tint} />
                        <Text style={[styles.actionText,{color:textColor}]}>Manage Tickets</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, borderBottomWidth: 0 },
    headerTitle: { fontSize: 28, fontWeight: '700', color: '#11181C', flexShrink: 1, maxWidth: '85%', marginRight: 8 },
    profileBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginLeft: 8 },
    scroll: { flex: 1 },
    content: { padding: 20, paddingBottom: 100 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    statCard: { width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    statIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    statValue: { fontSize: 24, fontWeight: '700', color: '#11181C', marginBottom: 4 },
    statTitle: { fontSize: 13, color: '#687076' },
    sectionTitle: { fontSize: 20, fontWeight: '700', color: '#11181C', marginBottom: 12 },
    quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    actionCard: { width: '48%', backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center', gap: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    actionText: { fontSize: 14, fontWeight: '600', color: '#11181C' },
});
