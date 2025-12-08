import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { eventService, Event, EventUpdateData } from '@/services/event.service';

export default function EditEventScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');
    const border = useThemeColor('border');

    useEffect(() => {
        loadEventDetails();
    }, [id]);

    const loadEventDetails = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const resp = await eventService.getById(id);
            if (resp.success && resp.data) {
                const evt = resp.data;
                setEvent(evt);
                setName(evt.name);
                setDescription(evt.description);
                setShortDescription(evt.short_description);
                setStartTime(evt.open_hours.start);
                setEndTime(evt.open_hours.end);
            }
        } catch (error) {
            console.error('Failed to load event:', error);
            Alert.alert('Error', 'Failed to load event details');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = (): boolean => {
        if (!name.trim()) {
            Alert.alert('Validation Error', 'Event name is required');
            return false;
        }
        if (!description.trim()) {
            Alert.alert('Validation Error', 'Event description is required');
            return false;
        }
        if (!shortDescription.trim()) {
            Alert.alert('Validation Error', 'Short description is required');
            return false;
        }
        if (!startTime.trim() || !endTime.trim()) {
            Alert.alert('Validation Error', 'Opening hours are required');
            return false;
        }
        // Validate time format HH:MM
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
            Alert.alert('Validation Error', 'Please enter times in HH:MM format (24-hour)');
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) return;
        if (!id) return;

        setSaving(true);
        try {
            const updateData: EventUpdateData = {
                name: name.trim(),
                description: description.trim(),
                short_description: shortDescription.trim(),
                open_hours: {
                    start: startTime.trim(),
                    end: endTime.trim(),
                },
            };

            console.log('Sending update:', updateData);
            const resp = await eventService.updateEvent(id, updateData);

            if (resp.success) {
                Alert.alert('Success', 'Event updated successfully', [
                    {
                        text: 'OK',
                        onPress: () => router.back(),
                    },
                ]);
            } else {
                Alert.alert('Error', resp.errors?.[0] || 'Failed to update event');
            }
        } catch (error: any) {
            console.error('Error updating event:', error);
            Alert.alert('Error', error?.message || 'Failed to update event');
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
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: background }]}
        >
            {/* Header */}
            <View style={[styles.header, { backgroundColor: card, borderBottomColor: border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={24} color={text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: text }]}>Edit Event</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    {/* Event Name */}
                    <View style={styles.section}>
                        <Text style={[styles.label, { color: text }]}>Event Name *</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: card,
                                    color: text,
                                    borderColor: border,
                                },
                            ]}
                            placeholder="Enter event name"
                            placeholderTextColor={muted}
                            value={name}
                            onChangeText={setName}
                            editable={!saving}
                        />
                    </View>

                    {/* Short Description */}
                    <View style={styles.section}>
                        <Text style={[styles.label, { color: text }]}>Short Description *</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: card,
                                    color: text,
                                    borderColor: border,
                                },
                            ]}
                            placeholder="Brief description (max 255 characters)"
                            placeholderTextColor={muted}
                            value={shortDescription}
                            onChangeText={setShortDescription}
                            maxLength={255}
                            editable={!saving}
                        />
                        <Text style={[styles.charCount, { color: muted }]}>
                            {shortDescription.length}/255
                        </Text>
                    </View>

                    {/* Full Description */}
                    <View style={styles.section}>
                        <Text style={[styles.label, { color: text }]}>Description *</Text>
                        <TextInput
                            style={[
                                styles.inputLarge,
                                {
                                    backgroundColor: card,
                                    color: text,
                                    borderColor: border,
                                },
                            ]}
                            placeholder="Enter detailed event description"
                            placeholderTextColor={muted}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={5}
                            editable={!saving}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Opening Hours */}
                    <View style={styles.section}>
                        <Text style={[styles.label, { color: text }]}>Opening Hours *</Text>
                        <View style={styles.timeRow}>
                            <View style={styles.timeField}>
                                <Text style={[styles.timeLabel, { color: muted }]}>Start Time</Text>
                                <TextInput
                                    style={[
                                        styles.timeInput,
                                        {
                                            backgroundColor: card,
                                            color: text,
                                            borderColor: border,
                                        },
                                    ]}
                                    placeholder="HH:MM"
                                    placeholderTextColor={muted}
                                    value={startTime}
                                    onChangeText={setStartTime}
                                    editable={!saving}
                                    maxLength={5}
                                />
                            </View>
                            <View style={styles.divider}>
                                <Text style={[styles.dividerText, { color: muted }]}>to</Text>
                            </View>
                            <View style={styles.timeField}>
                                <Text style={[styles.timeLabel, { color: muted }]}>End Time</Text>
                                <TextInput
                                    style={[
                                        styles.timeInput,
                                        {
                                            backgroundColor: card,
                                            color: text,
                                            borderColor: border,
                                        },
                                    ]}
                                    placeholder="HH:MM"
                                    placeholderTextColor={muted}
                                    value={endTime}
                                    onChangeText={setEndTime}
                                    editable={!saving}
                                    maxLength={5}
                                />
                            </View>
                        </View>
                        <Text style={[styles.hint, { color: muted }]}>Use 24-hour format (e.g., 09:00, 18:30)</Text>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: tint, opacity: saving ? 0.6 : 1 }]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <IconSymbol name="checkmark.circle.fill" size={20} color="#fff" />
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Cancel Button */}
                    <TouchableOpacity
                        style={[styles.cancelButton, { borderColor: border }]}
                        onPress={() => router.back()}
                        disabled={saving}
                    >
                        <Text style={[styles.cancelButtonText, { color: text }]}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
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
    content: {
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        fontWeight: '500',
    },
    inputLarge: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
        fontWeight: '500',
        minHeight: 120,
    },
    charCount: {
        fontSize: 12,
        marginTop: 4,
        textAlign: 'right',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 12,
    },
    timeField: {
        flex: 1,
    },
    timeLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    timeInput: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        fontWeight: '500',
        textAlign: 'center',
    },
    divider: {
        marginBottom: 4,
        paddingBottom: 4,
    },
    dividerText: {
        fontSize: 13,
        fontWeight: '600',
    },
    hint: {
        fontSize: 12,
        marginTop: 6,
        fontStyle: 'italic',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        paddingVertical: 14,
        marginBottom: 12,
        gap: 8,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    cancelButton: {
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 24,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '700',
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
