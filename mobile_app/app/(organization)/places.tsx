import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { locationService, LocationModel } from '@/services/location.service';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = SCREEN_HEIGHT * 0.35;

export default function OrganizationPlaces() {
    const router = useRouter();
    const tint = useThemeColor('tint');
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const textColor = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const [selectedPlace, setSelectedPlace] = useState<string | null>(null);
    const [places, setPlaces] = useState<LocationModel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPlaces();
    }, []);

    const loadPlaces = async () => {
        setLoading(true);
        try {
            const resp = await locationService.list({ skip: 0, limit: 50 });
            if (resp.success && resp.data) {
                setPlaces(resp.data);
            }
        } catch (error) {
            console.error('Failed to load places:', error);
        } finally {
            setLoading(false);
        }
    };

    const statusColor = (s: string) => s === 'active' ? '#10b981' : s === 'draft' ? '#f59e0b' : '#6b7280';
    const statusBg = (s: string) => s === 'active' ? '#d1fae5' : s === 'draft' ? '#fef3c7' : '#f3f4f6';

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { backgroundColor: background }]}>
                <View style={[styles.header, { backgroundColor: card }]}>
                    <View>
                        <Text style={[styles.headerTitle, { color: textColor }]}>Places</Text>
                        <Text style={[styles.headerSubtitle, { color: muted }]}>{places.length} places</Text>
                    </View>
                    <TouchableOpacity style={[styles.addBtn, { backgroundColor: tint }]} onPress={() => router.push('/(organization)/(stack)/add-place' as any)}>
                        <IconSymbol name="plus" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.mapContainer}>
                    <View style={styles.mapPlaceholder}>
                        <IconSymbol name="map.fill" size={48} color={tint} />
                        <Text style={[styles.mapText, { color: muted }]}>{selectedPlace ? `Showing: ${selectedPlace}` : 'Select a place to view on map'}</Text>
                    </View>
                    <View style={styles.mapControls}>
                        <TouchableOpacity style={styles.controlButton}><IconSymbol name="location.fill" size={20} color={tint} /></TouchableOpacity>
                        <TouchableOpacity style={styles.controlButton}><IconSymbol name="plus" size={20} color="#11181C" /></TouchableOpacity>
                        <TouchableOpacity style={styles.controlButton}><IconSymbol name="minus" size={20} color="#11181C" /></TouchableOpacity>
                    </View>
                </View>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={tint} />
                    </View>
                ) : places.length === 0 ? (
                    <View style={[styles.emptyCard, { backgroundColor: card }]}>
                        <IconSymbol name="map" size={48} color={muted} />
                        <Text style={[styles.emptyText, { color: textColor }]}>No places yet</Text>
                        <Text style={[styles.emptySubtext, { color: muted }]}>Add your first place to get started</Text>
                    </View>
                ) : (
                    places.map(p => (
                        <TouchableOpacity
                            key={p._id}
                            style={[styles.card, { backgroundColor: card }]}
                            onPress={() => router.push(`/(user)/(stack)/location-details?id=${p._id}` as any)}
                        >
                            <View style={styles.row}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.placeName, { color: textColor }]}>{p.name}</Text>
                                    <Text style={[styles.placeType, { color: muted }]}>{p.type}</Text>
                                </View>
                                <View style={styles.coordsBadge}>
                                    <IconSymbol name="location.fill" size={12} color={tint} />
                                    <Text style={[styles.coordsText, { color: muted }]}>{p.position.x.toFixed(2)}, {p.position.y.toFixed(2)}</Text>
                                </View>
                            </View>
                            <Text style={[styles.placeDesc, { color: muted }]} numberOfLines={2}>{p.short_description}</Text>
                            <View style={styles.actions}>
                                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: tint }]} onPress={(e) => { e.stopPropagation(); router.push(`/(organization)/(stack)/edit-place?id=${p._id}` as any); }}>
                                    <IconSymbol name="pencil" size={16} color="#fff" />
                                    <Text style={styles.actionText}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10b981' }]} onPress={(e) => e.stopPropagation()}>
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
    headerSubtitle: { fontSize: 14, color: '#687076' },
    addBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    mapContainer: { height: MAP_HEIGHT, backgroundColor: '#e8f4f8', position: 'relative' },
    mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    mapText: { fontSize: 14, color: '#687076', marginTop: 6 },
    mapControls: { position: 'absolute', right: 12, top: 12, gap: 8 },
    controlButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
    scroll: { flex: 1 },
    content: { padding: 16, paddingBottom: 100 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    row: { flexDirection: 'row', alignItems: 'center' },
    placeName: { fontSize: 16, fontWeight: '700', color: '#11181C' },
    placeType: { fontSize: 13, color: '#687076', marginTop: 2 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
    actionText: { fontSize: 13, fontWeight: '600', color: '#fff' },
    loadingContainer: { paddingVertical: 40, alignItems: 'center' },
    emptyCard: { borderRadius: 12, padding: 32, alignItems: 'center', marginTop: 8 },
    emptyText: { fontSize: 16, fontWeight: '600', marginTop: 12 },
    emptySubtext: { fontSize: 14, marginTop: 4 },
    coordsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#e8f4f8' },
    coordsText: { fontSize: 11, fontWeight: '600' },
    placeDesc: { fontSize: 13, marginTop: 8 },
});
