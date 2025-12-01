import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { businessService, BusinessModel } from '@/services/business.service';

export default function OrganizationEvents() {
    const router = useRouter();
    const tint = useThemeColor('tint');
    const [events, setEvents] = useState<BusinessModel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        setLoading(true);
        try {
            const resp = await businessService.list({ skip: 0, limit: 50 });
            if (resp.success && resp.data) {
                const eventItems = resp.data.filter(b => b.scheduled_at);
                setEvents(eventItems);
            }
        } catch (error) {
            console.error('Failed to load events:', error);
        } finally {
            setLoading(false);
        }
    };

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const textColor = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    return (
        <View style={styles.container}>
            <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { backgroundColor: background }]}>
                <View style={[styles.header, { backgroundColor: card }]}>
                    <Text style={[styles.headerTitle, { color: textColor }]}>Events</Text>
                    <TouchableOpacity style={[styles.addBtn, { backgroundColor: tint }]} onPress={() => router.push('/(organization)/(stack)/add-event' as any)}>
                        <IconSymbol name="plus" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={tint} />
                    </View>
                ) : events.length === 0 ? (
                    <View style={[styles.emptyCard, { backgroundColor: card }]}>
                        <IconSymbol name="calendar" size={48} color={muted} />
                        <Text style={[styles.emptyText, { color: textColor }]}>No events yet</Text>
                        <Text style={[styles.emptySubtext, { color: muted }]}>Create your first event to get started</Text>
                    </View>
                ) : (
                    events.map(e => (
                        <TouchableOpacity
                            key={e._id}
                            style={[styles.card, { backgroundColor: card }]}
                            onPress={() => router.push(`/(user)/(stack)/business-details?id=${e._id}` as any)}
                        >
                            <View style={styles.row}>
                                <Text style={[styles.title, { color: textColor }]}>{e.name}</Text>
                                {e.approved && (
                                    <View style={styles.approvedBadge}>
                                        <IconSymbol name="checkmark.seal.fill" size={14} color="#10b981" />
                                    </View>
                                )}
                            </View>
                            <Text style={[styles.desc, { color: muted }]} numberOfLines={2}>{e.short_description}</Text>
                            <View style={styles.dateRow}>
                                <IconSymbol name="calendar" size={14} color={muted} />
                                <Text style={[styles.date, { color: muted }]}>{e.scheduled_at ? new Date(e.scheduled_at).toLocaleDateString() : '—'}</Text>
                            </View>
                            <View style={styles.actions}>
                                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: tint }]} onPress={(evt) => { evt.stopPropagation(); router.push(`/(organization)/(stack)/edit-event?id=${e._id}` as any); }}>
                                    <IconSymbol name="pencil" size={16} color="#fff" />
                                    <Text style={styles.actionText}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10b981' }]} onPress={(evt) => evt.stopPropagation()}>
                                    <IconSymbol name="eye" size={16} color="#fff" />
                                    <Text style={styles.actionText}>View</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
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
    desc: { fontSize: 13, marginTop: 6 },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
    date: { fontSize: 13, color: '#687076' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    approvedBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#d1fae5', justifyContent: 'center', alignItems: 'center' },
    actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
    actionText: { fontSize: 13, fontWeight: '600', color: '#fff' },
    loadingContainer: { paddingVertical: 40, alignItems: 'center' },
    emptyCard: { borderRadius: 12, padding: 32, alignItems: 'center', marginTop: 8 },
    emptyText: { fontSize: 16, fontWeight: '600', marginTop: 12 },
    emptySubtext: { fontSize: 14, marginTop: 4 },
});
