import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { businessService, BusinessType } from '@/services/business.service';
import { locationService } from '@/services/location.service';
import { Picker } from '@react-native-picker/picker';

export default function AddServiceScreen() {
    const router = useRouter();
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
    const [selectedTypeId, setSelectedTypeId] = useState('');
    const [loadingTypes, setLoadingTypes] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadBusinessTypes();
    }, []);

    const loadBusinessTypes = async () => {
        try {
            setLoadingTypes(true);
            const response = await businessService.getTypes();
            const types = response.data || [];
            setBusinessTypes(types);
            if (types.length > 0) {
                setSelectedTypeId(types[0].id);
            }
        } catch (error) {
            console.error('Failed to load business types:', error);
            Alert.alert('Error', 'Failed to load business types');
        } finally {
            setLoadingTypes(false);
        }
    };

    const handleSubmit = async () => {
        if (!name.trim() || !description.trim() || !shortDescription.trim() || !selectedTypeId) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            const resp = await businessService.create({
                name: name.trim(),
                description: description.trim(),
                short_description: shortDescription.trim(),
                open_hours: { start: startTime, end: endTime },
                type_id: selectedTypeId,
                l_id: undefined,
                scheduled_at: new Date().toISOString(),
            });

            if (resp.success) {
                Alert.alert('Success', 'Service created successfully and pending admin approval', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('Error', resp.message || 'Failed to create service');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            <View style={[styles.header, { backgroundColor: card }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={24} color={text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: text }]}>Add Service</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                <View style={[styles.card, { backgroundColor: card }]}>
                    <Text style={[styles.label, { color: text }]}>Service Name *</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: background, color: text }]}
                        placeholder="Enter service name"
                        placeholderTextColor={muted}
                        value={name}
                        onChangeText={setName}
                    />

                    <Text style={[styles.label, { color: text }]}>Business Type *</Text>
                    {loadingTypes ? (
                        <View style={[styles.input, { backgroundColor: background, justifyContent: 'center' }]}>
                            <ActivityIndicator size="small" color={tint as string} />
                        </View>
                    ) : (
                        <View style={[styles.pickerContainer, { backgroundColor: background }]}>
                            <Picker
                                selectedValue={selectedTypeId}
                                onValueChange={(itemValue) => setSelectedTypeId(itemValue)}
                                style={[styles.picker, { color: text }]}
                            >
                                {businessTypes.map((type) => (
                                    <Picker.Item key={type.id} label={type.category} value={type.id} />
                                ))}
                            </Picker>
                        </View>
                    )}

                    <Text style={[styles.label, { color: text }]}>Short Description *</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: background, color: text }]}
                        placeholder="Brief description (max 255 chars)"
                        placeholderTextColor={muted}
                        value={shortDescription}
                        onChangeText={setShortDescription}
                        maxLength={255}
                    />

                    <Text style={[styles.label, { color: text }]}>Description *</Text>
                    <TextInput
                        style={[styles.textArea, { backgroundColor: background, color: text }]}
                        placeholder="Detailed description"
                        placeholderTextColor={muted}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                    />

                    <Text style={[styles.sectionTitle, { color: text }]}>Operating Hours</Text>
                    <View style={styles.timeRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, { color: text }]}>Start Time</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: background, color: text }]}
                                placeholder="09:00"
                                placeholderTextColor={muted}
                                value={startTime}
                                onChangeText={setStartTime}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, { color: text }]}>End Time</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: background, color: text }]}
                                placeholder="17:00"
                                placeholderTextColor={muted}
                                value={endTime}
                                onChangeText={setEndTime}
                            />
                        </View>
                    </View>

                    <Text style={[styles.sectionTitle, { color: text }]}>Location</Text>
                    <Text style={[styles.label, { color: text }]}>Latitude *</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: background, color: text }]}
                        placeholder="e.g., 27.3314"
                        placeholderTextColor={muted}
                        value={latitude}
                        onChangeText={setLatitude}
                        keyboardType="numeric"
                    />

                    <Text style={[styles.label, { color: text }]}>Longitude *</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: background, color: text }]}
                        placeholder="e.g., 88.6138"
                        placeholderTextColor={muted}
                        value={longitude}
                        onChangeText={setLongitude}
                        keyboardType="numeric"
                    />
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: tint }]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitText}>Create Service</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
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
    backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '600', flex: 1, textAlign: 'center', marginHorizontal: 8 },
    placeholder: { width: 40 },
    scrollView: { flex: 1 },
    content: { padding: 16, paddingBottom: 40 },
    card: { borderRadius: 16, padding: 20, marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 8 },
    pickerContainer: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    input: {
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    textArea: {
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        minHeight: 100,
        textAlignVertical: 'top',
    },
    timeRow: { flexDirection: 'row', gap: 12 },
    submitButton: {
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    submitText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
