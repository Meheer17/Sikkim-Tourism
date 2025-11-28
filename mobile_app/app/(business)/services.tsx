import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

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

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Your Services</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(business)/(stack)/add-service' as any)}>
                    <IconSymbol name="plus" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Business Nature</Text>
                <View style={styles.categoryGrid}>
                    {CATEGORIES.map((c) => (
                        <TouchableOpacity key={c.key} style={[styles.categoryCard, { backgroundColor: c.bg }, selected === c.key && styles.categorySelected]} onPress={() => setSelected(c.key)}>
                            <IconSymbol name={c.icon as any} size={24} color={c.color} />
                            <Text style={[styles.categoryText, { color: c.color }]}>{c.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>Manage Services</Text>
                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.action} onPress={() => router.push('/(business)/(stack)/add-service' as any)}>
                        <IconSymbol name="plus.circle.fill" size={28} color="#0a7ea4" />
                        <Text style={styles.actionText}>Add Service</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.action} onPress={() => router.push('/(business)/(stack)/manage-services' as any)}>
                        <IconSymbol name="square.grid.2x2.fill" size={28} color="#8b5cf6" />
                        <Text style={styles.actionText}>Manage All</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    headerTitle: { fontSize: 28, fontWeight: '700', color: '#11181C' },
    addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#0a7ea4', justifyContent: 'center', alignItems: 'center' },
    scroll: { flex: 1 },
    content: { padding: 20, paddingBottom: 100 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#11181C', marginBottom: 12 },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    categoryCard: { width: '30%', borderRadius: 12, padding: 14, alignItems: 'center', gap: 8 },
    categorySelected: { borderWidth: 2, borderColor: '#0a7ea4' },
    categoryText: { fontSize: 13, fontWeight: '600' },
    actionsRow: { flexDirection: 'row', gap: 12 },
    action: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', gap: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    actionText: { fontSize: 14, fontWeight: '600', color: '#11181C' },
});
