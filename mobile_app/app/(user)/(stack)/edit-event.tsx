import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { eventService, Event, EventUpdateData } from '@/services/event.service';

export default function EditEventScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [event, setEvent] = useState<Event | null>(null);

    // Form fields
    const [name, setName] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [scheduledDate, setScheduledDate] = useState(new Date());

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');
    const border = useThemeColor('border');

    useEffect(() => {
        loadEvent();
    }, [id]);

    const loadEvent = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const resp = await eventService.getById(id);
            if (resp.success && resp.data) {
                const eventData = resp.data;
                setEvent(eventData);
                setName(eventData.name);
                setShortDescription(eventData.short_description);
                setDescription(eventData.description);
                setStartTime(eventData.open_hours.start);
                setEndTime(eventData.open_hours.end);
                setScheduledDate(new Date(eventData.scheduled_at));
            }
        } catch (error) {
            console.error('Failed to load event:', error);
            Alert.alert('Error', 'Failed to load event details');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        // Validation
        if (!name.trim()) {
            Alert.alert('Validation Error', 'Event name is required');
            return;
        }
        if (!shortDescription.trim()) {
            Alert.alert('Validation Error', 'Short description is required');
            return;
        }
        if (!description.trim()) {
            Alert.alert('Validation Error', 'Description is required');
            return;
        }

        setSaving(true);
        try {
            const updateData: EventUpdateData = {
                name: name.trim(),
                short_description: shortDescription.trim(),
                description: description.trim(),
                open_hours: {
                    start: startTime,
                    end: endTime,
                },
                scheduled_at: scheduledDate.toISOString(),
            };

            const resp = await eventService.updateEvent(id!, updateData);
            if (resp.success) {
                Alert.alert('Success', 'Event updated successfully', [
                    {
                        text: 'OK',
                        onPress: () => router.back(),
                    },
                ]);
            }
        } catch (error: any) {
            console.error('Failed to update event:', error);
            const errorMessage = error?.response?.data?.detail || 'Failed to update event';
            Alert.alert('Error', errorMessage);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: background }]}>
                <ActivityIndicator size="large" color={tint} />
            </View>
        );
    }

    if (!event) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: background }]}>
                <IconSymbol name="exclamationmark.triangle" size={48} color={muted} />
                <Text style={[styles.errorText, { color: text }]}>Event not found</Text>
                <TouchableOpacity style={[styles.button, { backgroundColor: tint }]} onPress={() => router.back()}>
                    <Text style={styles.buttonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: card, borderBottomColor: border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={24} color={text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: text }]}>Edit Event</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.form}>
                    {/* Event Name */}
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: text }]}>Event Name *</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: card, color: text, borderColor: border }]}
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter event name"
                            placeholderTextColor={muted}
                        />
                    </View>

                    {/* Short Description */}
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: text }]}>Short Description *</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: card, color: text, borderColor: border }]}
                            value={shortDescription}
                            onChangeText={setShortDescription}
                            placeholder="Brief description (1-2 sentences)"
                            placeholderTextColor={muted}
                            multiline
                            numberOfLines={2}
                        />
                    </View>

                    {/* Description */}
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: text }]}>Full Description *</Text>
                        <TextInput
                            style={[styles.textArea, { backgroundColor: card, color: text, borderColor: border }]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Detailed description of the event"
                            placeholderTextColor={muted}
                            multiline
                            numberOfLines={6}
                        />
                    </View>

                    {/* Scheduled Date */}
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: text }]}>Event Date *</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: card, color: text, borderColor: border }]}
                            value={scheduledDate.toISOString().split('T')[0]}
                            onChangeText={(dateStr) => {
                                const parsed = new Date(dateStr);
                                if (!isNaN(parsed.getTime())) {
                                    setScheduledDate(parsed);
                                }
                            }}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={muted}
                        />
                        <Text style={[styles.hint, { color: muted }]}>Format: YYYY-MM-DD</Text>
                    </View>

                    {/* Time Range */}
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: text }]}>Event Hours *</Text>
                        <View style={styles.timeRow}>
                            <View style={styles.timeInput}>
                                <Text style={[styles.timeLabel, { color: muted }]}>Start</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: card, color: text, borderColor: border }]}
                                    value={startTime}
                                    onChangeText={setStartTime}
                                    placeholder="HH:MM"
                                    placeholderTextColor={muted}
                                />
                            </View>
                            <View style={styles.timeSeparator}>
                                <Text style={[styles.timeSeparatorText, { color: muted }]}>to</Text>
                            </View>
                            <View style={styles.timeInput}>
                                <Text style={[styles.timeLabel, { color: muted }]}>End</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: card, color: text, borderColor: border }]}
                                    value={endTime}
                                    onChangeText={setEndTime}
                                    placeholder="HH:MM"
                                    placeholderTextColor={muted}
                                />
                            </View>
                        </View>
                        <Text style={[styles.hint, { color: muted }]}>Use 24-hour format (e.g., 09:00, 17:00)</Text>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: tint }]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <IconSymbol name="checkmark.circle.fill" size={20} color="#fff" />
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholder: {
        width: 40,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    form: {
        padding: 16,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        minHeight: 120,
        textAlignVertical: 'top',
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        gap: 12,
    },
    dateText: {
        fontSize: 16,
        flex: 1,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeInput: {
        flex: 1,
    },
    timeSeparator: {
        paddingHorizontal: 12,
        paddingTop: 20,
    },
    timeSeparatorText: {
        fontSize: 16,
        fontWeight: '600',
    },
    timeLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    hint: {
        fontSize: 12,
        marginTop: 4,
        fontStyle: 'italic',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
        marginTop: 20,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 24,
    },
    button: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
