import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { locationService, LocationType } from '@/services/location.service';

const LOCATION_TYPES: { label: string; value: LocationType }[] = [
    { label: 'Emergency', value: 'emergency' },
    { label: 'Local Help', value: 'localhelp' },
    { label: 'Business', value: 'business' },
    { label: 'Event', value: 'event' },
    { label: 'Tourism', value: 'tourism' },
    { label: 'Other', value: 'other' },
];

export default function AddPlaceScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        short_description: '',
        latitude: '',
        longitude: '',
        type: 'tourism' as LocationType,
        metadata: {},
    });

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.description.trim() || !formData.short_description.trim()) {
            Alert.alert('Validation Error', 'Please fill in all required fields');
            return;
        }

        const lat = parseFloat(formData.latitude);
        const lng = parseFloat(formData.longitude);
        if (isNaN(lat) || isNaN(lng)) {
            Alert.alert('Validation Error', 'Please enter valid coordinates');
            return;
        }

        setLoading(true);
        try {
            const resp = await locationService.create({
                name: formData.name,
                description: formData.description,
                short_description: formData.short_description,
                position: { x: lat, y: lng },
                type: formData.type,
                metadata: formData.metadata,
            });

            if (resp.success) {
                Alert.alert('Success', 'Place added successfully', [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            } else {
                Alert.alert('Error', resp.message || 'Failed to add place');
            }
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to add place');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <IconSymbol name="chevron.left" size={24} color="#11181C" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add New Place</Text>
                <TouchableOpacity
                    style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.form}>
                    {/* Name */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Name *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter place name"
                            value={formData.name}
                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                        />
                    </View>

                    {/* Short Description */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Short Description *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Brief description (max 255 chars)"
                            value={formData.short_description}
                            onChangeText={(text) => setFormData({ ...formData, short_description: text })}
                            maxLength={255}
                        />
                    </View>

                    {/* Description */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Full Description *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Detailed description"
                            value={formData.description}
                            onChangeText={(text) => setFormData({ ...formData, description: text })}
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    {/* Type */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Type *</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                            {LOCATION_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type.value}
                                    style={[
                                        styles.typeChip,
                                        formData.type === type.value && styles.typeChipActive,
                                    ]}
                                    onPress={() => setFormData({ ...formData, type: type.value })}
                                >
                                    <Text
                                        style={[
                                            styles.typeChipText,
                                            formData.type === type.value && styles.typeChipTextActive,
                                        ]}
                                    >
                                        {type.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Coordinates */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Location Coordinates *</Text>
                        <View style={styles.coordRow}>
                            <View style={styles.coordField}>
                                <Text style={styles.coordLabel}>Latitude</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="27.3314"
                                    value={formData.latitude}
                                    onChangeText={(text) => setFormData({ ...formData, latitude: text })}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={styles.coordField}>
                                <Text style={styles.coordLabel}>Longitude</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="88.6138"
                                    value={formData.longitude}
                                    onChangeText={(text) => setFormData({ ...formData, longitude: text })}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                        <TouchableOpacity style={styles.mapButton}>
                            <IconSymbol name="map.fill" size={16} color="#0a7ea4" />
                            <Text style={styles.mapButtonText}>Pick from Map</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Map placeholder */}
                    <View style={styles.mapPlaceholder}>
                        <IconSymbol name="map.fill" size={48} color="#0a7ea4" />
                        <Text style={styles.mapPlaceholderText}>Map View</Text>
                        <Text style={styles.mapPlaceholderSubtext}>
                            Tap 'Pick from Map' to select location visually
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
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#11181C',
    },
    saveButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#0a7ea4',
    },
    saveButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    saveButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    form: {
        gap: 20,
    },
    field: {
        gap: 8,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#11181C',
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#11181C',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    typeScroll: {
        marginTop: 8,
    },
    typeChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginRight: 8,
    },
    typeChipActive: {
        backgroundColor: '#0a7ea4',
        borderColor: '#0a7ea4',
    },
    typeChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#687076',
    },
    typeChipTextActive: {
        color: '#fff',
    },
    coordRow: {
        flexDirection: 'row',
        gap: 12,
    },
    coordField: {
        flex: 1,
        gap: 6,
    },
    coordLabel: {
        fontSize: 13,
        color: '#687076',
    },
    mapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        marginTop: 8,
        borderRadius: 8,
        backgroundColor: '#e8f4f8',
    },
    mapButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0a7ea4',
    },
    mapPlaceholder: {
        backgroundColor: '#e8f4f8',
        borderRadius: 12,
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mapPlaceholderText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#11181C',
        marginTop: 12,
    },
    mapPlaceholderSubtext: {
        fontSize: 13,
        color: '#687076',
        marginTop: 4,
        textAlign: 'center',
    },
});
