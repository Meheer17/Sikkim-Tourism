import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { businessService, BusinessType } from '@/services/business.service';
import { Picker } from '@react-native-picker/picker';
import Toast from 'react-native-toast-message';

export default function CreateBusinessScreen() {
    const router = useRouter();

    const [submitting, setSubmitting] = useState(false);
    const [name, setName] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [scheduledAt, setScheduledAt] = useState('');
    const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
    const [selectedTypeId, setSelectedTypeId] = useState('');
    const [loadingTypes, setLoadingTypes] = useState(true);

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    useEffect(() => {
        loadBusinessTypes();
        // Set default scheduled_at to current date in ISO format
        setScheduledAt(new Date().toISOString());
    }, []);

    const loadBusinessTypes = async () => {
        try {
            setLoadingTypes(true);
            const response = await businessService.getTypes();
            const types = response.data || [];
            setBusinessTypes(types);
            // Auto-select first type if available
            if (types.length > 0) {
                setSelectedTypeId(types[0]._id);
            }
        } catch (error) {
            console.error('Failed to load business types:', error);
            Alert.alert('Error', 'Failed to load business types. Please try again.');
        } finally {
            setLoadingTypes(false);
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (!name.trim()) {
            Alert.alert('Validation Error', 'Business name is required');
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
        if (!selectedTypeId) {
            Alert.alert('Validation Error', 'Please select a business type');
            return;
        }

        setSubmitting(true);
        try {
            const businessData = {
                name: name.trim(),
                short_description: shortDescription.trim(),
                description: description.trim(),
                open_hours: { start: startTime, end: endTime },
                type_id: selectedTypeId,
                scheduled_at: scheduledAt || new Date().toISOString(),
            };

            const resp = await businessService.create(businessData);
            if (resp.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Business created successfully! Awaiting approval.',
                });
                router.back();
            } else {
                Alert.alert('Error', resp.message || 'Failed to create business');
            }
        } catch (error: any) {
            console.error('Create business error:', error);
            Alert.alert('Error', error.message || 'Failed to create business');
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingTypes) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: background }]}>
                <ActivityIndicator size="large" color={tint} />
                <Text style={[styles.loadingText, { color: muted }]}>Loading business types...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Header */}
            <View style={[styles.header, { backgroundColor: card }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={24} color={text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: text }]}>Create Business</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={[styles.card, { backgroundColor: card }]}>
                    <View style={[styles.infoBox, { backgroundColor: '#e0f2fe' }]}>
                        <IconSymbol name="info.circle.fill" size={20} color="#0284c7" />
                        <Text style={[styles.infoText, { color: '#0c4a6e' }]}>
                            Your business will be reviewed by an admin before it appears publicly.
                        </Text>
                    </View>

                    <Text style={[styles.label, { color: text }]}>Business Name *</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: background, color: text }]}
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter business name"
                        placeholderTextColor={muted}
                    />

                    <Text style={[styles.label, { color: text }]}>Short Description *</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: background, color: text }]}
                        value={shortDescription}
                        onChangeText={setShortDescription}
                        placeholder="Brief description (max 100 characters)"
                        placeholderTextColor={muted}
                        maxLength={100}
                    />
                    <Text style={[styles.charCount, { color: muted }]}>
                        {shortDescription.length}/100
                    </Text>

                    <Text style={[styles.label, { color: text }]}>Description *</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { backgroundColor: background, color: text }]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Full description of your business"
                        placeholderTextColor={muted}
                        multiline
                        numberOfLines={6}
                    />

                    <Text style={[styles.label, { color: text }]}>Business Type *</Text>
                    <View style={[styles.pickerContainer, { backgroundColor: background }]}>
                        <Picker
                            selectedValue={selectedTypeId}
                            onValueChange={setSelectedTypeId}
                            style={[styles.picker, { color: text }]}
                        >
                            <Picker.Item label="Select business type" value="" />
                            {businessTypes.map((type) => (
                                <Picker.Item key={type._id} label={type.name} value={type._id} />
                            ))}
                        </Picker>
                    </View>

                    <Text style={[styles.label, { color: text }]}>Opening Hours</Text>
                    <View style={styles.hoursRow}>
                        <View style={styles.hoursItem}>
                            <Text style={[styles.hoursLabel, { color: muted }]}>Start Time</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: background, color: text }]}
                                value={startTime}
                                onChangeText={setStartTime}
                                placeholder="09:00"
                                placeholderTextColor={muted}
                            />
                        </View>
                        <View style={styles.hoursItem}>
                            <Text style={[styles.hoursLabel, { color: muted }]}>End Time</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: background, color: text }]}
                                value={endTime}
                                onChangeText={setEndTime}
                                placeholder="17:00"
                                placeholderTextColor={muted}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: tint, opacity: submitting ? 0.7 : 1 }]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <IconSymbol name="checkmark.circle.fill" size={20} color="#fff" />
                                <Text style={styles.buttonText}>Create Business</Text>
                            </>
                        )}
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
    loadingText: {
        marginTop: 12,
        fontSize: 14,
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
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 8,
    },
    placeholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    card: {
        margin: 16,
        borderRadius: 16,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    infoBox: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        gap: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    charCount: {
        fontSize: 12,
        textAlign: 'right',
        marginTop: 4,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    hoursRow: {
        flexDirection: 'row',
        gap: 12,
    },
    hoursItem: {
        flex: 1,
    },
    hoursLabel: {
        fontSize: 14,
        marginBottom: 4,
    },
    button: {
        flexDirection: 'row',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        gap: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
