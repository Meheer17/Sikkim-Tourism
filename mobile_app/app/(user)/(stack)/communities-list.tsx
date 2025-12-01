import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { communityService } from '@/services/community.service';

interface Community {
    _id: string;
    name: string;
    decription: string; // backend typo kept
    created_at?: string;
    updated_at?: string;
}

export default function CommunitiesListScreen() {
    const router = useRouter();
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    useEffect(() => {
        loadCommunities();
    }, []);

    const loadCommunities = async () => {
        setLoading(true);
        try {
            const resp = await communityService.list({ skip: 0, limit: 50 });
            if (resp.success && resp.data) {
                setCommunities(resp.data);
            }
        } catch (error) {
            console.error('Failed to load communities:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderCommunityCard = ({ item }: { item: Community }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: card }]}
            onPress={() => router.push(`/(user)/(stack)/community-details?id=${item._id}` as any)}
        >
            <View style={styles.iconContainer}>
                <IconSymbol name="person.3.fill" size={32} color={tint} />
            </View>
            <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: text }]} numberOfLines={1}>
                    {item.name}
                </Text>
                <Text style={[styles.cardDesc, { color: muted }]} numberOfLines={2}>
                    {item.decription}
                </Text>
                <Text style={[styles.cardDate, { color: muted }]}>Created {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={muted} />
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
                <Text style={[styles.headerTitle, { color: text }]}>Communities</Text>
                <TouchableOpacity onPress={loadCommunities}>
                    <IconSymbol name="arrow.clockwise" size={24} color={tint} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={communities}
                renderItem={renderCommunityCard}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <IconSymbol name="person.3" size={64} color={muted} />
                        <Text style={[styles.emptyText, { color: text }]}>No communities found</Text>
                        <Text style={[styles.emptySubtext, { color: muted }]}>
                            Be the first to create one!
                        </Text>
                    </View>
                }
            />
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
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
    },
    listContent: {
        padding: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#e8f4f8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 14,
        marginBottom: 6,
    },
    cardDate: {
        fontSize: 12,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
    },
});
