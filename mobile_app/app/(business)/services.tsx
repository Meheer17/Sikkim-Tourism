import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { businessService, BusinessModel } from '@/services/business.service';

const CATEGORIES = [
    { key: 'transport', label: 'Transport', icon: 'car.fill', color: '#3b82f6', bg: '#dbeafe' },
    { key: 'stay', label: 'Stay', icon: 'bed.double.fill', color: '#10b981', bg: '#d1fae5' },
    { key: 'adventure', label: 'Adventure', icon: 'mountain.2.fill', color: '#f59e0b', bg: '#fef3c7' },
    { key: 'food', label: 'Food', icon: 'fork.knife', color: '#ef4444', bg: '#fee2e2' },
    { key: 'shopping', label: 'Shopping', icon: 'bag.fill', color: '#8b5cf6', bg: '#ede9fe' },
];

export default function BusinessServices() {
    const router = useRouter();
    const [selected, setSelected] = useState<string | null>(null);
    const [businesses, setBusinesses] = useState<BusinessModel[]>([]);
    const [loading, setLoading] = useState(true);
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const textColor = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');
    const scheme = useColorScheme();

    useEffect(() => {
        loadMyBusinesses();
    }, []);

    const loadMyBusinesses = async () => {
        setLoading(true);
        try {
            const resp = await businessService.mine({ skip: 0, limit: 50 });
            if (resp.success && resp.data) {
                setBusinesses(resp.data);
            }
        } catch (error) {
            console.error('Failed to load businesses:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { backgroundColor: background }]}>
                <View style={[styles.header, { backgroundColor: card }]}>
                    <Text style={[styles.headerTitle, { color: textColor }]}>Your Services</Text>
                    <TouchableOpacity style={[styles.addBtn, { backgroundColor: tint }]} onPress={() => router.push('/(business)/(stack)/add-service' as any)}>
                        <IconSymbol name="plus" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Business Nature</Text>
                <View style={styles.categoryGrid}>
                    {CATEGORIES.map((c) => {
                        const active = selected === c.key;
                        return (
                            <TouchableOpacity
                                key={c.key}
                                style={[
                                    styles.categoryCard,
                                    { backgroundColor: scheme === 'dark' ? card : c.bg, borderColor: active ? tint : 'transparent' },
                                    active && { borderWidth: 2 }
                                ]}
                                onPress={() => setSelected(c.key)}
                            >
                                <IconSymbol name={c.icon as any} size={24} color={c.color} />
                                <Text style={[styles.categoryText, { color: c.color }]}>{c.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Manage Services</Text>
                <View style={styles.actionsRow}>
                    <TouchableOpacity style={[styles.action, { backgroundColor: card }]} onPress={() => router.push('/(business)/(stack)/add-service' as any)}>
                        <IconSymbol name="plus.circle.fill" size={28} color={tint} />
                        <Text style={[styles.actionText, { color: textColor }]}>Add Service</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.action, { backgroundColor: card }]} onPress={() => router.push('/(business)/(stack)/manage-services' as any)}>
                        <IconSymbol name="square.grid.2x2.fill" size={28} color={tint} />
                        <Text style={[styles.actionText, { color: textColor }]}>Manage All</Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.sectionTitle, { color: textColor }]}>Your Services ({businesses.length})</Text>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={tint} />
                    </View>
                ) : businesses.length === 0 ? (
                    <View style={[styles.emptyCard, { backgroundColor: card }]}>
                        <IconSymbol name="square.grid.2x2" size={48} color={muted} />
                        <Text style={[styles.emptyText, { color: muted }]}>No services yet</Text>
                        <Text style={[styles.emptySubtext, { color: muted }]}>Add your first service to get started</Text>
                    </View>
                ) : (
                    businesses.map((biz) => (
                        <TouchableOpacity
                            key={biz._id}
                            style={[styles.bizCard, { backgroundColor: card }]}
                            onPress={() => router.push(`/(user)/(stack)/business-details?id=${biz._id}` as any)}
                        >
                            <View style={styles.bizHeader}>
                                <Text style={[styles.bizName, { color: textColor }]}>{biz.name}</Text>
                                {biz.approved && (
                                    <View style={styles.approvedBadge}>
                                        <IconSymbol name="checkmark.seal.fill" size={14} color="#10b981" />
                                    </View>
                                )}
                            </View>
                            <Text style={[styles.bizDesc, { color: muted }]} numberOfLines={2}>{biz.short_description}</Text>
                            <View style={styles.bizFooter}>
                                <View style={styles.bizMeta}>
                                    <IconSymbol name="clock" size={14} color={muted} />
                                    <Text style={[styles.bizMetaText, { color: muted }]}>{biz.open_hours.start} - {biz.open_hours.end}</Text>
                                </View>
                                <IconSymbol name="chevron.right" size={16} color={muted} />
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
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, borderBottomWidth: 0 },
    headerTitle: { fontSize: 28, fontWeight: '700' },
    addBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    scroll: { flex: 1 },
    content: { padding: 20, paddingBottom: 100 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    categoryCard: { width: '30%', borderRadius: 12, padding: 14, alignItems: 'center', gap: 8, borderWidth: 0 },
    categorySelected: {},
    categoryText: { fontSize: 13, fontWeight: '600' },
    actionsRow: { flexDirection: 'row', gap: 12 },
    action: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center', gap: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    actionText: { fontSize: 14, fontWeight: '600' },
    loadingContainer: { paddingVertical: 40, alignItems: 'center' },
    emptyCard: { borderRadius: 12, padding: 32, alignItems: 'center', marginTop: 8 },
    emptyText: { fontSize: 16, fontWeight: '600', marginTop: 12 },
    emptySubtext: { fontSize: 14, marginTop: 4 },
    bizCard: { borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    bizHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    bizName: { fontSize: 16, fontWeight: '700', flex: 1 },
    approvedBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#d1fae5', justifyContent: 'center', alignItems: 'center' },
    bizDesc: { fontSize: 14, marginBottom: 12 },
    bizFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    bizMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    bizMetaText: { fontSize: 12 },
});
