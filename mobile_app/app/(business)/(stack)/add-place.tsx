import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { locationService } from '@/services/location.service';

type LocationType = 'emergency' | 'localhelp' | 'business' | 'event' | 'tourism' | 'other';

export default function AddPlaceScreen() {
    const router = useRouter();
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [type, setType] = useState<LocationType>('tourism');
    const [submitting, setSubmitting] = useState(false);

    const types: LocationType[] = ['tourism', 'business', 'event', 'emergency', 'localhelp', 'other'];

    const handleSubmit = async () => {
        if (!name.trim() || !description.trim() || !shortDescription.trim() || !latitude || !longitude) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        if (isNaN(lat) || isNaN(lng)) {
            Alert.alert('Error', 'Invalid coordinates');
            return;
        }

        setSubmitting(true);
        try {
            const resp = await locationService.create({
                name: name.trim(),
                description: description.trim(),
                short_description: shortDescription.trim(),
                position: { x: lng, y: lat }, // x=longitude, y=latitude
                metadata: {},
                type,
            });

            if (resp.success) {
                Alert.alert('Success', 'Place created successfully', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('Error', resp.message || 'Failed to create place');
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
                <Text style={[styles.headerTitle, { color: text }]}>Add New Place</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                <View style={[styles.card, { backgroundColor: card }]}>
                    <Text style={[styles.label, { color: text }]}>Name *</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: background, color: text }]}
                        placeholder="Enter place name"
                        placeholderTextColor={muted}
                        value={name}
                        onChangeText={setName}
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

                    <Text style={[styles.label, { color: text }]}>Type *</Text>
                    <View style={styles.typeGrid}>
                        {types.map((t) => (
                            <TouchableOpacity
                                key={t}
                                style={[
                                    styles.typeChip,
                                    { borderColor: type === t ? tint : '#e5e7eb' },
                                    type === t && { backgroundColor: tint + '22' }
                                ]}
                                onPress={() => setType(t)}
                            >
                                <Text style={[styles.typeText, { color: type === t ? tint : text }]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: tint }]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitText}>Create Place</Text>
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
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    typeChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 2,
    },
    typeText: { fontSize: 14, fontWeight: '600', textTransform: 'capitalize' },
    submitButton: {
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    submitText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
