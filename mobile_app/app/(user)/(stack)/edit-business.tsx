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
import { businessService, BusinessType } from '@/services/business.service';
import { useAuth } from '@/hooks/useAuth';
import { Picker } from '@react-native-picker/picker';
import Toast from 'react-native-toast-message';

export default function EditBusinessScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [name, setName] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
    const [selectedTypeId, setSelectedTypeId] = useState('');
    const [loadingTypes, setLoadingTypes] = useState(true);

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    useEffect(() => {
        if (!id) {
            Alert.alert('Error', 'Business ID is required');
            router.back();
            return;
        }
        loadBusinessTypes();
        loadBusiness();
    }, [id]);

    const loadBusinessTypes = async () => {
        try {
            setLoadingTypes(true);
            const response = await businessService.getTypes();
            const types = response.data || [];
            setBusinessTypes(types);
        } catch (error) {
            console.error('Failed to load business types:', error);
        } finally {
            setLoadingTypes(false);
        }
    };

    const loadBusiness = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const resp = await businessService.get(id);
            if (resp.success && resp.data) {
                const biz = resp.data;
                setName(biz.name);
                setShortDescription(biz.short_description);
                setDescription(biz.description);
                if (biz.open_hours) {
                    setStartTime(biz.open_hours.start || '09:00');
                    setEndTime(biz.open_hours.end || '17:00');
                }
                if (biz.type_id) {
                    setSelectedTypeId(biz.type_id);
                }
            } else {
                Alert.alert('Error', 'Failed to load business');
                router.back();
            }
        } catch (error) {
            console.error('Failed to load business:', error);
            Alert.alert('Error', 'Failed to load business');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!name.trim() || !shortDescription.trim() || !description.trim()) {
            Alert.alert('Validation Error', 'Please fill all required fields');
            return;
        }

        setSubmitting(true);
        try {
            const updateData = {
                name: name.trim(),
                short_description: shortDescription.trim(),
                description: description.trim(),
                open_hours: { start: startTime, end: endTime },
                type_id: selectedTypeId || undefined,
            };

            const resp = await businessService.update(id!, updateData);
            if (resp.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Business updated successfully',
                });
                router.back();
            } else {
                Alert.alert('Error', resp.message || 'Failed to update business');
            }
        } catch (error: any) {
            console.error('Update business error:', error);
            Alert.alert('Error', error.message || 'Failed to update business');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Business',
            'Are you sure you want to delete this business? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setSubmitting(true);
                        try {
                            const resp = await businessService.remove(id!);
                            if (resp.success) {
                                Toast.show({
                                    type: 'success',
                                    text1: 'Success',
                                    text2: 'Business deleted successfully',
                                });
                                router.back();
                            } else {
                                Alert.alert('Error', 'Failed to delete business');
                            }
                        } catch (error: any) {
                            console.error('Delete business error:', error);
                            Alert.alert('Error', error.message || 'Failed to delete business');
                        } finally {
                            setSubmitting(false);
                        }
                    },
                },
            ]
        );
    };

    if (loading || loadingTypes) {
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
                <Text style={[styles.headerTitle, { color: text }]}>Edit Business</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={[styles.card, { backgroundColor: card }]}>
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

                    <Text style={[styles.label, { color: text }]}>Business Type</Text>
                    <View style={[styles.pickerContainer, { backgroundColor: background }]}>
                        <Picker
                            selectedValue={selectedTypeId}
                            onValueChange={setSelectedTypeId}
                            style={[styles.picker, { color: text }]}
                        >
                            <Picker.Item label="Select type" value="" />
                            {businessTypes.map((type) => (
                                <Picker.Item key={type._id} label={type.name} value={type._id} />
                            ))}
                        </Picker>
                    </View>

                    <Text style={[styles.label, { color: text }]}>Opening Hours</Text>
                    <View style={styles.hoursRow}>
                        <View style={styles.hoursItem}>
                            <Text style={[styles.hoursLabel, { color: muted }]}>Start</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: background, color: text }]}
                                value={startTime}
                                onChangeText={setStartTime}
                                placeholder="09:00"
                                placeholderTextColor={muted}
                            />
                        </View>
                        <View style={styles.hoursItem}>
                            <Text style={[styles.hoursLabel, { color: muted }]}>End</Text>
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
                        style={[styles.button, { backgroundColor: tint }]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Update Business</Text>
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
                                <Text style={styles.buttonText}>Delete Business</Text>
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
