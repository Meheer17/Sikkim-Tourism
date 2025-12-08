import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageTranslations } from '@/constants/translations';
import { Event } from '@/services/event.service';

type ViewMode = 'list' | 'calendar';

interface EventViewProps {
    events: Event[];
    refreshing?: boolean;
    onRefresh?: () => Promise<void> | void;
    onEventPress?: (event: Event) => void;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseEventDate = (input: string): Date | null => {
    const date = new Date(input);
    return Number.isNaN(date.getTime()) ? null : date;
};

const formatEventTime = (dateString?: string): string => {
    if (!dateString) return 'Time TBD';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Time TBD';
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const formatDisplayDate = (dateString?: string): string => {
    if (!dateString) return 'Date TBD';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Date TBD';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function EventView({ events, refreshing, onRefresh, onEventPress }: EventViewProps) {
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const border = useThemeColor('border');
    const tint = useThemeColor('tint');

    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [selectedDateKey, setSelectedDateKey] = useState<string>(formatDateKey(new Date()));
    const [showMonthPicker, setShowMonthPicker] = useState(false);

    const eventsByDate = useMemo(() => {
        const map: Record<string, Event[]> = {};
        events.forEach((event) => {
            const parsed = parseEventDate(event.scheduled_at);
            if (!parsed) return;
            const key = formatDateKey(parsed);
            map[key] = [...(map[key] || []), event];
        });
        return map;
    }, [events]);

    const selectedDateEvents = eventsByDate[selectedDateKey] || [];

    const calendarCells = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);
        const offset = monthStart.getDay();
        const days = monthEnd.getDate();

        const cells: Array<Date | null> = [];
        for (let i = 0; i < offset; i++) {
            cells.push(null);
        }
        for (let day = 1; day <= days; day++) {
            cells.push(new Date(year, month, day));
        }
        return cells;
    }, [currentMonth]);

    const changeMonth = (delta: number) => {
        setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    };

    const renderMonthYearPicker = () => {
        const selectedYear = currentMonth.getFullYear();
        const maxYear = new Date().getFullYear() + 1;
        const minYear = selectedYear - 25;
        const endYear = Math.max(maxYear, selectedYear + 1);
        const years = Array.from({ length: endYear - minYear + 1 }, (_, i) => minYear + i);
        const months = Array.from({ length: 12 }, (_, i) => i);

        return (
            <Modal
                visible={showMonthPicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowMonthPicker(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: text }]}>Select Month & Year</Text>
                            <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                                <IconSymbol name="xmark" size={24} color={text as string} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.pickerContainer}>
                            {/* Years - Left Side */}
                            <View style={styles.pickerColumn}>
                                <Text style={[styles.pickerLabel, { color: muted }]}>Year</Text>
                                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={true}>
                                    {years.map((y) => (
                                        <TouchableOpacity
                                            key={y}
                                            style={[
                                                styles.pickerItem,
                                                currentMonth.getFullYear() === y && { backgroundColor: `${tint}30` },
                                            ]}
                                            onPress={() =>
                                                setCurrentMonth(new Date(y, currentMonth.getMonth(), 1))
                                            }
                                        >
                                            <Text style={[
                                                styles.pickerItemText,
                                                { color: currentMonth.getFullYear() === y ? tint : text }
                                            ]}>
                                                {y}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Months - Right Side */}
                            <View style={styles.pickerColumn}>
                                <Text style={[styles.pickerLabel, { color: muted }]}>Month</Text>
                                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={true}>
                                    {months.map((m) => (
                                        <TouchableOpacity
                                            key={m}
                                            style={[
                                                styles.pickerItem,
                                                currentMonth.getMonth() === m && { backgroundColor: `${tint}30` },
                                            ]}
                                            onPress={() =>
                                                setCurrentMonth(new Date(currentMonth.getFullYear(), m, 1))
                                            }
                                        >
                                            <Text style={[
                                                styles.pickerItemText,
                                                { color: currentMonth.getMonth() === m ? tint : text }
                                            ]}>
                                                {MONTH_NAMES[m]}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: tint }]}
                            onPress={() => setShowMonthPicker(false)}
                        >
                            <Text style={styles.modalButtonText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    };

    const EventCard = ({ event }: { event: Event }) => {
        const eventHours =
            event.open_hours?.start && event.open_hours?.end
                ? `${event.open_hours.start} - ${event.open_hours.end}`
                : 'Hours TBD';
        const eventDateLabel = formatDisplayDate(event.scheduled_at);

        return (
            <TouchableOpacity
                style={[styles.eventCard, { backgroundColor: card, borderLeftColor: tint }]}
                onPress={() => onEventPress?.(event)}
                activeOpacity={0.7}
            >
                <View style={styles.eventCardContent}>
                    <View style={styles.eventHeader}>
                        <Text style={[styles.eventName, { color: text }]} numberOfLines={2}>{event.name}</Text>
                        <View style={[styles.eventTimeBadge, { backgroundColor: `${tint}15` }]}>
                            <IconSymbol name="clock.fill" size={12} color={tint} />
                            <Text style={[styles.eventTime, { color: tint }]}>
                                {formatEventTime(event.scheduled_at)}
                            </Text>
                        </View>
                    </View>
                    <Text style={[styles.eventDesc, { color: muted }]} numberOfLines={2}>
                        {event.short_description || 'No description available'}
                    </Text>
                    <View style={styles.eventFooter}>
                        <View style={styles.eventDateTag}>
                            <IconSymbol name="calendar" size={14} color={tint} />
                            <Text style={[styles.eventTagText, { color: text }]}>
                                {eventDateLabel}
                            </Text>
                        </View>
                        <View style={styles.eventLocationTag}>
                            <IconSymbol name="mappin.circle.fill" size={14} color={tint} />
                            <Text style={[styles.eventTagText, { color: muted }]}>
                                {eventHours}
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderList = () => (
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
                onRefresh ? (
                    <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={tint} />
                ) : undefined
            }
            showsVerticalScrollIndicator={false}
        >
            {events.length > 0 ? (
                <React.Fragment>
                    {events.map((event) => (
                        <EventCard key={event._id} event={event} />
                    ))}
                </React.Fragment>
            ) : (
                <View style={styles.emptyState}>
                    <IconSymbol name="calendar.badge.clock" size={56} color={muted as string} />
                    <Text style={[styles.emptyTitle, { color: text }]}>No Events</Text>
                    <Text style={[styles.emptySubtitle, { color: muted }]}>
                        New events will appear here
                    </Text>
                </View>
            )}
        </ScrollView>
    );

    const renderCalendar = () => (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.calendarContainer}>
                {/* Month Navigation */}
                <View style={styles.calendarHeader}>
                    <TouchableOpacity 
                        style={[styles.monthButton, { borderColor: border }]}
                        onPress={() => changeMonth(-1)}
                        activeOpacity={0.7}
                    >
                        <IconSymbol name="chevron.left" size={18} color={text as string} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.monthLabelContainer}
                        onPress={() => setShowMonthPicker(true)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.monthLabel, { color: text }]}>
                            {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.monthButton, { borderColor: border }]}
                        onPress={() => changeMonth(1)}
                        activeOpacity={0.7}
                    >
                        <IconSymbol name="chevron.right" size={18} color={text as string} />
                    </TouchableOpacity>
                </View>

                {/* Weekday Labels */}
                <View style={styles.weekdaysRow}>
                    {WEEKDAY_LABELS.map((label) => (
                        <View key={label} style={styles.weekdayCell}>
                            <Text style={[styles.weekdayLabel, { color: muted }]}>{label}</Text>
                        </View>
                    ))}
                </View>

                {/* Calendar Grid */}
                <View style={styles.calendarGrid}>
                    {calendarCells.map((date, index) => {
                        if (!date) {
                            return <View key={`empty-${index}`} style={styles.dayCellEmpty} />;
                        }

                        const key = formatDateKey(date);
                        const isSelected = key === selectedDateKey;
                        const hasEvents = Boolean(eventsByDate[key]?.length);
                        const isToday = key === formatDateKey(new Date());

                        return (
                            <TouchableOpacity
                                key={key}
                                style={[
                                    styles.dayCell,
                                    { borderColor: border },
                                    isSelected && { backgroundColor: tint, borderColor: tint },
                                    isToday && !isSelected && { borderColor: tint, borderWidth: 2 },
                                ]}
                                onPress={() => setSelectedDateKey(key)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.dayNumberWrapper}>
                                    <Text style={[
                                        styles.dayNumber,
                                        { color: isSelected ? '#fff' : text }
                                    ]}>
                                        {date.getDate()}
                                    </Text>
                                </View>
                                {hasEvents && (
                                    <View style={[
                                        styles.dot,
                                        { backgroundColor: isSelected ? '#fff' : tint }
                                    ]} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Selected Day Events */}
                <View style={[styles.daySummary, { backgroundColor: `${tint}08`, borderTopColor: border }]}>
                    <View style={styles.daySummaryHeader}>
                        <View style={styles.daySummaryTitleRow}>
                            <IconSymbol name="calendar" size={16} color={tint} />
                            <Text style={[styles.daySummaryTitle, { color: text }]}>
                                {selectedDateKey}
                            </Text>
                        </View>
                        <Text style={[styles.daySummaryCount, { color: muted }]}>
                            {selectedDateEvents.length}
                        </Text>
                    </View>

                    {selectedDateEvents.length > 0 ? (
                        <View style={styles.daySummaryEvents}>
                            {selectedDateEvents.map((event) => (
                                <EventCard key={event._id} event={event} />
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyDay}>
                            <Text style={[styles.emptySubtitle, { color: muted }]}>
                                No events scheduled for this day
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </ScrollView>
    );

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            {renderMonthYearPicker()}
            {/* Toggle Bar */}
            <View style={[styles.toggleBar, { backgroundColor: card, borderColor: border }]}>
                <TouchableOpacity
                    style={[
                        styles.toggleButton,
                        viewMode === 'list' && { backgroundColor: tint },
                    ]}
                    onPress={() => setViewMode('list')}
                    activeOpacity={0.9}
                >
                    <IconSymbol 
                        name="list.bullet" 
                        size={16} 
                        color={viewMode === 'list' ? '#fff' : (muted as string)} 
                    />
                    <Text style={[
                        styles.toggleText,
                        viewMode === 'list' && styles.toggleTextActive
                    ]}>
                        List
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.toggleButton,
                        viewMode === 'calendar' && { backgroundColor: tint },
                    ]}
                    onPress={() => setViewMode('calendar')}
                    activeOpacity={0.9}
                >
                    <IconSymbol 
                        name="calendar" 
                        size={16} 
                        color={viewMode === 'calendar' ? '#fff' : (muted as string)} 
                    />
                    <Text style={[
                        styles.toggleText,
                        viewMode === 'calendar' && styles.toggleTextActive
                    ]}>
                        Calendar
                    </Text>
                </TouchableOpacity>
            </View>

            {viewMode === 'list' ? renderList() : renderCalendar()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    toggleBar: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        margin: 16,
        gap: 4,
        borderWidth: 1,
    },
    toggleButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
    },
    toggleTextActive: {
        color: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 120,
    },
    emptyState: {
        paddingVertical: 80,
        alignItems: 'center',
        gap: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 12,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
    },
    eventCard: {
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        borderLeftWidth: 4,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    eventCardContent: {
        gap: 8,
    },
    eventHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 8,
    },
    eventName: {
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
    },
    eventTimeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    eventTime: {
        fontSize: 12,
        fontWeight: '600',
    },
    eventDesc: {
        fontSize: 13,
        lineHeight: 18,
    },
    eventFooter: {
        marginTop: 4,
        gap: 6,
    },
    eventDateTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    eventLocationTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    eventTagText: {
        fontSize: 12,
    },
    calendarContainer: {
        paddingHorizontal: 12,
        paddingVertical: 16,
    },
    calendarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    monthButton: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    monthLabel: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
    },
    weekdaysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    weekdayCell: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    weekdayLabel: {
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        position: 'relative',
    },
    dayCellEmpty: {
        width: '14.28%',
        aspectRatio: 1,
    },
    dayNumberWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
    },
    dayNumber: {
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
        includeFontPadding: false,
    },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        marginTop: 2,
        position: 'absolute',
        bottom: 4,
    },
    daySummary: {
        borderTopWidth: 1,
        paddingTop: 16,
        marginHorizontal: 4,
        borderRadius: 12,
        padding: 12,
        paddingBottom: 75,
    },
    daySummaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    daySummaryTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    daySummaryTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    daySummaryCount: {
        fontSize: 13,
        fontWeight: '600',
    },
    daySummaryEvents: {
        gap: 8,
    },
    emptyDay: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        borderRadius: 16,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    pickerContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 20,
    },
    pickerColumn: {
        flex: 1,
        maxHeight: 300,
    },
    pickerLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    pickerScroll: {
        maxHeight: 280,
    },
    pickerItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 4,
    },
    pickerItemText: {
        fontSize: 15,
        fontWeight: '500',
    },
    modalButton: {
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    monthLabelContainer: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
});
