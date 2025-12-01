import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/hooks/useAuth';
import { useThemeColor } from '@/hooks/use-theme-color';
import { userService } from '@/services';

export default function EditProfileScreen() {
    const router = useRouter();
    const { user, logout, updateProfile } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');
    const border = useThemeColor('border');

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setAddress(user.address || '');
        }
    }, [user]);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Name is required');
            return;
        }

        try {
            setLoading(true);
            const success = await updateProfile({
                name: name.trim(),
                address: address.trim(),
            });
            if (success) {
                Alert.alert('Success', 'Profile updated successfully', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            }
        } catch (error: any) {
            console.error('Failed to update profile:', error);
            Alert.alert('Error', error.response?.data?.detail || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: confirmDeleteAccount,
                },
            ]
        );
    };

    const confirmDeleteAccount = async () => {
        try {
            setDeleting(true);
            await userService.deleteMe();
            Alert.alert('Account Deleted', 'Your account has been deleted successfully', [
                { text: 'OK', onPress: () => logout() }
            ]);
        } catch (error: any) {
            console.error('Failed to delete account:', error);
            Alert.alert('Error', error.response?.data?.detail || 'Failed to delete account');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: card, borderBottomColor: border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={24} color={text as string} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: text }]}>Edit Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* Profile Form */}
                <View style={[styles.section, { backgroundColor: card }]}>
                    <Text style={[styles.sectionTitle, { color: text }]}>Personal Information</Text>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: muted }]}>Full Name *</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: background, color: text, borderColor: border }]}
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your full name"
                            placeholderTextColor={muted as string}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: muted }]}>Email</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: background, color: muted, borderColor: border }]}
                            value={email}
                            editable={false}
                            placeholderTextColor={muted as string}
                        />
                        <Text style={[styles.helperText, { color: muted }]}>Email cannot be changed</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: muted }]}>Address</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, { backgroundColor: background, color: text, borderColor: border }]}
                            value={address}
                            onChangeText={setAddress}
                            placeholder="Enter your address"
                            placeholderTextColor={muted as string}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: tint }]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <IconSymbol name="checkmark" size={20} color="#fff" />
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Danger Zone */}
                <View style={[styles.section, styles.dangerSection, { backgroundColor: card, borderColor: '#ef4444' }]}>
                    <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>Danger Zone</Text>
                    <Text style={[styles.dangerText, { color: muted }]}>
                        Once you delete your account, there is no going back. Please be certain.
                    </Text>
                    <TouchableOpacity
                        style={[styles.deleteButton, { borderColor: '#ef4444' }]}
                        onPress={handleDeleteAccount}
                        disabled={deleting}
                    >
                        {deleting ? (
                            <ActivityIndicator color="#ef4444" />
                        ) : (
                            <>
                                <IconSymbol name="trash" size={20} color="#ef4444" />
                                <Text style={[styles.deleteButtonText, { color: '#ef4444' }]}>Delete Account</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    section: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 15,
    },
    textArea: {
        height: 80,
        paddingTop: 12,
    },
    helperText: {
        fontSize: 12,
        marginTop: 4,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    dangerSection: {
        borderWidth: 1,
    },
    dangerText: {
        fontSize: 14,
        marginBottom: 12,
        lineHeight: 20,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    deleteButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
});
