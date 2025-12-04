import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator, Image } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, MapPressEvent } from 'react-native-maps';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { locationService, LocationType } from '@/services/location.service';
import { FilePicker } from '@/utils/file-picker';
import { fileService } from '@/services/file.service';
import { useThemeColor } from '@/hooks/use-theme-color';
import { buildImageUrl } from '@/utils/image-url';

const DEFAULT_REGION = {
    latitude: 27.533,
    longitude: 88.5122,
    latitudeDelta: 1.5,
    longitudeDelta: 1.5,
};

const LOCATION_TYPES: { label: string; value: LocationType }[] = [
    { label: 'Emergency', value: 'emergency' },
    { label: 'Local Help', value: 'localhelp' },
    { label: 'Business', value: 'business' },
    { label: 'Event', value: 'event' },
    { label: 'Tourism', value: 'tourism' },
    { label: 'Other', value: 'other' },
];

export default function EditPlaceScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const mapRef = useRef<MapView>(null);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [showMapModal, setShowMapModal] = useState(false);
    const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number } | null>(null);
    const [formData, setFormData] = useState<{
        name: string;
        description: string;
        short_description: string;
        latitude: string;
        longitude: string;
        type: LocationType;
        metadata: {
            images?: string[];
            panorama_360?: string;
            [key: string]: any;
        };
    }>({
        name: '',
        description: '',
        short_description: '',
        latitude: '',
        longitude: '',
        type: 'tourism' as LocationType,
        metadata: {},
    });

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    // Fetch place data on mount
    useEffect(() => {
        if (id) {
            fetchPlaceData();
        } else {
            Alert.alert('Error', 'No place ID provided', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        }
    }, [id]);

    const fetchPlaceData = async () => {
        if (!id) return;
        
        setFetchLoading(true);
        try {
            const resp = await locationService.get(id);
            if (resp.success && resp.data) {
                const place = resp.data;
                setFormData({
                    name: place.name,
                    description: place.description,
                    short_description: place.short_description,
                    latitude: String(place.position.x),
                    longitude: String(place.position.y),
                    type: place.type,
                    metadata: place.metadata || {},
                });
            } else {
                Alert.alert('Error', resp.message || 'Failed to fetch place data', [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            }
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to fetch place data', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } finally {
            setFetchLoading(false);
        }
    };

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

        if (!id) {
            Alert.alert('Error', 'No place ID available');
            return;
        }

        setLoading(true);
        try {
            const resp = await locationService.update(id, {
                name: formData.name,
                description: formData.description,
                short_description: formData.short_description,
                position: { x: lng, y: lat }, // x=longitude, y=latitude
                type: formData.type,
                metadata: formData.metadata,
            });

            if (resp.success) {
                Alert.alert('Success', 'Place updated successfully', [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            } else {
                Alert.alert('Error', resp.message || 'Failed to update place');
            }
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to update place');
        } finally {
            setLoading(false);
        }
    };

    const handleMapPress = (event: MapPressEvent) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        setSelectedCoords({ latitude, longitude });
    };

    const handleConfirmLocation = () => {
        if (selectedCoords) {
            setFormData({
                ...formData,
                latitude: selectedCoords.latitude.toFixed(6),
                longitude: selectedCoords.longitude.toFixed(6),
            });
            setShowMapModal(false);
        }
    };

    const openMapPicker = () => {
        // Initialize with existing coordinates if available
        if (formData.latitude && formData.longitude) {
            const lat = parseFloat(formData.latitude);
            const lng = parseFloat(formData.longitude);
            if (!isNaN(lat) && !isNaN(lng)) {
                setSelectedCoords({ latitude: lat, longitude: lng });
            }
        }
        setShowMapModal(true);
    };

    const handleUploadImages = async () => {
        try {
            const images = await FilePicker.pickImageWithSource({ 
                allowsMultipleSelection: true,
                allowsEditing: false 
            });
            
            if (images.length === 0) return;

            setUploadingImage(true);
            const uploadedUrls: string[] = [];

            for (const image of images) {
                try {
                    const formData = new FormData();
                    formData.append('file', {
                        uri: image.uri,
                        type: image.type,
                        name: image.name,
                    } as any);

                    const resp = await fileService.uploadFile({
                        file: {
                            uri: image.uri,
                            type: image.type,
                            name: image.name,
                        } as any,
                        fileName: image.name,
                        fileType: 'image',
                    });
                    
                    if (resp.success && resp.data) {
                        // Try multiple possible URL fields
                        const imageUrl = (resp.data as any).cdn_url || 
                                       (resp.data as any).url || 
                                       (resp.data as any).cdn_response?.cdnUrl ||
                                       (resp.data as any).cdn_response?.viewUrl;
                        
                        console.log('📤 Upload response:', resp.data);
                        console.log('📍 Extracted URL:', imageUrl);
                        
                        if (imageUrl) {
                            uploadedUrls.push(imageUrl);
                        }
                    }
                } catch (error) {
                    console.error('Failed to upload image:', error);
                }
            }

            if (uploadedUrls.length > 0) {
                const currentImages = formData.metadata?.images || [];
                const newImages = [...currentImages, ...uploadedUrls];
                
                console.log('📸 Current images:', currentImages);
                console.log('📸 Uploaded URLs:', uploadedUrls);
                console.log('📸 New images array:', newImages);
                
                setFormData(prev => ({
                    ...prev,
                    metadata: {
                        ...prev.metadata,
                        images: newImages,
                    },
                }));
                
                Alert.alert(
                    'Success', 
                    `Uploaded ${uploadedUrls.length} image(s).\n\nRemember to click Save to update the location!`,
                    [{ text: 'OK' }]
                );
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to upload images');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleUpload360Image = async () => {
        try {
            const images = await FilePicker.pickImageWithSource({ 
                allowsMultipleSelection: false,
                allowsEditing: false 
            });
            
            if (images.length === 0) return;
            
            const image = images[0];
            
            // Validate JPG format
            if (!image.name.toLowerCase().endsWith('.jpg') && !image.name.toLowerCase().endsWith('.jpeg')) {
                Alert.alert('Invalid Format', '360° images must be in JPG format');
                return;
            }

            // Validate 2:1 aspect ratio using Image.getSize
            setUploadingImage(true);
            
            Image.getSize(image.uri, async (width, height) => {
                const aspectRatio = width / height;
                const expectedRatio = 2.0;
                const tolerance = 0.1; // Allow 10% deviation
                
                if (Math.abs(aspectRatio - expectedRatio) > tolerance) {
                    setUploadingImage(false);
                    Alert.alert(
                        'Invalid Aspect Ratio',
                        `360° panorama images must have a 2:1 aspect ratio.\nYour image: ${width}x${height} (${aspectRatio.toFixed(2)}:1)`
                    );
                    return;
                }

                try {
                    const resp = await fileService.uploadFile({
                        file: {
                            uri: image.uri,
                            type: image.type,
                            name: image.name,
                        } as any,
                        fileName: image.name,
                        fileType: 'image',
                    });
                    
                    if (resp.success && resp.data) {
                        // Try multiple possible URL fields
                        const imageUrl = (resp.data as any).cdn_url || 
                                       (resp.data as any).url || 
                                       (resp.data as any).cdn_response?.cdnUrl ||
                                       (resp.data as any).cdn_response?.viewUrl;
                        
                        console.log('📤 360° Upload response:', resp.data);
                        console.log('📍 360° Extracted URL:', imageUrl);
                        
                        if (imageUrl) {
                            setFormData(prev => ({
                                ...prev,
                                metadata: {
                                    ...prev.metadata,
                                    panorama_360: imageUrl,
                                },
                            }));
                            Alert.alert(
                                'Success', 
                                "360° panorama uploaded successfully.\n\nRemember to click Save to update the location!",
                                [{ text: 'OK' }]
                            );
                        } else {
                            Alert.alert('Error', 'No URL returned from upload');
                        }
                    } else {
                        Alert.alert('Error', resp.message || 'Failed to upload 360° image');
                    }
                } catch (error) {
                    Alert.alert('Error', 'Failed to upload 360° image');
                } finally {
                    setUploadingImage(false);
                }
            }, (error) => {
                setUploadingImage(false);
                Alert.alert('Error', 'Failed to validate image dimensions');
            });
        } catch (error: any) {
            setUploadingImage(false);
            Alert.alert('Error', error.message || 'Failed to select image');
        }
    };

    const handleRemoveImage = (index: number) => {
        Alert.alert(
            'Remove Image',
            'Are you sure you want to remove this image?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        const currentImages = formData.metadata?.images || [];
                        const newImages = currentImages.filter((_: any, i: number) => i !== index);
                        setFormData({
                            ...formData,
                            metadata: {
                                ...formData.metadata,
                                images: newImages,
                            },
                        });
                    },
                },
            ]
        );
    };

    const handleRemove360Image = () => {
        Alert.alert(
            'Remove 360° Image',
            'Are you sure you want to remove the 360° panorama?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        const { panorama_360, ...restMetadata } = formData.metadata;
                        setFormData({
                            ...formData,
                            metadata: restMetadata,
                        });
                    },
                },
            ]
        );
    };

    if (fetchLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0a7ea4" />
                <Text style={styles.loadingText}>Loading place data...</Text>
            </View>
        );
    }

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
                <Text style={styles.headerTitle}>Edit Place</Text>
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

                    {/* Image Gallery Upload */}
                    <View style={styles.field}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.label}>Photo Gallery</Text>
                            <TouchableOpacity
                                style={[styles.uploadButton, uploadingImage && styles.uploadButtonDisabled]}
                                onPress={handleUploadImages}
                                disabled={uploadingImage}
                            >
                                <IconSymbol name="photo.badge.plus" size={16} color="#fff" />
                                <Text style={styles.uploadButtonText}>
                                    {uploadingImage ? 'Uploading...' : 'Add Photos'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {formData.metadata?.images && formData.metadata.images.length > 0 ? (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageGallery}>
                                {(() => {
                                    console.log('🖼️ Rendering gallery with images:', formData.metadata.images);
                                    return formData.metadata.images.map((raw: string, index: number) => {
                                        const url = buildImageUrl(raw);
                                        return (
                                            <View key={index} style={styles.imagePreviewContainer}>
                                                <Image source={{ uri: url }} style={styles.imagePreview} />
                                                <TouchableOpacity
                                                    style={styles.removeImageButton}
                                                    onPress={() => handleRemoveImage(index)}
                                                >
                                                    <IconSymbol name="xmark.circle.fill" size={24} color="#ef4444" />
                                                </TouchableOpacity>
                                            </View>
                                        );
                                    });
                                })()}
                            </ScrollView>
                        ) : (
                            <View style={styles.emptyGallery}>
                                <IconSymbol name="photo.stack" size={40} color="#9ca3af" />
                                <Text style={styles.emptyGalleryText}>No photos added yet</Text>
                            </View>
                        )}
                    </View>

                    {/* 360° Panorama Upload */}
                    <View style={styles.field}>
                        <View style={styles.sectionHeader}>
                            <View>
                                <Text style={styles.label}>360° Panorama</Text>
                                <Text style={styles.fieldHint}>Must be 2:1 aspect ratio, JPG format</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.uploadButton, uploadingImage && styles.uploadButtonDisabled]}
                                onPress={handleUpload360Image}
                                disabled={uploadingImage}
                            >
                                <IconSymbol name="rotate.3d" size={16} color="#fff" />
                                <Text style={styles.uploadButtonText}>
                                    {uploadingImage ? 'Uploading...' : 'Upload 360°'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {formData.metadata?.panorama_360 ? (
                            <View style={styles.panoramaPreviewContainer}>
                                <Image
                                    source={{ uri: buildImageUrl(formData.metadata.panorama_360) }}
                                    style={styles.panoramaPreview}
                                    resizeMode="cover"
                                />
                                <TouchableOpacity
                                    style={styles.removePanoramaButton}
                                    onPress={handleRemove360Image}
                                >
                                    <IconSymbol name="xmark.circle.fill" size={24} color="#ef4444" />
                                </TouchableOpacity>
                                <View style={styles.panoramaBadge}>
                                    <IconSymbol name="rotate.3d" size={16} color="#fff" />
                                    <Text style={styles.panoramaBadgeText}>360°</Text>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.emptyPanorama}>
                                <IconSymbol name="rotate.3d" size={40} color="#9ca3af" />
                                <Text style={styles.emptyPanoramaText}>No 360° panorama added</Text>
                                <Text style={styles.emptyPanoramaHint}>
                                    Add an equirectangular panorama for virtual tours
                                </Text>
                            </View>
                        )}
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
                        <TouchableOpacity style={styles.mapButton} onPress={openMapPicker}>
                            <IconSymbol name="map.fill" size={16} color="#0a7ea4" />
                            <Text style={styles.mapButtonText}>Pick from Map</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Map preview */}
                    {formData.latitude && formData.longitude && !isNaN(parseFloat(formData.latitude)) && !isNaN(parseFloat(formData.longitude)) ? (
                        <View style={styles.mapPreview}>
                            <MapView
                                style={styles.previewMap}
                                provider={PROVIDER_DEFAULT}
                                region={{
                                    latitude: parseFloat(formData.latitude),
                                    longitude: parseFloat(formData.longitude),
                                    latitudeDelta: 0.05,
                                    longitudeDelta: 0.05,
                                }}
                                scrollEnabled={false}
                                zoomEnabled={false}
                                pitchEnabled={false}
                                rotateEnabled={false}
                            >
                                <Marker
                                    coordinate={{
                                        latitude: parseFloat(formData.latitude),
                                        longitude: parseFloat(formData.longitude),
                                    }}
                                    pinColor="#0a7ea4"
                                />
                            </MapView>
                            <View style={styles.previewOverlay}>
                                <TouchableOpacity style={styles.editMapButton} onPress={openMapPicker}>
                                    <IconSymbol name="pencil" size={16} color="#fff" />
                                    <Text style={styles.editMapButtonText}>Edit Location</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.mapPlaceholder}>
                            <IconSymbol name="map.fill" size={48} color="#0a7ea4" />
                            <Text style={styles.mapPlaceholderText}>Map View</Text>
                            <Text style={styles.mapPlaceholderSubtext}>
                                Tap 'Pick from Map' to select location visually
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Map Picker Modal */}
            <Modal
                visible={showMapModal}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={() => setShowMapModal(false)}
            >
                <View style={styles.modalContainer}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowMapModal(false)}>
                            <IconSymbol name="xmark.circle.fill" size={32} color="#687076" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Pick Location</Text>
                        <TouchableOpacity
                            onPress={handleConfirmLocation}
                            disabled={!selectedCoords}
                            style={[styles.confirmButton, !selectedCoords && styles.confirmButtonDisabled]}
                        >
                            <Text style={[styles.confirmButtonText, !selectedCoords && styles.confirmButtonTextDisabled]}>
                                Confirm
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Map */}
                    <MapView
                        ref={mapRef}
                        style={styles.modalMap}
                        provider={PROVIDER_DEFAULT}
                        initialRegion={
                            selectedCoords
                                ? {
                                      ...selectedCoords,
                                      latitudeDelta: 0.05,
                                      longitudeDelta: 0.05,
                                  }
                                : DEFAULT_REGION
                        }
                        onPress={handleMapPress}
                        showsUserLocation={true}
                        showsMyLocationButton={true}
                    >
                        {selectedCoords && (
                            <Marker coordinate={selectedCoords} pinColor="#0a7ea4" />
                        )}
                    </MapView>

                    {/* Instructions */}
                    <View style={styles.instructions}>
                        <IconSymbol name="hand.tap.fill" size={24} color="#0a7ea4" />
                        <Text style={styles.instructionsText}>
                            Tap anywhere on the map to select a location
                        </Text>
                    </View>

                    {/* Selected Coordinates Display */}
                    {selectedCoords && (
                        <View style={styles.coordsDisplay}>
                            <View style={styles.coordsItem}>
                                <Text style={styles.coordsLabel}>Latitude</Text>
                                <Text style={styles.coordsValue}>{selectedCoords.latitude.toFixed(6)}</Text>
                            </View>
                            <View style={styles.coordsDivider} />
                            <View style={styles.coordsItem}>
                                <Text style={styles.coordsLabel}>Longitude</Text>
                                <Text style={styles.coordsValue}>{selectedCoords.longitude.toFixed(6)}</Text>
                            </View>
                        </View>
                    )}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        backgroundColor: '#f9fafb',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: '#687076',
        fontWeight: '500',
    },
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f9fafb',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
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
    mapPreview: {
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    previewMap: {
        width: '100%',
        height: '100%',
    },
    previewOverlay: {
        position: 'absolute',
        top: 12,
        right: 12,
    },
    editMapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#0a7ea4',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    editMapButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#11181C',
    },
    confirmButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#0a7ea4',
    },
    confirmButtonDisabled: {
        backgroundColor: '#d1d5db',
    },
    confirmButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    confirmButtonTextDisabled: {
        color: '#9ca3af',
    },
    modalMap: {
        flex: 1,
    },
    instructions: {
        position: 'absolute',
        top: 120,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    instructionsText: {
        flex: 1,
        fontSize: 14,
        color: '#11181C',
    },
    coordsDisplay: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    coordsItem: {
        flex: 1,
        alignItems: 'center',
    },
    coordsLabel: {
        fontSize: 12,
        color: '#687076',
        marginBottom: 4,
    },
    coordsValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#11181C',
    },
    coordsDivider: {
        width: 1,
        backgroundColor: '#e5e7eb',
        marginHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    fieldHint: {
        fontSize: 12,
        color: '#687076',
        marginTop: 2,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#0a7ea4',
    },
    uploadButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    uploadButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
    },
    imageGallery: {
        marginTop: 8,
    },
    imagePreviewContainer: {
        position: 'relative',
        marginRight: 12,
    },
    imagePreview: {
        width: 120,
        height: 120,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
    },
    removeImageButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#fff',
        borderRadius: 12,
    },
    emptyGallery: {
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyGalleryText: {
        fontSize: 14,
        color: '#687076',
        marginTop: 8,
    },
    panoramaPreviewContainer: {
        position: 'relative',
        marginTop: 8,
        borderRadius: 12,
        overflow: 'hidden',
    },
    panoramaPreview: {
        width: '100%',
        height: 150,
        backgroundColor: '#f3f4f6',
    },
    removePanoramaButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#fff',
        borderRadius: 12,
    },
    panoramaBadge: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
    },
    panoramaBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
    emptyPanorama: {
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyPanoramaText: {
        fontSize: 14,
        color: '#687076',
        marginTop: 8,
        fontWeight: '600',
    },
    emptyPanoramaHint: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 4,
        textAlign: 'center',
    },
});
