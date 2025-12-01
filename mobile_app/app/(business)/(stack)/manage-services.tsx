import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { businessService, BusinessModel } from '@/services/business.service';

export default function ManageServicesScreen() {
    const router = useRouter();
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    const [businesses, setBusinesses] = useState<BusinessModel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBusinesses();
    }, []);

    const loadBusinesses = async () => {
        setLoading(true);
        try {
            const resp = await businessService.mine({ skip: 0, limit: 100 });
            if (resp.success && resp.data) {
                setBusinesses(resp.data);
            }
        } catch (error) {
            console.error('Failed to load businesses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        Alert.alert(
            'Delete Service',
            `Are you sure you want to delete "${name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const resp = await businessService.remove(id);
                            if (resp.success) {
                                Alert.alert('Success', 'Service deleted successfully');
                                loadBusinesses();
                            } else {
                                Alert.alert('Error', resp.message || 'Failed to delete service');
                            }
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Something went wrong');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            <View style={[styles.header, { backgroundColor: card }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={24} color={text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: text }]}>Manage Services</Text>
                <TouchableOpacity onPress={loadBusinesses}>
                    <IconSymbol name="arrow.clockwise" size={24} color={tint} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={tint} />
                    </View>
                ) : businesses.length === 0 ? (
                    <View style={[styles.emptyCard, { backgroundColor: card }]}>
                        <IconSymbol name="square.grid.2x2" size={64} color={muted} />
                        <Text style={[styles.emptyText, { color: text }]}>No services yet</Text>
                        <Text style={[styles.emptySubtext, { color: muted }]}>Add your first service to get started</Text>
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: tint }]}
                            onPress={() => router.push('/(business)/(stack)/add-service' as any)}
                        >
                            <Text style={styles.addButtonText}>Add Service</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <Text style={[styles.countText, { color: muted }]}>{businesses.length} service{businesses.length !== 1 ? 's' : ''} total</Text>
                        {businesses.map((biz) => (
                            <View key={biz._id} style={[styles.card, { backgroundColor: card }]}>
                                <View style={styles.cardHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.name, { color: text }]}>{biz.name}</Text>
                                        {biz.approved && (
                                            <View style={styles.approvedRow}>
                                                <IconSymbol name="checkmark.seal.fill" size={14} color="#10b981" />
                                                <Text style={styles.approvedText}>Approved</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                <Text style={[styles.description, { color: muted }]} numberOfLines={2}>
                                    {biz.short_description}
                                </Text>

                                <View style={styles.metaRow}>
                                    <IconSymbol name="clock" size={14} color={muted} />
                                    <Text style={[styles.metaText, { color: muted }]}>
                                        {biz.open_hours.start} - {biz.open_hours.end}
                                    </Text>
                                </View>

                                {biz.scheduled_at && (
                                    <View style={styles.metaRow}>
                                        <IconSymbol name="calendar" size={14} color={muted} />
                                        <Text style={[styles.metaText, { color: muted }]}>
                                            Event: {new Date(biz.scheduled_at).toLocaleDateString()}
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.actions}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, { backgroundColor: tint }]}
                                        onPress={() => router.push(`/(user)/(stack)/business-details?id=${biz._id}` as any)}
                                    >
                                        <IconSymbol name="eye" size={16} color="#fff" />
                                        <Text style={styles.actionText}>View</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, { backgroundColor: '#f59e0b' }]}
                                        onPress={() => router.push(`/(business)/(stack)/edit-service?id=${biz._id}` as any)}
                                    >
                                        <IconSymbol name="pencil" size={16} color="#fff" />
                                        <Text style={styles.actionText}>Edit</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
                                        onPress={() => handleDelete(biz._id, biz.name)}
                                    >
                                        <IconSymbol name="trash" size={16} color="#fff" />
                                        <Text style={styles.actionText}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '600', flex: 1, textAlign: 'center', marginHorizontal: 8 },
    scrollView: { flex: 1 },
    content: { padding: 16, paddingBottom: 40 },
    loadingContainer: { paddingVertical: 60, alignItems: 'center' },
    emptyCard: { borderRadius: 16, padding: 40, alignItems: 'center', marginTop: 20 },
    emptyText: { fontSize: 18, fontWeight: '700', marginTop: 16 },
    emptySubtext: { fontSize: 14, marginTop: 8, marginBottom: 24 },
    addButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    addButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
    countText: { fontSize: 14, marginBottom: 12 },
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    name: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
    approvedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    approvedText: { fontSize: 12, fontWeight: '600', color: '#10b981' },
    description: { fontSize: 14, marginBottom: 12 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    metaText: { fontSize: 13 },
    actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 8,
    },
    actionText: { fontSize: 13, fontWeight: '600', color: '#fff' },
});
