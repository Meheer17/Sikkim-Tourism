import React, { useState } from 'react';
import { 
    StyleSheet, 
    Text, 
    TextInput, 
    View, 
    ScrollView, 
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { eventService, EventCreateData } from '@/services';
import Toast from 'react-native-toast-message';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CreateEventScreen() {
    const router = useRouter();
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');
    const border = useThemeColor('border');
    const insets = useSafeAreaInsets();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    
    // Calendar picker state
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const maxDate = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
    
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = () => {
        if (!name.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'Event name is required',
                position: 'bottom',
            });
            return false;
        }

        if (!description.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'Description is required',
                position: 'bottom',
            });
            return false;
        }

        if (!shortDescription.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'Short description is required',
                position: 'bottom',
            });
            return false;
        }

        if (!selectedDate) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'Event date is required',
                position: 'bottom',
            });
            return false;
        }
        // Date range check
        if (selectedDate < minDate || selectedDate > maxDate) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'Date must be from tomorrow up to 3 months ahead',
                position: 'bottom',
            });
            return false;
        }

        // Validate time format (HH:MM)
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(startTime)) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'Start time must be in format HH:MM (24-hour)',
                position: 'bottom',
            });
            return false;
        }

        if (!timeRegex.test(endTime)) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'End time must be in format HH:MM (24-hour)',
                position: 'bottom',
            });
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            setIsSubmitting(true);

            // Use selected date
            const scheduledDate = new Date(selectedDate!);
            scheduledDate.setHours(0, 0, 0, 0);

            const eventData: EventCreateData = {
                name: name.trim(),
                description: description.trim(),
                short_description: shortDescription.trim(),
                open_hours: {
                    start: startTime,
                    end: endTime,
                },
                type_id: "6927dd74c83ad21b47926941",  // Event type ID
                position: {
                    x: "27.3333",  // Sikkim latitude
                    y: "88.6167"   // Sikkim longitude
                },
                scheduled_at: scheduledDate.toISOString()
            };

            console.log('Creating event with data:', JSON.stringify(eventData, null, 2));
            await eventService.createEvent(eventData);

            Toast.show({
                type: 'success',
                text1: 'Event Created',
                text2: 'Your event has been submitted for approval',
                position: 'bottom',
            });

            router.back();
        } catch (error: any) {
            console.error('Error creating event:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error?.message || 'Failed to create event',
                position: 'bottom',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: Math.max(insets.top, 20), paddingBottom: insets.bottom + 100 }
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={[styles.backButton, { backgroundColor: card }]}
                        onPress={() => router.back()}
                    >
                        <IconSymbol name="chevron.left" size={24} color={text as string} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: text }]}>Create Event</Text>
                    <View style={styles.placeholder} />
                </View>

                {/* Form */}
                <View style={[styles.form, { backgroundColor: card }]}>
                    {/* Event Name */}
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: text }]}>Event Name *</Text>
                        <TextInput
                            style={[styles.input, { color: text, borderColor: border, backgroundColor: background }]}
                            placeholder="Enter event name"
                            placeholderTextColor={muted}
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    {/* Short Description */}
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: text }]}>Short Description *</Text>
                        <TextInput
                            style={[styles.input, { color: text, borderColor: border, backgroundColor: background }]}
                            placeholder="Brief description"
                            placeholderTextColor={muted}
                            value={shortDescription}
                            onChangeText={setShortDescription}
                            maxLength={100}
                        />
                        <Text style={[styles.helperText, { color: muted }]}>
                            {shortDescription.length}/100 characters
                        </Text>
                    </View>

                    {/* Description */}
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: text }]}>Description *</Text>
                        <TextInput
                            style={[styles.textArea, { color: text, borderColor: border, backgroundColor: background }]}
                            placeholder="Detailed description of the event"
                            placeholderTextColor={muted}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    {/* Date Picker */}
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: text }]}>Event Date *</Text>
                        <TouchableOpacity
                            style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderColor: border, backgroundColor: background }]}
                            onPress={() => setShowCalendar(true)}
                        >
                            <Text style={{ color: selectedDate ? text : muted }}>
                                {selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select a date'}
                            </Text>
                            <IconSymbol name="calendar" size={20} color={tint} />
                        </TouchableOpacity>
                        <Text style={[styles.helperText, { color: muted }]}>Select a date from tomorrow up to 3 months ahead</Text>
                    </View>

                    {/* Time Range */}
                    <View style={styles.timeRow}>
                        <View style={[styles.formGroup, styles.timeGroup]}>
                            <Text style={[styles.label, { color: text }]}>Start Time *</Text>
                            <TextInput
                                style={[styles.input, { color: text, borderColor: border, backgroundColor: background }]}
                                placeholder="HH:MM"
                                placeholderTextColor={muted}
                                value={startTime}
                                onChangeText={setStartTime}
                                maxLength={5}
                            />
                        </View>

                        <View style={[styles.formGroup, styles.timeGroup]}>
                            <Text style={[styles.label, { color: text }]}>End Time *</Text>
                            <TextInput
                                style={[styles.input, { color: text, borderColor: border, backgroundColor: background }]}
                                placeholder="HH:MM"
                                placeholderTextColor={muted}
                                value={endTime}
                                onChangeText={setEndTime}
                                maxLength={5}
                            />
                        </View>
                    </View>

                    <Text style={[styles.helperText, { color: muted }]}>
                        Format: HH:MM (24-hour, e.g., 09:00 or 17:00)
                    </Text>

                    {/* Info Note */}
                    <View style={[styles.infoBox, { backgroundColor: `${tint}15` }]}>
                        <IconSymbol name="info.circle.fill" size={20} color={tint} />
                        <Text style={[styles.infoText, { color: text }]}>
                            Your event will be submitted for approval before being published.
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Calendar Modal */}
            {showCalendar && (
                <View style={styles.calendarModalOverlay}>
                    <View style={[styles.calendarModalContent, { backgroundColor: card }]}>
                        <View style={styles.calendarHeaderRow}>
                            <TouchableOpacity 
                                style={[styles.navButton, { backgroundColor: `${border}40` }]}
                                onPress={() => {
                                    const newMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
                                    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                                    if (newMonth >= currentMonthStart) setCalendarMonth(newMonth);
                                }}
                            >
                                <IconSymbol name="chevron.left" size={20} color={text as string} />
                            </TouchableOpacity>
                            <Text style={[styles.calendarModalTitle, { color: text }]}>
                                {calendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                            </Text>
                            <TouchableOpacity 
                                style={[styles.navButton, { backgroundColor: `${border}40` }]}
                                onPress={() => {
                                    const newMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
                                    const maxMonthStart = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
                                    if (newMonth <= maxMonthStart) setCalendarMonth(newMonth);
                                }}
                            >
                                <IconSymbol name="chevron.right" size={20} color={text as string} />
                            </TouchableOpacity>
                        </View>
                        {(() => {
                            const year = calendarMonth.getFullYear();
                            const month = calendarMonth.getMonth();
                            const monthStart = new Date(year, month, 1);
                            const monthEnd = new Date(year, month + 1, 0);
                            const offset = monthStart.getDay();
                            const days = monthEnd.getDate();
                            const cells: Array<Date | null> = [];
                            for (let i = 0; i < offset; i++) cells.push(null);
                            for (let day = 1; day <= days; day++) {
                                cells.push(new Date(year, month, day));
                            }
                            return (
                                <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                                    <View style={styles.weekdaysRow}>
                                        {WEEKDAY_LABELS.map((label) => (
                                            <View key={label} style={styles.weekdayCell}>
                                                <Text style={[styles.weekdayLabel, { color: muted }]}>{label}</Text>
                                            </View>
                                        ))}
                                    </View>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                        {cells.map((date, i) => {
                                            if (!date) return <View key={`empty-${i}`} style={styles.dayCellEmpty} />;
                                            
                                            const isSelectable = date >= minDate && date <= maxDate;
                                            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                                            
                                            return (
                                                <TouchableOpacity
                                                    key={date.toISOString()}
                                                    style={[
                                                        styles.dayCell,
                                                        isSelected && { backgroundColor: tint },
                                                        !isSelectable && { opacity: 0.3 }
                                                    ]}
                                                    onPress={() => {
                                                        if (isSelectable) {
                                                            setSelectedDate(date);
                                                            setShowCalendar(false);
                                                        }
                                                    }}
                                                    disabled={!isSelectable}
                                                >
                                                    <Text style={{ 
                                                        color: isSelected ? '#fff' : text, 
                                                        fontWeight: '500', 
                                                        fontSize: 14 
                                                    }}>
                                                        {date.getDate()}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            );
                        })()}
                        <TouchableOpacity 
                            style={[styles.calendarModalClose, { backgroundColor: tint }]} 
                            onPress={() => setShowCalendar(false)}
                        >
                            <Text style={{ color: '#fff', fontWeight: '600' }}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Submit Button */}
            <View style={[styles.footer, { backgroundColor: card, paddingBottom: insets.bottom || 20 }]}>
                <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: tint }]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <IconSymbol name="checkmark.circle.fill" size={20} color="#fff" />
                            <Text style={styles.submitButtonText}>Create Event</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    placeholder: {
        width: 40,
    },
    form: {
        borderRadius: 16,
        padding: 20,
        gap: 20,
    },
    formGroup: {
        gap: 8,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        minHeight: 100,
    },
    helperText: {
        fontSize: 12,
        marginTop: -4,
    },
    timeRow: {
        flexDirection: 'row',
        gap: 12,
    },
    timeGroup: {
        flex: 1,
    },
    infoBox: {
        flexDirection: 'row',
        gap: 12,
        padding: 12,
        borderRadius: 12,
        marginTop: 4,
    },
    infoText: {
        fontSize: 13,
        flex: 1,
        lineHeight: 18,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 12,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    calendarModalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    calendarModalContent: {
        borderRadius: 16,
        padding: 16,
        width: '90%',
        maxHeight: '70%',
    },
    calendarHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    navButton: {
        width: 40,
        height: 40,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    calendarModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
    },
    weekdaysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    weekdayCell: {
        width: '13.5%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    weekdayLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    dayCell: {
        width: '13.5%',
        aspectRatio: 1,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 4,
    },
    dayCellEmpty: {
        width: '13.5%',
        aspectRatio: 1,
    },
    calendarModalClose: {
        marginTop: 16,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
