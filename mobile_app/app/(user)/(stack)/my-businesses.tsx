import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { businessService, BusinessModel } from '@/services/business.service';

export default function MyBusinessesScreen() {
    const router = useRouter();
    const [businesses, setBusinesses] = useState<BusinessModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    useEffect(() => {
        loadBusinesses();
    }, []);

    const loadBusinesses = async () => {
        try {
            setLoading(true);
            const response = await businessService.mine({ skip: 0, limit: 50 });
            if (response.success && response.data) {
                setBusinesses(response.data);
            }
        } catch (error) {
            console.error('Failed to load businesses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadBusinesses();
        setRefreshing(false);
    };

    const renderBusinessCard = ({ item }: { item: BusinessModel }) => (
        <TouchableOpacity
            style={[styles.businessCard, { backgroundColor: card }]}
            onPress={() => router.push(`/(user)/(stack)/edit-business?id=${item.id}` as any)}
        >
            <View style={styles.businessHeader}>
                <View style={styles.businessInfo}>
                    <Text style={[styles.businessName, { color: text }]}>{item.name}</Text>
                    <Text style={[styles.businessShort, { color: muted }]} numberOfLines={1}>
                        {item.short_description}
                    </Text>
                </View>
                <View style={[
                    styles.statusBadge,
                    { backgroundColor: item.approved ? '#dcfce7' : '#fef3c7' }
                ]}>
                    <Text style={[
                        styles.statusText,
                        { color: item.approved ? '#166534' : '#854d0e' }
                    ]}>
                        {item.approved ? 'Approved' : 'Pending'}
                    </Text>
                </View>
            </View>

            <Text style={[styles.businessDescription, { color: muted }]} numberOfLines={2}>
                {item.description}
            </Text>

            <View style={styles.businessFooter}>
                <View style={styles.infoItem}>
                    <IconSymbol name="clock" size={14} color={muted} />
                    <Text style={[styles.infoText, { color: muted }]}>
                        {item.open_hours.start} - {item.open_hours.end}
                    </Text>
                </View>
                <TouchableOpacity>
                    <IconSymbol name="chevron.right" size={20} color={tint} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: background }]}>
                <ActivityIndicator size="large" color={tint} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: card }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={24} color={text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: text }]}>My Businesses</Text>
                <TouchableOpacity
                    onPress={() => router.push('/(user)/(stack)/create-business' as any)}
                    style={styles.addButton}
                >
                    <IconSymbol name="plus" size={24} color={tint} />
                </TouchableOpacity>
            </View>

            {businesses.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <IconSymbol name="building.2" size={64} color={muted} />
                    <Text style={[styles.emptyTitle, { color: text }]}>No Businesses Yet</Text>
                    <Text style={[styles.emptyText, { color: muted }]}>
                        Create your first business to get started
                    </Text>
                    <TouchableOpacity
                        style={[styles.createButton, { backgroundColor: tint }]}
                        onPress={() => router.push('/(user)/(stack)/create-business' as any)}
                    >
                        <IconSymbol name="plus.circle.fill" size={20} color="#fff" />
                        <Text style={styles.createButtonText}>Create Business</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={businesses}
                    renderItem={renderBusinessCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={tint}
                        />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
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
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 8,
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    businessCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    businessHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    businessInfo: {
        flex: 1,
        marginRight: 12,
    },
    businessName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    businessShort: {
        fontSize: 14,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    businessDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    businessFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        fontSize: 13,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
