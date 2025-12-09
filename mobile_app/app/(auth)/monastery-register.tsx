import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Modal,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, MapPressEvent } from 'react-native-maps';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageTranslations } from '@/constants/translations';
import { monasteryService } from '@/services';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function MonasteryRegisterScreen() {
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    const router = useRouter();
    const mapRef = useRef<MapView>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [showMapModal, setShowMapModal] = useState(false);
    const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number } | null>(null);

    const [formData, setFormData] = useState({
        // User information
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        address: '',

        // Monastery information
        description: '',
        short_description: '',

        // Location coordinates
        latitude: '',
        longitude: '',

        // Business hours
        open_hours_start: '06:00',
        open_hours_end: '18:00',
    });

    const handleRegister = async () => {
        const {
            name, address, email, password, confirmPassword,
            description, short_description, latitude, longitude,
            open_hours_start, open_hours_end
        } = formData;

        // Validation
        if (!name || !address || !email || !password || !confirmPassword ||
            !description || !short_description || !latitude || !longitude) {
            Toast.show({
                type: 'error',
                text1: t.missingFields || 'Missing Fields',
                text2: t.fillAllFields || 'Please fill in all required fields',
            });
            return;
        }

        if (password !== confirmPassword) {
            Toast.show({
                type: 'error',
                text1: t.passwordMismatch || 'Password Mismatch',
                text2: t.passwordsNotMatch || 'Passwords do not match',
            });
            return;
        }

        if (password.length < 8) {
            Toast.show({
                type: 'error',
                text1: t.weakPassword || 'Weak Password',
                text2: 'Password must be at least 8 characters long',
            });
            return;
        }

        // Validate coordinates
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Coordinates',
                text2: 'Please enter valid latitude (-90 to 90) and longitude (-180 to 180)',
            });
            return;
        }

        setIsLoading(true);
        try {
            const scheduledAt = new Date().toISOString();

            const response = await monasteryService.registerMonastery({
                name,
                email,
                password,
                address,
                description,
                short_description,
                position: {
                    x: lng, // longitude
                    y: lat, // latitude
                },
                open_hours_start,
                open_hours_end,
                scheduled_at: scheduledAt,
                metadata: {
                    monastery_type: 'cultural_heritage',
                    verified: false,
                },
            });

            if (response.success) {
                Toast.show({
                    type: 'success',
                    text1: t.registrationSuccessful || 'Registration Successful',
                    text2: 'You can now log in with your credentials',
                });

                // Navigate to login after a short delay
                setTimeout(() => {
                    router.replace('/(auth)/login' as any);
                }, 1500);
            } else {
                Toast.show({
                    type: 'error',
                    text1: t.registrationFailed || 'Registration Failed',
                    text2: response.message || 'Please try again',
                });
            }
        } catch (error: any) {
            console.error('Registration error:', error);
            Toast.show({
                type: 'error',
                text1: t.registrationFailed || 'Registration Failed',
                text2: error.message || (t.pleaseTryAgain || 'Please try again'),
            });
        } finally {
            setIsLoading(false);
        }
    };

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleMapPress = (event: MapPressEvent) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        setSelectedCoords({ latitude, longitude });
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

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <Text style={[styles.title, { color: text }]}>Register Monastery</Text>
                    <Text style={[styles.subtitle, { color: muted }]}>Create your monastery account</Text>

                    <View style={styles.form}>
                        {/* Monastery Name */}
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: text }]}>Monastery Name*</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                placeholder="e.g., Ancient Monastery"
                                placeholderTextColor={muted}
                                value={formData.name}
                                onChangeText={(value) => updateField('name', value)}
                                autoCapitalize="words"
                                editable={!isLoading}
                            />
                        </View>

                        {/* Email */}
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: text }]}>Email*</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                placeholder="monastery@example.com"
                                placeholderTextColor={muted}
                                value={formData.email}
                                onChangeText={(value) => updateField('email', value)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                                editable={!isLoading}
                            />
                        </View>

                        {/* Address */}
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: text }]}>Physical Address*</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                placeholder="Complete address"
                                placeholderTextColor={muted}
                                value={formData.address}
                                onChangeText={(value) => updateField('address', value)}
                                autoCapitalize="sentences"
                                editable={!isLoading}
                                multiline
                                numberOfLines={2}
                            />
                        </View>

                        {/* Description */}
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: text }]}>Detailed Description*</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                placeholder="Detailed information about the monastery"
                                placeholderTextColor={muted}
                                value={formData.description}
                                onChangeText={(value) => updateField('description', value)}
                                editable={!isLoading}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        {/* Short Description */}
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: text }]}>Short Description*</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                placeholder="Brief summary (max 255 characters)"
                                placeholderTextColor={muted}
                                value={formData.short_description}
                                onChangeText={(value) => updateField('short_description', value.slice(0, 255))}
                                editable={!isLoading}
                                maxLength={255}
                            />
                        </View>

                        {/* Location Section Header */}
                        <Text style={[styles.sectionTitle, { color: text }]}>Location Coordinates</Text>

                        {/* Coordinate Display */}
                        <View style={[styles.coordDisplay, { backgroundColor: card, borderColor: tint + '20' }]}>
                            <View style={styles.coordField}>
                                <Text style={[styles.coordLabel, { color: muted }]}>Latitude</Text>
                                <Text style={[styles.coordValue, { color: text }]}>
                                    {formData.latitude || 'Not set'}
                                </Text>
                            </View>
                            <View style={styles.coordDivider} />
                            <View style={styles.coordField}>
                                <Text style={[styles.coordLabel, { color: muted }]}>Longitude</Text>
                                <Text style={[styles.coordValue, { color: text }]}>
                                    {formData.longitude || 'Not set'}
                                </Text>
                            </View>
                        </View>

                        {/* Pick from Map Button */}
                        <TouchableOpacity
                            style={[styles.mapButton, { backgroundColor: tint + '15', borderColor: tint }]}
                            onPress={openMapPicker}
                            disabled={isLoading}>
                            <IconSymbol size={18} name="map.fill" color={tint} />
                            <Text style={[styles.mapButtonText, { color: tint }]}>Pick Location from Map</Text>
                        </TouchableOpacity>

                        {/* Business Hours Section Header */}
                        <Text style={[styles.sectionTitle, { color: text }]}>Business Hours</Text>

                        {/* Opening Hours */}
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: text }]}>Opening Time (HH:MM)*</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                placeholder="06:00"
                                placeholderTextColor={muted}
                                value={formData.open_hours_start}
                                onChangeText={(value) => updateField('open_hours_start', value)}
                                editable={!isLoading}
                            />
                        </View>

                        {/* Closing Hours */}
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: text }]}>Closing Time (HH:MM)*</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                placeholder="18:00"
                                placeholderTextColor={muted}
                                value={formData.open_hours_end}
                                onChangeText={(value) => updateField('open_hours_end', value)}
                                editable={!isLoading}
                            />
                        </View>

                        {/* Password Section Header */}
                        <Text style={[styles.sectionTitle, { color: text }]}>Account Security</Text>

                        {/* Password */}
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: text }]}>Password (min 8 characters)*</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                placeholder="••••••••"
                                placeholderTextColor={muted}
                                value={formData.password}
                                onChangeText={(value) => updateField('password', value)}
                                secureTextEntry
                                editable={!isLoading}
                            />
                        </View>

                        {/* Confirm Password */}
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: text }]}>Confirm Password*</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                placeholder="••••••••"
                                placeholderTextColor={muted}
                                value={formData.confirmPassword}
                                onChangeText={(value) => updateField('confirmPassword', value)}
                                secureTextEntry
                                editable={!isLoading}
                            />
                        </View>

                        {/* Register Button */}
                        <TouchableOpacity
                            style={[styles.registerButton, { backgroundColor: tint, opacity: isLoading ? 0.6 : 1 }]}
                            onPress={handleRegister}
                            disabled={isLoading}>
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.registerButtonText}>Register Monastery</Text>
                            )}
                        </TouchableOpacity>

                        {/* Login Link */}
                        <View style={styles.loginLink}>
                            <Text style={[styles.loginText, { color: muted }]}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => router.push('/(auth)/login' as any)} disabled={isLoading}>
                                <Text style={[styles.loginLinkText, { color: tint }]}>Log in</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Map Picker Modal */}
            <Modal
                visible={showMapModal}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={() => setShowMapModal(false)}>
                <View style={[styles.modalContainer, { backgroundColor: background }]}>
                    {/* Modal Header */}
                    <View style={[styles.modalHeader, { backgroundColor: card, borderBottomColor: muted + '20' }]}>
                        <TouchableOpacity onPress={() => setShowMapModal(false)}>
                            <IconSymbol size={28} name="xmark.circle.fill" color={muted} />
                        </TouchableOpacity>
                        <Text style={[styles.modalTitle, { color: text }]}>Pick Monastery Location</Text>
                        <TouchableOpacity
                            onPress={handleConfirmLocation}
                            disabled={!selectedCoords}
                            style={[styles.confirmButton, !selectedCoords && styles.confirmButtonDisabled, { backgroundColor: tint }]}>
                            <IconSymbol size={18} name="checkmark.circle.fill" color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Map */}
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        provider={PROVIDER_DEFAULT}
                        initialRegion={
                            selectedCoords
                                ? {
                                    ...selectedCoords,
                                    latitudeDelta: 0.05,
                                    longitudeDelta: 0.05,
                                }
                                : {
                                    latitude: 27.533,
                                    longitude: 88.5122,
                                    latitudeDelta: 1.5,
                                    longitudeDelta: 1.5,
                                }
                        }
                        onPress={handleMapPress}
                        showsUserLocation={true}
                        showsMyLocationButton={true}>
                        {selectedCoords && (
                            <Marker coordinate={selectedCoords} pinColor={tint} />
                        )}
                    </MapView>

                    {/* Instructions */}
                    <View style={[styles.instructions, { backgroundColor: card }]}>
                        <IconSymbol size={20} name="hand.tap.fill" color={tint} />
                        <Text style={[styles.instructionsText, { color: text }]}>
                            Tap anywhere on the map to select a location
                        </Text>
                    </View>

                    {/* Selected Coordinates Display */}
                    {selectedCoords && (
                        <View style={[styles.coordsDisplay, { backgroundColor: card }]}>
                            <View style={styles.coordsItem}>
                                <Text style={[styles.coordsLabel, { color: muted }]}>Latitude</Text>
                                <Text style={[styles.coordsValue, { color: text }]}>
                                    {selectedCoords.latitude.toFixed(6)}
                                </Text>
                            </View>
                            <View style={[styles.coordsDividerModal, { backgroundColor: muted + '20' }]} />
                            <View style={styles.coordsItem}>
                                <Text style={[styles.coordsLabel, { color: muted }]}>Longitude</Text>
                                <Text style={[styles.coordsValue, { color: text }]}>
                                    {selectedCoords.longitude.toFixed(6)}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 30,
    },
    content: {
        padding: 16,
        paddingTop: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 24,
    },
    form: {
        gap: 16,
    },
    inputContainer: {
        gap: 8,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        fontFamily: 'System',
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginTop: 12,
        marginBottom: 4,
    },
    registerButton: {
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    registerButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    loginLink: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
    },
    loginText: {
        fontSize: 14,
    },
    loginLinkText: {
        fontSize: 14,
        fontWeight: '600',
    },
    // Coordinate display styles
    coordDisplay: {
        flexDirection: 'row',
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        gap: 12,
    },
    coordField: {
        flex: 1,
    },
    coordLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    coordValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    coordDivider: {
        width: 1,
        backgroundColor: '#e0e0e0',
    },
    // Map button styles
    mapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        marginTop: 8,
    },
    mapButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    // Modal styles
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    confirmButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    confirmButtonDisabled: {
        opacity: 0.5,
    },
    map: {
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
    },
    coordsDisplay: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        flexDirection: 'row',
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
        marginBottom: 4,
    },
    coordsValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    coordsDividerModal: {
        width: 1,
        marginHorizontal: 16,
    },
});
