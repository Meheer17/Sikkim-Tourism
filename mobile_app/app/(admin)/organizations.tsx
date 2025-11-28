import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';

type OrgStatus = 'pending' | 'approved' | 'suspended';
type OrgCategory = 'monastery' | 'museum' | 'park' | 'community' | 'venue';

type Organization = {
    id: string;
    name: string;
    category: OrgCategory;
    owner: string;
    email: string;
    phone: string;
    createdAt: string;
    status: OrgStatus;
    placesCount: number;
    eventsCount: number;
    ticketsSold: number;
};

export default function AdminOrganizations() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<OrgCategory | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<OrgStatus | 'all'>('all');
    const [orgs, setOrgs] = useState<Organization[]>([
        { id: 'o1', name: 'Peace Monastery', category: 'monastery', owner: 'Tenzin Lama', email: 'peace@monastery.com', phone: '+91 90000 11111', createdAt: '2024-05-18', status: 'approved', placesCount: 3, eventsCount: 12, ticketsSold: 1540 },
        { id: 'o2', name: 'City Museum', category: 'museum', owner: 'Arjun Patel', email: 'info@citymuseum.org', phone: '+91 90000 22222', createdAt: '2024-08-09', status: 'pending', placesCount: 1, eventsCount: 5, ticketsSold: 320 },
        { id: 'o3', name: 'Green Park Trust', category: 'park', owner: 'Neha Sharma', email: 'hello@greenpark.in', phone: '+91 90000 33333', createdAt: '2024-03-02', status: 'suspended', placesCount: 5, eventsCount: 2, ticketsSold: 80 },
    ]);

    const filtered = useMemo(() => orgs.filter(o => {
        const matchesSearch = o.name.toLowerCase().includes(search.toLowerCase()) || o.owner.toLowerCase().includes(search.toLowerCase());
        const matchesCat = categoryFilter === 'all' || o.category === categoryFilter;
        const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
        return matchesSearch && matchesCat && matchesStatus;
    }), [orgs, search, categoryFilter, statusFilter]);

    const setStatus = (id: string, status: OrgStatus) => {
        setOrgs(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    };
    const removeOrg = (id: string) => setOrgs(prev => prev.filter(o => o.id !== id));

    const badgeColor = (s: OrgStatus) => s === 'approved' ? '#10b981' : s === 'pending' ? '#f59e0b' : '#ef4444';
    const badgeBg = (s: OrgStatus) => s === 'approved' ? '#d1fae5' : s === 'pending' ? '#fef3c7' : '#fee2e2';

    const categories: (OrgCategory | 'all')[] = ['all', 'monastery', 'museum', 'park', 'community', 'venue'];
    const statuses: (OrgStatus | 'all')[] = ['all', 'pending', 'approved', 'suspended'];

    return (
        <View style={styles.container}>
            <View style={styles.header}><Text style={styles.headerTitle}>Organizations</Text></View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
                <View style={styles.filters}>
                    <View style={styles.searchBox}>
                        <IconSymbol name="magnifyingglass" size={18} color="#687076" />
                        <TextInput style={styles.searchInput} placeholder="Search orgs or owners" value={search} onChangeText={setSearch} />
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                        {categories.map(c => (
                            <TouchableOpacity key={c} style={[styles.chip, categoryFilter === c && styles.chipActive]} onPress={() => setCategoryFilter(c)}>
                                <Text style={[styles.chipText, categoryFilter === c && styles.chipTextActive]}>{c}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                        {statuses.map(s => (
                            <TouchableOpacity key={s} style={[styles.chip, statusFilter === s && styles.chipActive]} onPress={() => setStatusFilter(s)}>
                                <Text style={[styles.chipText, statusFilter === s && styles.chipTextActive]}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {filtered.map(o => (
                    <View key={o.id} style={styles.card}>
                        <View style={styles.row}>
                            <View>
                                <Text style={styles.title}>{o.name}</Text>
                                <Text style={styles.subtitle}>{o.owner} • {o.category}</Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: badgeBg(o.status) }]}>
                                <Text style={[styles.badgeText, { color: badgeColor(o.status) }]}>{o.status}</Text>
                            </View>
                        </View>

                        <View style={[styles.row, { marginTop: 8 }]}>
                            <View style={styles.stat}><IconSymbol name="map.fill" size={16} color="#687076" /><Text style={styles.statText}>{o.placesCount} places</Text></View>
                            <View style={styles.stat}><IconSymbol name="calendar" size={16} color="#687076" /><Text style={styles.statText}>{o.eventsCount} events</Text></View>
                            <View style={styles.stat}><IconSymbol name="ticket.fill" size={16} color="#687076" /><Text style={styles.statText}>{o.ticketsSold} tickets</Text></View>
                        </View>

                        <View style={styles.row}>
                            <Text style={styles.meta}>Added {o.createdAt}</Text>
                            <Text style={styles.meta}>{o.email} • {o.phone}</Text>
                        </View>

                        <View style={styles.actions}>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#0a7ea4' }]} onPress={() => setStatus(o.id, 'approved')}>
                                <IconSymbol name="checkmark" size={16} color="#fff" />
                                <Text style={styles.actionText}>Approve</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#f59e0b' }]} onPress={() => setStatus(o.id, 'pending')}>
                                <IconSymbol name="clock" size={16} color="#fff" />
                                <Text style={styles.actionText}>Pending</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ef4444' }]} onPress={() => setStatus(o.id, 'suspended')}>
                                <IconSymbol name="nosign" size={16} color="#fff" />
                                <Text style={styles.actionText}>Suspend</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#6b7280' }]} onPress={() => removeOrg(o.id)}>
                                <IconSymbol name="trash" size={16} color="#fff" />
                                <Text style={styles.actionText}>Delete</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.row}>
                            <TouchableOpacity style={[styles.secondaryBtn]} onPress={() => router.push('/(admin)/(stack)/analytics') as any}>
                                <Text style={styles.secondaryText}>View analytics</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.secondaryBtn]} onPress={() => router.push('/(admin)/(stack)/settings') as any}>
                                <Text style={styles.secondaryText}>Org settings</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <TouchableOpacity style={styles.fab} onPress={() => router.push('/(admin)/(stack)/add-place') as any}>
                <IconSymbol name="plus" size={22} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: { padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    headerTitle: { fontSize: 28, fontWeight: '700', color: '#11181C' },
    scroll: { flex: 1 },
    content: { padding: 16, paddingBottom: 120 },
    filters: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12 },
    searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
    searchInput: { flex: 1, fontSize: 14, color: '#11181C' },
    chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#e5e7eb', marginRight: 8, backgroundColor: '#fff' },
    chipActive: { backgroundColor: '#e0f2fe', borderColor: '#38bdf8' },
    chipText: { fontSize: 12, color: '#334155' },
    chipTextActive: { color: '#0369a1', fontWeight: '600' },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 16, fontWeight: '700', color: '#11181C' },
    subtitle: { fontSize: 13, color: '#687076', marginTop: 2 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statText: { fontSize: 13, color: '#687076' },
    meta: { fontSize: 12, color: '#94a3b8' },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, marginBottom: 8 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
    actionText: { fontSize: 13, fontWeight: '600', color: '#fff' },
    secondaryBtn: { paddingVertical: 8, paddingHorizontal: 12 },
    secondaryText: { fontSize: 13, fontWeight: '600', color: Colors.tint },
    fab: { position: 'absolute', right: 20, bottom: 90, width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.tint, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
});
