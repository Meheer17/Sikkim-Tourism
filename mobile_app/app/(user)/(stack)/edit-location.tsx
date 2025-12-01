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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { locationService, LocationModel, LocationType } from '@/services/location.service';
import { useAuth } from '@/hooks/useAuth';
import { Picker } from '@react-native-picker/picker';
import Toast from 'react-native-toast-message';

export default function EditLocationScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [name, setName] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [description, setDescription] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [type, setType] = useState<LocationType>('tourism');

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    useEffect(() => {
        if (!id) {
            Alert.alert('Error', 'Location ID is required');
            router.back();
            return;
        }
        loadLocation();
    }, [id]);

    const loadLocation = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const resp = await locationService.get(id);
            if (resp.success && resp.data) {
                const loc = resp.data;
                setName(loc.name);
                setShortDescription(loc.short_description);
                setDescription(loc.description);
                setLatitude(String(loc.position.x));
                setLongitude(String(loc.position.y));
                setType(loc.type);
            } else {
                Alert.alert('Error', 'Failed to load location');
                router.back();
            }
        } catch (error) {
            console.error('Failed to load location:', error);
            Alert.alert('Error', 'Failed to load location');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!name.trim() || !shortDescription.trim() || !description.trim() || !latitude || !longitude) {
            Alert.alert('Validation Error', 'Please fill all required fields');
            return;
        }

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        if (isNaN(lat) || isNaN(lng)) {
            Alert.alert('Validation Error', 'Latitude and Longitude must be valid numbers');
            return;
        }

        setSubmitting(true);
        try {
            const updateData = {
                name: name.trim(),
                short_description: shortDescription.trim(),
                description: description.trim(),
                position: { x: lat, y: lng },
                type,
                metadata: {},
            };

            const resp = await locationService.update(id!, updateData);
            if (resp.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Location updated successfully',
                });
                router.back();
            } else {
                Alert.alert('Error', resp.message || 'Failed to update location');
            }
        } catch (error: any) {
            console.error('Update location error:', error);
            Alert.alert('Error', error.message || 'Failed to update location');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Location',
            'Are you sure you want to delete this location? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setSubmitting(true);
                        try {
                            const resp = await locationService.remove(id!);
                            if (resp.success) {
                                Toast.show({
                                    type: 'success',
                                    text1: 'Success',
                                    text2: 'Location deleted successfully',
                                });
                                router.back();
                            } else {
                                Alert.alert('Error', 'Failed to delete location');
                            }
                        } catch (error: any) {
                            console.error('Delete location error:', error);
                            Alert.alert('Error', error.message || 'Failed to delete location');
                        } finally {
                            setSubmitting(false);
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: background }]}>
                <ActivityIndicator size="large" color={tint} />
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
                <Text style={[styles.headerTitle, { color: text }]}>Edit Location</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={[styles.card, { backgroundColor: card }]}>
                    <Text style={[styles.label, { color: text }]}>Name *</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: background, color: text }]}
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter location name"
                        placeholderTextColor={muted}
                    />

                    <Text style={[styles.label, { color: text }]}>Short Description *</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: background, color: text }]}
                        value={shortDescription}
                        onChangeText={setShortDescription}
                        placeholder="Brief description"
                        placeholderTextColor={muted}
                        maxLength={100}
                    />

                    <Text style={[styles.label, { color: text }]}>Description *</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { backgroundColor: background, color: text }]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Full description"
                        placeholderTextColor={muted}
                        multiline
                        numberOfLines={6}
                    />

                    <Text style={[styles.label, { color: text }]}>Latitude *</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: background, color: text }]}
                        value={latitude}
                        onChangeText={setLatitude}
                        placeholder="28.6139"
                        placeholderTextColor={muted}
                        keyboardType="numeric"
                    />

                    <Text style={[styles.label, { color: text }]}>Longitude *</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: background, color: text }]}
                        value={longitude}
                        onChangeText={setLongitude}
                        placeholder="77.2090"
                        placeholderTextColor={muted}
                        keyboardType="numeric"
                    />

                    <Text style={[styles.label, { color: text }]}>Location Type *</Text>
                    <View style={[styles.pickerContainer, { backgroundColor: background }]}>
                        <Picker
                            selectedValue={type}
                            onValueChange={setType}
                            style={[styles.picker, { color: text }]}
                        >
                            <Picker.Item label="Tourism" value="tourism" />
                            <Picker.Item label="Business" value="business" />
                            <Picker.Item label="Event" value="event" />
                            <Picker.Item label="Emergency" value="emergency" />
                            <Picker.Item label="Local Help" value="localhelp" />
                            <Picker.Item label="Other" value="other" />
                        </Picker>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: tint }]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Update Location</Text>
                        )}
                    </TouchableOpacity>

                    {user?.role === 'admin' && (
                        <TouchableOpacity
                            style={[styles.button, styles.deleteButton, { backgroundColor: '#ef4444' }]}
                            onPress={handleDelete}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Delete Location</Text>
                            )}
                        </TouchableOpacity>
                    )}
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
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    button: {
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 24,
    },
    deleteButton: {
        marginTop: 12,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
