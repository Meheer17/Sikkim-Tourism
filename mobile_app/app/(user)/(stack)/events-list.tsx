import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { businessService } from '@/services/business.service';

interface Event {
    _id: string;
    name: string;
    description: string;
    short_description: string;
    open_hours: { start: string; end: string };
    scheduled_at?: string;
    approved?: boolean;
    created_at?: string;
    updated_at?: string;
}

export default function EventsListScreen() {
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        setLoading(true);
        try {
            // Events are businesses with scheduled_at
            const resp = await businessService.list({ skip: 0, limit: 50 });
            if (resp.success && resp.data) {
                // Filter for events (those with scheduled_at)
                const eventItems: Event[] = resp.data.filter(b => b.scheduled_at).map(b => ({ ...b }));
                setEvents(eventItems);
            }
        } catch (error) {
            console.error('Failed to load events:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderEventCard = ({ item }: { item: Event }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: card }]}
            onPress={() => router.push(`/(user)/(stack)/business-details?id=${item._id}` as any)}
        >
            <View style={styles.dateContainer}>
                <Text style={[styles.dateDay, { color: tint }]}>
                    {item.scheduled_at ? new Date(item.scheduled_at).getDate() : '?'}
                </Text>
                <Text style={[styles.dateMonth, { color: muted }]}>
                    {item.scheduled_at ? new Date(item.scheduled_at).toLocaleString('default', { month: 'short' }) : ''}
                </Text>
            </View>

            <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: text }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.cardDesc, { color: muted }]} numberOfLines={2}>
                    {item.short_description}
                </Text>
                <View style={styles.cardMeta}>
                    <IconSymbol name="clock" size={14} color={muted} />
                    <Text style={[styles.cardMetaText, { color: muted }]}>
                        {item.open_hours.start} - {item.open_hours.end}
                    </Text>
                </View>
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
                <Text style={[styles.headerTitle, { color: text }]}>Events</Text>
                <TouchableOpacity onPress={loadEvents}>
                    <IconSymbol name="arrow.clockwise" size={24} color={tint} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={events}
                renderItem={renderEventCard}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <IconSymbol name="calendar" size={64} color={muted} />
                        <Text style={[styles.emptyText, { color: text }]}>No upcoming events</Text>
                        <Text style={[styles.emptySubtext, { color: muted }]}>
                            Check back later for new events
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
    dateContainer: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: '#e8f4f8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    dateDay: {
        fontSize: 24,
        fontWeight: '700',
    },
    dateMonth: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
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
        marginBottom: 8,
    },
    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    cardMetaText: {
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
