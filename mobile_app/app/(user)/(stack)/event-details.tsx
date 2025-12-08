import React, { useState, useEffect, useMemo } from 'react';
import { 
    StyleSheet, 
    Text, 
    View, 
    ScrollView, 
    TouchableOpacity, 
    TextInput,
    ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Event } from '@/services';
import { apiClient } from '@/services/api.client';
import Toast from 'react-native-toast-message';

export default function EventDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const border = useThemeColor('border');
    const tint = useThemeColor('tint');

    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Original values for change detection
    const [originalName, setOriginalName] = useState('');
    const [originalDescription, setOriginalDescription] = useState('');
    const [originalShortDescription, setOriginalShortDescription] = useState('');
    const [originalStartTime, setOriginalStartTime] = useState('');
    const [originalEndTime, setOriginalEndTime] = useState('');

    // Editable fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    // Check if any changes were made
    const hasChanges = useMemo(() => {
        return name !== originalName ||
               description !== originalDescription ||
               shortDescription !== originalShortDescription ||
               startTime !== originalStartTime ||
               endTime !== originalEndTime;
    }, [name, description, shortDescription, startTime, endTime, originalName, originalDescription, originalShortDescription, originalStartTime, originalEndTime]);

    useEffect(() => {
        loadEventDetails();
    }, [params.eventId]);

    const loadEventDetails = async () => {
        try {
            setLoading(true);
            const eventId = params.eventId as string;
            const response = await apiClient.get<Event>(`/business/${eventId}`);
            
            if (response.data) {
                setEvent(response.data);
                const evt = response.data;
                
                // Set both current and original values
                setName(evt.name || '');
                setDescription(evt.description || '');
                setShortDescription(evt.short_description || '');
                setStartTime(evt.open_hours?.start || '');
                setEndTime(evt.open_hours?.end || '');
                
                setOriginalName(evt.name || '');
                setOriginalDescription(evt.description || '');
                setOriginalShortDescription(evt.short_description || '');
                setOriginalStartTime(evt.open_hours?.start || '');
                setOriginalEndTime(evt.open_hours?.end || '');
            }
        } catch (error: any) {
            console.error('Failed to load event:', error);
            Toast.show({
                type: 'error',
                text1: 'Failed to load event',
                text2: error?.message || 'Please try again',
                position: 'bottom',
            });
            router.replace('/(user)/(stack)/schedule' as any);
        } finally {
            setLoading(false);
        }
    };

    const validateTimeFormat = (time: string): boolean => {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    };

    const handleUpdate = async () => {
        // Validation
        if (!name.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'Event name is required',
                position: 'bottom',
            });
            return;
        }

        if (!description.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'Description is required',
                position: 'bottom',
            });
            return;
        }

        if (!shortDescription.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'Short description is required',
                position: 'bottom',
            });
            return;
        }

        if (!startTime || !endTime) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'Opening hours are required',
                position: 'bottom',
            });
            return;
        }

        if (!validateTimeFormat(startTime)) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Time Format',
                text2: 'Start time must be in HH:MM format (24-hour)',
                position: 'bottom',
            });
            return;
        }

        if (!validateTimeFormat(endTime)) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Time Format',
                text2: 'End time must be in HH:MM format (24-hour)',
                position: 'bottom',
            });
            return;
        }

        try {
            setSaving(true);
            const updateData: any = {
                name: name.trim(),
                description: description.trim(),
                short_description: shortDescription.trim(),
                open_hours: {
                    start: startTime.trim(),
                    end: endTime.trim(),
                },
            };

            // Use id or _id field - backend returns 'id' from /business/me
            const eventId = (event as any).id || event?._id;
            const response = await apiClient.put(`/business/${eventId}`, updateData);

            if (response.data) {
                setEvent(response.data);
                
                // Update original values to match current
                setOriginalName(name);
                setOriginalDescription(description);
                setOriginalShortDescription(shortDescription);
                setOriginalStartTime(startTime);
                setOriginalEndTime(endTime);
                
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Event updated successfully',
                    position: 'bottom',
                });
                
                // Navigate back after a short delay
                //setTimeout(() => router.back(), 1000);
            }
        } catch (error: any) {
            console.error('Failed to update event:', error);
            Toast.show({
                type: 'error',
                text1: 'Update Failed',
                text2: error?.response?.data?.detail || 'Failed to update event',
                position: 'bottom',
            });
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateString?: string): string => {
        if (!dateString) return 'Not set';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return 'Invalid date';
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (approved?: boolean) => {
        return approved ? '#10b981' : '#f59e0b';
    };

    const getStatusText = (approved?: boolean) => {
        return approved ? 'Approved' : 'Pending Approval';
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: background, paddingTop: insets.top }]}>
                <View style={[styles.header, { borderBottomColor: border }]}>
                    <Text style={[styles.headerTitle, { color: text }]}>Event Status</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={tint} />
                    <Text style={[styles.loadingText, { color: muted }]}>Loading event...</Text>
                </View>
            </View>
        );
    }

    if (!event) {
        return null;
    }

    const formattedDate = event.scheduled_at 
        ? new Date(event.scheduled_at).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
          })
        : 'Not set';

    return (
        <View style={[styles.container, { backgroundColor: background, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: border }]}>
                <Text style={[styles.headerTitle, { color: text }]}>Event Status</Text>
            </View>

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Status Badge */}
                <View style={[styles.statusBadge, { 
                    backgroundColor: event.approved ? '#d1fae5' : '#fef3c7',
                    borderColor: event.approved ? '#10b981' : '#f59e0b',
                }]}>
                    <IconSymbol 
                        name={event.approved ? "checkmark.circle.fill" : "clock"} 
                        size={16} 
                        color={event.approved ? '#10b981' : '#f59e0b'} 
                    />
                    <Text style={[styles.statusText, { 
                        color: event.approved ? '#10b981' : '#f59e0b' 
                    }]}>
                        {event.approved ? 'Approved' : 'Pending Approval'}
                    </Text>
                </View>

                {/* Event Name */}
                <View style={styles.formSection}>
                    <Text style={[styles.label, { color: text }]}>Event Name *</Text>
                    <TextInput
                        style={[styles.input, { 
                            color: text, 
                            borderColor: border, 
                            backgroundColor: card 
                        }]}
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter event name"
                        placeholderTextColor={muted}
                        editable={!saving}
                    />
                </View>

                {/* Short Description */}
                <View style={styles.formSection}>
                    <Text style={[styles.label, { color: text }]}>Short Description *</Text>
                    <TextInput
                        style={[styles.input, { 
                            color: text, 
                            borderColor: border, 
                            backgroundColor: card 
                        }]}
                        value={shortDescription}
                        onChangeText={setShortDescription}
                        placeholder="Brief description"
                        placeholderTextColor={muted}
                        maxLength={255}
                        editable={!saving}
                    />
                    <Text style={[styles.charCount, { color: muted }]}>
                        {shortDescription.length}/255
                    </Text>
                </View>

                {/* Description */}
                <View style={styles.formSection}>
                    <Text style={[styles.label, { color: text }]}>Description *</Text>
                    <TextInput
                        style={[styles.textArea, { 
                            color: text, 
                            borderColor: border, 
                            backgroundColor: card 
                        }]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Enter detailed description"
                        placeholderTextColor={muted}
                        multiline
                        numberOfLines={5}
                        textAlignVertical="top"
                        editable={!saving}
                    />
                </View>

                {/* Scheduled Date (Read-only) */}
                <View style={styles.formSection}>
                    <Text style={[styles.label, { color: text }]}>Scheduled Date</Text>
                    <View style={[styles.readOnlyField, { 
                        borderColor: border, 
                        backgroundColor: `${muted}10` 
                    }]}>
                        <IconSymbol name="calendar" size={20} color={muted as string} />
                        <Text style={[styles.readOnlyText, { color: muted }]}>
                            {formattedDate}
                        </Text>
                    </View>
                </View>

                {/* Opening Hours */}
                <View style={styles.formSection}>
                    <Text style={[styles.label, { color: text }]}>Opening Hours *</Text>
                    <View style={styles.timeRow}>
                        <View style={styles.timeField}>
                            <Text style={[styles.timeLabel, { color: muted }]}>START TIME</Text>
                            <TextInput
                                style={[styles.timeInput, { 
                                    color: text, 
                                    borderColor: border, 
                                    backgroundColor: card 
                                }]}
                                value={startTime}
                                onChangeText={setStartTime}
                                placeholder="09:00"
                                placeholderTextColor={muted}
                                maxLength={5}
                                editable={!saving}
                            />
                        </View>
                        <View style={styles.timeDivider}>
                            <Text style={[styles.dividerText, { color: muted }]}>to</Text>
                        </View>
                        <View style={styles.timeField}>
                            <Text style={[styles.timeLabel, { color: muted }]}>END TIME</Text>
                            <TextInput
                                style={[styles.timeInput, { 
                                    color: text, 
                                    borderColor: border, 
                                    backgroundColor: card 
                                }]}
                                value={endTime}
                                onChangeText={setEndTime}
                                placeholder="17:00"
                                placeholderTextColor={muted}
                                maxLength={5}
                                editable={!saving}
                            />
                        </View>
                    </View>
                    <Text style={[styles.hint, { color: muted }]}>
                        Use 24-hour format (e.g., 09:00, 18:30)
                    </Text>
                </View>

                {/* Update Button */}
                <TouchableOpacity
                    style={[styles.updateButton, { 
                        backgroundColor: hasChanges && !saving ? tint : `${muted}40`,
                        opacity: hasChanges && !saving ? 1 : 0.5
                    }]}
                    onPress={handleUpdate}
                    disabled={!hasChanges || saving}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <IconSymbol name="checkmark.circle.fill" size={20} color="#fff" />
                            <Text style={styles.updateButtonText}>Update Event</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Metadata */}
                <View style={[styles.metadataCard, { backgroundColor: `${muted}10`, borderColor: border }]}>
                    <View style={styles.metadataRow}>
                        <Text style={[styles.metadataLabel, { color: muted }]}>Created:</Text>
                        <Text style={[styles.metadataValue, { color: text }]}>
                            {new Date(event.created_at).toLocaleDateString()}
                        </Text>
                    </View>
                    <View style={styles.metadataRow}>
                        <Text style={[styles.metadataLabel, { color: muted }]}>Last Updated:</Text>
                        <Text style={[styles.metadataValue, { color: text }]}>
                            {new Date(event.updated_at).toLocaleDateString()}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 16,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 24,
        gap: 6,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    formSection: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
    },
    input: {
        fontSize: 16,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontWeight: '500',
    },
    textArea: {
        fontSize: 16,
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        minHeight: 120,
        fontWeight: '500',
    },
    charCount: {
        fontSize: 12,
        marginTop: 4,
        textAlign: 'right',
    },
    readOnlyField: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 12,
        gap: 8,
    },
    readOnlyText: {
        fontSize: 16,
        fontWeight: '500',
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
        fontSize: 16,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        textAlign: 'center',
        fontWeight: '500',
    },
    timeDivider: {
        marginBottom: 8,
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
    updateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        paddingVertical: 14,
        marginTop: 8,
        marginBottom: 24,
        gap: 8,
    },
    updateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    metadataCard: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    metadataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    metadataLabel: {
        fontSize: 14,
    },
    metadataValue: {
        fontSize: 14,
        fontWeight: '500',
    },
});
