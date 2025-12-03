import { IconSymbol } from '@/components/ui/icon-symbol';
import { getLanguageTranslations } from '@/constants/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function OrganizationTickets() {
    const router = useRouter();
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const tint = useThemeColor('tint');
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const textColor = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tickets = [
        { id: 't1', title: 'Monastery Entry', price: 50, sold: 230, status: 'active' },
        { id: 't2', title: 'Cultural Night', price: 200, sold: 450, status: 'active' },
    ];
    const color = (s: string) => s === 'active' ? '#10b981' : '#6b7280';
    const bg = (s: string) => s === 'active' ? '#d1fae5' : '#f3f4f6';

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scroll} contentContainerStyle={[styles.content,{backgroundColor:background}]}>
                <View style={[styles.header,{backgroundColor:card}]}>
                    <Text style={[styles.headerTitle,{color:textColor}]}>Tickets</Text>
                    <TouchableOpacity style={[styles.manageBtn,{backgroundColor:tint}]} onPress={() => router.push('/(organization)/(stack)/manage-tickets' as any)}>
                        <IconSymbol name="rectangle.3.offgrid.fill" size={18} color="#fff" />
                        <Text style={styles.manageText}>Manage</Text>
                    </TouchableOpacity>
                </View>
                {tickets.map(t => (
                    <View key={t.id} style={[styles.card,{backgroundColor:card}]}>
                        <View style={styles.row}>
                            <Text style={[styles.title,{color:textColor}]}>{t.title}</Text>
                            <View style={[styles.badge, { backgroundColor: bg(t.status) }]}>
                                <Text style={[styles.badgeText, { color: color(t.status) }]}>{t.status}</Text>
                            </View>
                        </View>
                        <View style={styles.row}>
                            <Text style={[styles.price,{color:tint}]}>₹{t.price}</Text>
                            <View style={styles.row}><IconSymbol name="ticket.fill" size={16} color="#687076" /><Text style={styles.sold}>Sold {t.sold}</Text></View>
                        </View>
                        <View style={styles.actions}>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: tint }]}> 
                                <IconSymbol name="plus" size={16} color="#fff" />
                                <Text style={styles.actionText}>Add Stock</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: tint }]}> 
                                <IconSymbol name="pencil" size={16} color="#fff" />
                                <Text style={styles.actionText}>Edit</Text>
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
    header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
    headerTitle: { fontSize: 28, fontWeight: '700', color: '#11181C' },
    manageBtn: { flexDirection: 'row', gap: 6, marginTop: 8, alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    manageText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    scroll: { flex: 1 },
    content: { padding: 16, paddingBottom: 100 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 16, fontWeight: '700', color: '#11181C' },
    price: { fontSize: 18, fontWeight: '700' },
    sold: { fontSize: 13, color: '#687076', marginLeft: 6 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
    actionText: { fontSize: 13, fontWeight: '600', color: '#fff' },
});
