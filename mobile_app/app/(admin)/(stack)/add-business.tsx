import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { businessService } from '@/services/business.service';
import { locationService, LocationModel } from '@/services/location.service';
import { FilePicker, PickedFile } from '@/utils/file-picker';
import { fileService } from '@/services/file.service';

export default function AddBusinessScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [locations, setLocations] = useState<LocationModel[]>([]);
    const [pickedFiles, setPickedFiles] = useState<PickedFile[]>([]);
    const [pickingImage, setPickingImage] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        short_description: '',
        open_hours_start: '',
        open_hours_end: '',
        type_id: '', // business_TYPE._id (placeholder for now)
        l_id: '',
        scheduled_at: new Date().toISOString(),
    });

    useEffect(() => {
        // Load locations for dropdown
        const loadLocations = async () => {
            try {
                const resp = await locationService.list({ skip: 0, limit: 100 });
                if (resp.success && resp.data) {
                    setLocations(resp.data);
                    if (resp.data.length > 0) {
                        setFormData({ ...formData, l_id: resp.data[0].id });
                    }
                }
            } catch (e) {
                console.warn('Failed to load locations:', e);
            }
        };
        loadLocations();
    }, []);

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.description.trim() || !formData.short_description.trim()) {
            Alert.alert('Validation Error', 'Please fill in all required fields');
            return;
        }

        if (!formData.open_hours_start || !formData.open_hours_end) {
            Alert.alert('Validation Error', 'Please specify opening hours');
            return;
        }

        if (!formData.l_id) {
            Alert.alert('Validation Error', 'Please select a location');
            return;
        }

        setLoading(true);
        try {
            // Step 1: Upload picked files first (if any)
            let uploadedIdentifiers: string[] = [];
            if (pickedFiles && pickedFiles.length > 0) {
                try {
                    console.log('📁 pickedFiles before upload (admin):', pickedFiles);
                    for (const image of pickedFiles) {
                        const ext = FilePicker.getFileExtension(image.name) || 'jpg';
                        const newFileName = `img_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;

                        const uploadResp = await fileService.uploadFile({
                            file: {
                                uri: image.uri,
                                type: image.type,
                                name: newFileName,
                            } as any,
                            fileName: newFileName,
                            fileType: 'image',
                        });

                        console.log('📤 admin uploadResp for', image.name, ':', uploadResp);

                        if (uploadResp.success && uploadResp.data) {
                            const idOrName = (uploadResp.data as any).fileName || (uploadResp.data as any).url || (uploadResp.data as any).id;
                            if (idOrName) uploadedIdentifiers.push(idOrName);
                            console.log('🆔 admin Collected identifier:', idOrName);
                        }
                    }
                } catch (uploadErr: any) {
                    console.error('Image upload failed:', uploadErr);
                    Alert.alert('Upload Error', uploadErr?.message || 'Failed to upload image(s). Aborting creation.');
                    setLoading(false);
                    return;
                }
            }

            // Step 2: Create the business
            const resp = await businessService.create({
                name: formData.name,
                description: formData.description,
                short_description: formData.short_description,
                open_hours: { start: formData.open_hours_start, end: formData.open_hours_end },
                type_id: formData.type_id || '000000000000000000000000', // Placeholder
                l_id: formData.l_id,
                scheduled_at: formData.scheduled_at,
            });
            console.log('🏗️ admin business create response:', resp);

            if (resp.success) {
                // Step 3: Update location metadata with uploadedIdentifiers (overwrite images array)
                try {
                    const l_id = (resp.data as any)?.l_id || formData.l_id || (resp.data as any)?.id;
                    console.log('🔎 admin l_id to update:', l_id, 'uploadedIdentifiers:', uploadedIdentifiers);
                    if (l_id && uploadedIdentifiers.length > 0) {
                        const before = await locationService.get(String(l_id));
                        console.log('📥 admin location before update:', before);

                        const updateResp = await locationService.update(String(l_id), {
                            metadata: {
                                images: uploadedIdentifiers,
                            },
                        });
                        console.log('✅ admin location update response:', updateResp);

                        const after = await locationService.get(String(l_id));
                        console.log('📤 admin location after update:', after);
                    }
                } catch (metaErr: any) {
                    console.error('Failed to update location metadata:', metaErr);
                }

                Alert.alert('Success', 'Business added successfully', [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            } else {
                Alert.alert('Error', resp.message || 'Failed to add business');
            }
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to add business');
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
                <Text style={styles.headerTitle}>Add Business</Text>
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
                        <Text style={styles.label}>Business Name *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter business name"
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

                    {/* Opening Hours */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Opening Hours *</Text>
                        <View style={styles.hoursRow}>
                            <View style={styles.hoursField}>
                                <Text style={styles.hoursLabel}>Start (HH:MM)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="09:00"
                                    value={formData.open_hours_start}
                                    onChangeText={(text) => setFormData({ ...formData, open_hours_start: text })}
                                />
                            </View>
                            <View style={styles.hoursField}>
                                <Text style={styles.hoursLabel}>End (HH:MM)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="18:00"
                                    value={formData.open_hours_end}
                                    onChangeText={(text) => setFormData({ ...formData, open_hours_end: text })}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Location */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Location *</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {locations.map((loc) => (
                                <TouchableOpacity
                                    key={loc.id}
                                    style={[
                                        styles.locationChip,
                                        formData.l_id === loc.id && styles.locationChipActive,
                                    ]}
                                    onPress={() => setFormData({ ...formData, l_id: loc.id })}
                                >
                                    <Text
                                        style={[
                                            styles.locationChipText,
                                            formData.l_id === loc.id && styles.locationChipTextActive,
                                        ]}
                                    >
                                        {loc.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Scheduled At */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Scheduled At (ISO 8601)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="2024-12-01T10:00:00Z"
                            value={formData.scheduled_at}
                            onChangeText={(text) => setFormData({ ...formData, scheduled_at: text })}
                        />
                    </View>

                    {/* Image picker */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Business Photo</Text>
                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                            <TouchableOpacity
                                style={[styles.pickButton, { flex: 1 }]}
                                onPress={async () => {
                                    try {
                                        setPickingImage(true);
                                        const images = await FilePicker.pickImageWithSource({ allowsMultipleSelection: false, allowsEditing: false });
                                        if (images && images.length > 0) {
                                            setPickedFiles(images);
                                        }
                                    } catch (err: any) {
                                        Alert.alert('Error', err?.message || 'Failed to pick image');
                                    } finally {
                                        setPickingImage(false);
                                    }
                                }}
                            >
                                <Text style={styles.pickButtonText}>{pickingImage ? 'Picking...' : (pickedFiles.length > 0 ? 'Change Photo' : 'Pick Photo')}</Text>
                            </TouchableOpacity>

                            {pickedFiles.length > 0 && (
                                <TouchableOpacity
                                    style={styles.removeButtonSmall}
                                    onPress={() => setPickedFiles([])}
                                >
                                    <Text style={styles.removeButtonTextSmall}>Remove</Text>
                                </TouchableOpacity>
                            )}
                        </View>
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
    hoursRow: {
        flexDirection: 'row',
        gap: 12,
    },
    hoursField: {
        flex: 1,
        gap: 6,
    },
    hoursLabel: {
        fontSize: 13,
        color: '#687076',
    },
    locationChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginRight: 8,
    },
    locationChipActive: {
        backgroundColor: '#0a7ea4',
        borderColor: '#0a7ea4',
    },
    locationChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#687076',
    },
    locationChipTextActive: {
        color: '#fff',
    },
    pickButton: {
        backgroundColor: '#0a7ea4',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pickButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    removeButtonSmall: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#ef4444',
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeButtonTextSmall: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
});
