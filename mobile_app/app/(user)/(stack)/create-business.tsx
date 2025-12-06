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
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { businessService, BusinessType } from '@/services/business.service';
import { FilePicker, PickedFile } from '@/utils/file-picker';
import { fileService } from '@/services';
import { locationService } from '@/services';
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
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
    const [selectedTypeId, setSelectedTypeId] = useState('');
    const [loadingTypes, setLoadingTypes] = useState(true);
    const [showMap, setShowMap] = useState(false);
    const [mapRegion, setMapRegion] = useState({
        latitude: 27.3314, // Default to Sikkim coordinates
        longitude: 88.6138,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
    });
    const [markerPosition, setMarkerPosition] = useState<{ latitude: number; longitude: number } | null>(null);
    const [selectedImages, setSelectedImages] = useState<PickedFile[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    useEffect(() => {
        loadBusinessTypes();
        requestLocationPermission();
        // Set default scheduled_at to current date in ISO format
        setScheduledAt(new Date().toISOString());
    }, []);

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                const { latitude: lat, longitude: lng } = location.coords;
                setMapRegion({
                    latitude: lat,
                    longitude: lng,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                });
            }
        } catch (error) {
            console.log('Location permission error:', error);
        }
    };

    const loadBusinessTypes = async () => {
        try {
            setLoadingTypes(true);
            const response = await businessService.getTypes();
            const types = response.data || [];
            console.log('Business types response:', JSON.stringify(types, null, 2));
            setBusinessTypes(types);
            // Auto-select first type if available
            if (types.length > 0) {
                const firstId = types[0].id || (types[0] as any)._id;
                console.log('Auto-selecting first type:', firstId, types[0]);
                setSelectedTypeId(firstId);
            }
        } catch (error) {
            console.error('Failed to load business types:', error);
            Alert.alert('Error', 'Failed to load business types. Please try again.');
        } finally {
            setLoadingTypes(false);
        }
    };

    const handleMapPress = (event: any) => {
        const { latitude: lat, longitude: lng } = event.nativeEvent.coordinate;
        setMarkerPosition({ latitude: lat, longitude: lng });
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
    };

    const handleUseCurrentLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required to use this feature');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const { latitude: lat, longitude: lng } = location.coords;
            
            setLatitude(lat.toFixed(6));
            setLongitude(lng.toFixed(6));
            setMarkerPosition({ latitude: lat, longitude: lng });
            setMapRegion({
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            });

            Toast.show({
                type: 'success',
                text1: 'Location Set',
                text2: 'Current location has been set',
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to get current location');
        }
    };

    const handleManualCoordinateChange = () => {
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        
        if (!isNaN(lat) && !isNaN(lng)) {
            setMarkerPosition({ latitude: lat, longitude: lng });
            setMapRegion({
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            });
        }
    };

    const handlePickImages = async () => {
        try {
            const picked = await FilePicker.pickFilesWithValidation('image', true);
            if (picked && picked.length > 0) {
                setSelectedImages((prev) => [...prev, ...picked]);
            }
        } catch (err) {
            console.error('Error picking images', err);
        }
    };

    const handleRemoveImage = (index: number) => {
        setSelectedImages((prev) => prev.filter((_, i) => i !== index));
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
            // 1) If images selected, upload them first and collect server-side file names
            const imagesArray: string[] = [];
            if (selectedImages && selectedImages.length > 0) {
                setUploadingImages(true);

                for (let i = 0; i < selectedImages.length; i++) {
                    const picked = selectedImages[i];
                    // Create a deterministic filename based on business name + timestamp + index
                    const cleanName = name.trim().replace(/\s+/g, '_').toLowerCase() || 'business';
                    const ext = picked.name.split('.').pop() || 'jpg';
                    const generatedFileName = `${cleanName}_${Date.now()}_${i}.${ext}`;

                    const fileLike = FilePicker.createFileFromPicked(picked);

                    try {
                        const resp = await fileService.uploadFile({
                            file: fileLike as any,
                            fileName: generatedFileName,
                            fileType: picked.type || 'image/jpeg',
                            category: 'image',
                        });

                        if (resp && resp.success && resp.data) {
                            // Backends may return different shapes. Prefer explicit `filename`, then `fileName`/`originalName`,
                            // or nested `cdn_response.filename`. Fall back to the generated name.
                            const d: any = resp.data;
                            let uploadedFilename = generatedFileName;

                            if (typeof d === 'string') {
                                uploadedFilename = d;
                            } else if (d.filename) {
                                uploadedFilename = d.filename;
                            } else if (d.fileName) {
                                uploadedFilename = d.fileName;
                            } else if (d.originalName) {
                                uploadedFilename = d.originalName;
                            } else if (d.cdn_response && d.cdn_response.filename) {
                                uploadedFilename = d.cdn_response.filename;
                            } else if (d.data && d.data.filename) {
                                uploadedFilename = d.data.filename;
                            } else if (d.url) {
                                // if only URL is returned, derive filename from URL
                                try {
                                    const parts = new URL(d.url).pathname.split('/');
                                    const last = parts.pop();
                                    if (last) uploadedFilename = decodeURIComponent(last);
                                } catch (e) {
                                    // ignore
                                }
                            }

                            imagesArray.push(uploadedFilename);
                        } else {
                            console.warn('File upload returned unexpected response for', generatedFileName, resp);
                        }
                    } catch (err) {
                        console.error('Failed to upload image', picked.name, err);
                        Alert.alert('Upload Error', `Failed to upload image ${picked.name}.`);
                    }
                }

                setUploadingImages(false);
            }

            const businessData: any = {
                name: name.trim(),
                short_description: shortDescription.trim(),
                description: description.trim(),
                open_hours: { start: startTime, end: endTime },
                type_id: selectedTypeId,
                scheduled_at: scheduledAt || new Date().toISOString(),
            };

            // Add position if coordinates are provided
            if (latitude.trim() && longitude.trim()) {
                businessData.position = {
                    x: latitude.trim(),
                    y: longitude.trim(),
                };
            }

                const resp = await businessService.create(businessData);
                console.log('Create business response raw:', JSON.stringify(resp, null, 2));

                if (!resp) {
                    console.error('Create business: no response received from API');
                    Alert.alert('Error', 'No response from server when creating business');
                    return;
                }

                if (resp.success) {
                    // 2) After creating business, update associated location metadata with images array if l_id exists
                    const l_id = resp.data && (resp.data as any).l_id;
                    console.log('Created business id/l_id:', { id: resp.data?.id, l_id });

                    if (l_id && Array.isArray(selectedImages) && selectedImages.length > 0) {
                        try {
                            await locationService.update(l_id, { metadata: { images: imagesArray } });
                        } catch (err) {
                            console.error('Failed to update location metadata with images:', err);
                        }
                    }
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
                            {businessTypes.map((type) => {
                                const typeId = type.id || (type as any)._id;
                                const typeName = type.type || (type as any).name;
                                console.log('Picker item:', { typeId, typeName, original: type });
                                return (
                                    <Picker.Item key={typeId} label={typeName || 'Unknown'} value={typeId} />
                                );
                            })}
                        </Picker>
                    </View>

                    <Text style={[styles.label, { color: text }]}>Location</Text>
                    
                    {/* Map Toggle Button */}
                    <TouchableOpacity
                        style={[styles.mapToggleButton, { backgroundColor: background, borderColor: tint }]}
                        onPress={() => setShowMap(!showMap)}
                    >
                        <IconSymbol name={showMap ? 'map.fill' : 'map'} size={20} color={tint} />
                        <Text style={[styles.mapToggleText, { color: tint }]}>
                            {showMap ? 'Hide Map' : 'Select Location on Map'}
                        </Text>
                    </TouchableOpacity>

                    {/* Map View */}
                    {showMap && (
                        <View style={styles.mapSection}>
                            <MapView
                                style={styles.map}
                                provider={PROVIDER_DEFAULT}
                                region={mapRegion}
                                onPress={handleMapPress}
                                showsUserLocation
                                showsMyLocationButton
                            >
                                {markerPosition && (
                                    <Marker
                                        coordinate={markerPosition}
                                        title="Business Location"
                                        description="Tap on map to change location"
                                    />
                                )}
                            </MapView>
                            <TouchableOpacity
                                style={[styles.currentLocationButton, { backgroundColor: tint }]}
                                onPress={handleUseCurrentLocation}
                            >
                                <IconSymbol name="location.fill" size={18} color="#fff" />
                                <Text style={styles.currentLocationText}>Use Current Location</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Manual Coordinate Input */}
                    <View style={styles.hoursRow}>
                        <View style={styles.hoursItem}>
                            <Text style={[styles.hoursLabel, { color: muted }]}>Latitude</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: background, color: text }]}
                                value={latitude}
                                onChangeText={(text) => {
                                    setLatitude(text);
                                }}
                                onBlur={handleManualCoordinateChange}
                                placeholder="27.3314"
                                placeholderTextColor={muted}
                                keyboardType="decimal-pad"
                            />
                        </View>
                        <View style={styles.hoursItem}>
                            <Text style={[styles.hoursLabel, { color: muted }]}>Longitude</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: background, color: text }]}
                                value={longitude}
                                onChangeText={(text) => {
                                    setLongitude(text);
                                }}
                                onBlur={handleManualCoordinateChange}
                                placeholder="88.6138"
                                placeholderTextColor={muted}
                                keyboardType="decimal-pad"
                            />
                        </View>
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

                    <Text style={[styles.label, { color: text }]}>Images</Text>
                    <View style={{ marginBottom: 12 }}>
                        <TouchableOpacity
                            style={[styles.mapToggleButton, { backgroundColor: background, borderColor: tint }]}
                            onPress={handlePickImages}
                        >
                            <IconSymbol name="image" size={18} color={tint} />
                            <Text style={[styles.mapToggleText, { color: tint }]}>Pick Images</Text>
                        </TouchableOpacity>

                        {selectedImages.length > 0 && (
                            <View style={{ marginTop: 8 }}>
                                {selectedImages.map((img, idx) => (
                                    <View key={`${img.name}_${idx}`} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 }}>
                                        <Text style={{ color: text, flex: 1 }}>{img.name}</Text>
                                        <TouchableOpacity onPress={() => handleRemoveImage(idx)} style={{ paddingHorizontal: 8 }}>
                                            <Text style={{ color: tint }}>Remove</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
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
        marginBottom: 100,
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
    mapToggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        gap: 8,
        marginBottom: 12,
    },
    mapToggleText: {
        fontSize: 15,
        fontWeight: '500',
    },
    mapSection: {
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    map: {
        width: '100%',
        height: 300,
    },
    currentLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        gap: 8,
    },
    currentLocationText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
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
