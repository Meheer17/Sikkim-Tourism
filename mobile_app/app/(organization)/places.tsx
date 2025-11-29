import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

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
    const places = [
        { id: 'p1', name: 'Monastery', type: 'View Spot', status: 'active' },
        { id: 'p2', name: 'Scenic Lake', type: 'View Spot', status: 'active' },
        { id: 'p3', name: 'Cultural Museum', type: 'Place', status: 'draft' },
    ];

    const statusColor = (s: string) => s === 'active' ? '#10b981' : s === 'draft' ? '#f59e0b' : '#6b7280';
    const statusBg = (s: string) => s === 'active' ? '#d1fae5' : s === 'draft' ? '#fef3c7' : '#f3f4f6';

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scroll} contentContainerStyle={[styles.content,{backgroundColor:background}]}>
                <View style={[styles.header,{backgroundColor:card}]}>
                    <View>
                        <Text style={[styles.headerTitle,{color:textColor}]}>Places</Text>
                        <Text style={[styles.headerSubtitle,{color:muted}]}>{places.length} places</Text>
                    </View>
                    <TouchableOpacity style={[styles.addBtn,{backgroundColor:tint}]} onPress={() => router.push('/(organization)/(stack)/add-place' as any)}>
                        <IconSymbol name="plus" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.mapContainer}>
                    <View style={styles.mapPlaceholder}>
                        <IconSymbol name="map.fill" size={48} color={tint} />
                        <Text style={[styles.mapText,{color:muted}]}>{selectedPlace ? `Showing: ${selectedPlace}` : 'Select a place to view on map'}</Text>
                    </View>
                    <View style={styles.mapControls}>
                        <TouchableOpacity style={styles.controlButton}><IconSymbol name="location.fill" size={20} color={tint} /></TouchableOpacity>
                        <TouchableOpacity style={styles.controlButton}><IconSymbol name="plus" size={20} color="#11181C" /></TouchableOpacity>
                        <TouchableOpacity style={styles.controlButton}><IconSymbol name="minus" size={20} color="#11181C" /></TouchableOpacity>
                    </View>
                </View>
                {places.map(p => (
                    <TouchableOpacity key={p.id} style={[styles.card,{backgroundColor:card}]} onPress={() => setSelectedPlace(p.name)}>
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.placeName,{color:textColor}]}>{p.name}</Text>
                                <Text style={[styles.placeType,{color:muted}]}>{p.type}</Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: statusBg(p.status) }]}>
                                <Text style={[styles.badgeText, { color: statusColor(p.status) }]}>{p.status}</Text>
                            </View>
                        </View>
                        <View style={styles.actions}>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: tint }]} onPress={() => router.push(`/(organization)/(stack)/edit-place?id=${p.id}` as any)}>
                                <IconSymbol name="pencil" size={16} color="#fff" />
                                <Text style={styles.actionText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: tint }]}> 
                                <IconSymbol name="checkmark" size={16} color="#fff" />
                                <Text style={styles.actionText}>Publish</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                ))}
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
});
