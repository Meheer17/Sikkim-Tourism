import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { businessService, BusinessType } from '@/services/business.service';
import { servicesService } from '@/services';
import { BUSINESS_TYPES } from '@/constants/businessTypes';
import { TYPE_FIELD_CONFIG, FieldDescriptor } from '@/constants/serviceFieldConfig';
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
    const [price, setPrice] = useState('0');
    const [userBusinesses, setUserBusinesses] = useState<any[]>([]);
    const [selectedBusinessId, setSelectedBusinessId] = useState('');
    const [metadataItems, setMetadataItems] = useState<Array<{ key: string; value: string }>>([]);
    const [extraFieldValues, setExtraFieldValues] = useState<Record<string, string>>({});
    const [loadingTypes, setLoadingTypes] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadBusinessTypes();
        loadUserBusinesses();
    }, []);

    const loadBusinessTypes = async () => {
        try {
            setLoadingTypes(true);
            const response = await businessService.getTypes();
            const types = response.data || [];
            // Prefer server types, but fall back to hardcoded list when empty
            const finalTypes = types.length > 0 ? types : BUSINESS_TYPES;
            setBusinessTypes(finalTypes);
            if (finalTypes.length > 0) {
                setSelectedTypeId(finalTypes[0].id);
            }
        } catch (error) {
            console.error('Failed to load business types:', error);
            Alert.alert('Error', 'Failed to load business types');
        } finally {
            setLoadingTypes(false);
        }
    };

    const loadUserBusinesses = async () => {
        try {
            const resp = await businessService.mine({ skip: 0, limit: 50 });
            const items = resp.data || [];
            setUserBusinesses(items);
            if (items.length > 0) {
                setSelectedBusinessId(items[0].id);
            }
        } catch (error) {
            console.error('Failed to load user businesses:', error);
        }
    };

    const handleSubmit = async () => {
        if (!name.trim() || !description.trim() || !shortDescription.trim() || !selectedTypeId) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (!selectedBusinessId) {
            Alert.alert('Error', 'Please select a business to attach this service to');
            return;
        }

        const parsedPrice = Number(price);
        if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
            Alert.alert('Error', 'Please enter a valid non-negative price');
            return;
        }

        setSubmitting(true);
        try {
            // Build metadata array: include open_hours and position as objects, then extra fields and arbitrary metadata
            const metaArray: Array<Record<string, any>> = [];
            metaArray.push({ open_hours: { start: startTime, end: endTime } });
            metaArray.push({ position: { x: latitude || undefined, y: longitude || undefined } });

            // Add extra fields based on selected type, transforming values according to field type
            const selectedType = businessTypes.find(t => t.id === selectedTypeId)?.type;
            const extraFieldsConfig: FieldDescriptor[] = selectedType ? (TYPE_FIELD_CONFIG[selectedType] || []) : [];
            Object.keys(extraFieldValues).forEach((k) => {
                const v = extraFieldValues[k];
                if (v === undefined || v === null || v === '') return;

                const fd = extraFieldsConfig.find(x => x.key === k);
                if (!fd) {
                    metaArray.push({ [k]: v });
                    return;
                }

                // Transform based on descriptor
                if (fd.type === 'number') {
                    const num = Number(v);
                    if (!Number.isNaN(num)) metaArray.push({ [k]: num });
                } else if (fd.type === 'tags') {
                    const arr = String(v).split(',').map(s => s.trim()).filter(Boolean);
                    metaArray.push({ [k]: arr });
                } else if (fd.type === 'json') {
                    try {
                        const parsed = JSON.parse(v);
                        metaArray.push({ [k]: parsed });
                    } catch (e) {
                        // Fallback to raw string if JSON invalid
                        metaArray.push({ [k]: v });
                    }
                } else {
                    metaArray.push({ [k]: v });
                }
            });

            // Add arbitrary metadata key/value pairs
            metadataItems.forEach((m) => {
                if (m.key && m.value) {
                    metaArray.push({ [m.key]: m.value });
                }
            });

            const payload = {
                name: name.trim(),
                price: parsedPrice,
                bid: selectedBusinessId,
                description: description.trim(),
                short_description: shortDescription.trim(),
                features: [],
                metadata: metaArray,
            };

            const resp = await servicesService.create(payload as any);

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
                                    <Picker.Item key={type.id} label={type.type} value={type.id} />
                                ))}
                            </Picker>
                        </View>
                    )}

                    <Text style={[styles.label, { color: text }]}>Attach To Business *</Text>
                    <View style={[styles.pickerContainer, { backgroundColor: background, marginTop: 8 }]}> 
                        <Picker
                            selectedValue={selectedBusinessId}
                            onValueChange={(v) => setSelectedBusinessId(v)}
                            style={[styles.picker, { color: text }]}
                        >
                            {userBusinesses.map((b) => (
                                <Picker.Item key={b.id} label={b.name} value={b.id} />
                            ))}
                        </Picker>
                    </View>

                    <Text style={[styles.label, { color: text }]}>Price *</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: background, color: text }]}
                        placeholder="Enter price"
                        placeholderTextColor={muted}
                        value={price}
                        onChangeText={setPrice}
                        keyboardType="numeric"
                    />

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

                    {/* Dynamic configured fields for the selected business type (optional) */}
                    <Text style={[styles.sectionTitle, { color: text, marginTop: 20 }]}>Additional Details (optional)</Text>
                    {(() => {
                        const selectedType = businessTypes.find(t => t.id === selectedTypeId)?.type;
                        const extraFields: FieldDescriptor[] = selectedType ? (TYPE_FIELD_CONFIG[selectedType] || []) : [];
                        return (
                            <View>
                                {extraFields.map((f) => {
                                    // Don't re-render common mandatory fields (they are top-level inputs)
                                    if ([ 'name', 'price', 'bid', 'description', 'features', 'short_description' ].includes(f.key)) {
                                        return null;
                                    }

                                    const value = extraFieldValues[f.key] || '';

                                    return (
                                        <View key={f.key} style={{ marginTop: 8 }}>
                                            <Text style={[styles.label, { color: text }]}>{f.label}</Text>
                                            {f.type === 'longtext' || f.type === 'json' ? (
                                                <TextInput
                                                    style={[styles.textArea, { backgroundColor: background, color: text }]}
                                                    placeholder={f.placeholder}
                                                    placeholderTextColor={muted}
                                                    value={value}
                                                    onChangeText={(v) => setExtraFieldValues(prev => ({ ...prev, [f.key]: v }))}
                                                    multiline
                                                    numberOfLines={4}
                                                />
                                            ) : f.type === 'number' ? (
                                                <TextInput
                                                    style={[styles.input, { backgroundColor: background, color: text }]}
                                                    placeholder={f.placeholder}
                                                    placeholderTextColor={muted}
                                                    value={value}
                                                    onChangeText={(v) => setExtraFieldValues(prev => ({ ...prev, [f.key]: v }))}
                                                    keyboardType="numeric"
                                                />
                                            ) : f.type === 'tags' ? (
                                                <TextInput
                                                    style={[styles.input, { backgroundColor: background, color: text }]}
                                                    placeholder={f.placeholder}
                                                    placeholderTextColor={muted}
                                                    value={value}
                                                    onChangeText={(v) => setExtraFieldValues(prev => ({ ...prev, [f.key]: v }))}
                                                />
                                            ) : f.type === 'select' ? (
                                                <View style={[styles.pickerContainer, { marginTop: 8 }]}> 
                                                    <Picker
                                                        selectedValue={value}
                                                        onValueChange={(v) => setExtraFieldValues(prev => ({ ...prev, [f.key]: v }))}
                                                        style={[styles.picker, { color: text }]}
                                                    >
                                                        {(f.options || []).map(opt => (
                                                            <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                                                        ))}
                                                    </Picker>
                                                </View>
                                            ) : f.type === 'datetime' ? (
                                                <TextInput
                                                    style={[styles.input, { backgroundColor: background, color: text }]}
                                                    placeholder={f.placeholder || 'YYYY-MM-DDTHH:MM:SSZ'}
                                                    placeholderTextColor={muted}
                                                    value={value}
                                                    onChangeText={(v) => setExtraFieldValues(prev => ({ ...prev, [f.key]: v }))}
                                                />
                                            ) : (
                                                <TextInput
                                                    style={[styles.input, { backgroundColor: background, color: text }]}
                                                    placeholder={f.placeholder}
                                                    placeholderTextColor={muted}
                                                    value={value}
                                                    onChangeText={(v) => setExtraFieldValues(prev => ({ ...prev, [f.key]: v }))}
                                                />
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        );
                    })()}

                    {/* Metadata array: arbitrary key/value pairs */}
                    <Text style={[styles.sectionTitle, { color: text, marginTop: 20 }]}>Metadata</Text>
                    {metadataItems.map((m, idx) => (
                        <View key={`${m.key}-${idx}`} style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                            <TextInput
                                style={[styles.input, { flex: 1, backgroundColor: background, color: text }]}
                                placeholder="key"
                                placeholderTextColor={muted}
                                value={m.key}
                                onChangeText={(v) => setMetadataItems(prev => prev.map((it, i) => i === idx ? { ...it, key: v } : it))}
                            />
                            <TextInput
                                style={[styles.input, { flex: 1, backgroundColor: background, color: text }]}
                                placeholder="value"
                                placeholderTextColor={muted}
                                value={m.value}
                                onChangeText={(v) => setMetadataItems(prev => prev.map((it, i) => i === idx ? { ...it, value: v } : it))}
                            />
                            <TouchableOpacity onPress={() => setMetadataItems(prev => prev.filter((_, i) => i !== idx))} style={{ justifyContent: 'center' }}>
                                <IconSymbol name="trash" size={20} color={tint} />
                            </TouchableOpacity>
                        </View>
                    ))}

                    <TouchableOpacity onPress={() => setMetadataItems(prev => [...prev, { key: '', value: '' }])} style={{ marginTop: 12 }}>
                        <Text style={{ color: tint, fontWeight: '600' }}>+ Add metadata field</Text>
                    </TouchableOpacity>
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
