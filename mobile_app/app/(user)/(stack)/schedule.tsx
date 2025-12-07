import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import EventView from '@/components/common/eventView';
import { Event, eventService } from '@/services';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageTranslations } from '@/constants/translations';
import Toast from 'react-native-toast-message';

export default function ScheduleScreen() {
    const router = useRouter();
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');
    const insets = useSafeAreaInsets();

    const [events, setEvents] = useState<Event[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const response = await eventService.getAll(200);

            if (response.data) {
                const eventsList = Array.isArray(response.data) ? response.data : [];
                setEvents(eventsList);
            } else {
                setEvents([]);
            }
        } catch (error: any) {
            console.error('Failed to load events:', error);
            Toast.show({
                type: 'error',
                text1: 'Failed to load events',
                text2: error?.message || 'Please try again later',
                position: 'bottom',
            });
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadEvents();
        setRefreshing(false);
    }, []);

    const handleEventPress = useCallback((event: Event) => {
        console.log('Event pressed', event._id);
        Toast.show({
            type: 'info',
            text1: event.name,
            text2: event.short_description,
            position: 'bottom',
        });
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingHorizontal: 20 }]}>
                <View style={styles.headerTop}>
                    <View style={[styles.headerIcon, { backgroundColor: `${tint}20` }]}>
                        <IconSymbol name="calendar" size={18} color={tint} />
                    </View>
                    <View style={styles.headerTextBlock}>
                        <Text style={[styles.title, { color: text }]}>Events</Text>
                        <Text style={[styles.subtitle, { color: muted }]}>
                            Scroll to view all events
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.createButton, { backgroundColor: tint }]}
                        onPress={() => router.push('/(user)/(stack)/create-event' as any)}
                    >
                        <IconSymbol name="plus" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Events List/Calendar */}
            <View style={[styles.body, { backgroundColor: card }]}>
                {loading ? (
                    <View style={styles.loadingState}>
                        <IconSymbol name="hourglass" size={48} color={muted as string} />
                        <Text style={[styles.loadingText, { color: text }]}>Loading events...</Text>
                    </View>
                ) : (
                    <EventView
                        events={events}
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        onEventPress={handleEventPress}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        gap: 16,
        marginBottom: 12,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTextBlock: {
        flex: 1,
    },
    createButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 13,
    },
    body: {
        flex: 1,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },
    loadingState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 8,
    },
});
