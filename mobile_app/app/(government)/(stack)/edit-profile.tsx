import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/user.service';

export default function EditProfileScreen() {
    const router = useRouter();
    const { user } = useAuth();

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        address: '',
        gender: '',
    });

    // Fetch current user data
    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const resp = await userService.me();
            if (resp.success && resp.data) {
                setFormData({
                    name: resp.data.name || '',
                    email: resp.data.email || '',
                    address: resp.data.address || '',
                    gender: resp.data.gender || '',
                });
            }
        } catch (e) {
            console.error('Failed to fetch user data:', e);
        } finally {
            setFetchLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.email.trim()) {
            Alert.alert('Validation Error', 'Name and email are required');
            return;
        }

        setLoading(true);
        try {
            const resp = await userService.updateMe({
                name: formData.name,
                email: formData.email,
                address: formData.address,
                gender: formData.gender as any,
            });

            if (resp.success) {
                Alert.alert('Success', 'Profile updated successfully', [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            } else {
                Alert.alert('Error', resp.message || 'Failed to update profile');
            }
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    if (fetchLoading) {
        return (
            <View style={[styles.container, { backgroundColor: background }]}>
                <View style={[styles.header, { backgroundColor: card, borderBottomColor: muted + '40' }]}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <IconSymbol name="chevron.left" size={24} color={text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: text }]}>Edit Profile</Text>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={tint} />
                    <Text style={[styles.loadingText, { color: muted }]}>Loading profile...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: card, borderBottomColor: muted + '40' }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <IconSymbol name="chevron.left" size={24} color={text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: text }]}>Edit Profile</Text>
                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: tint }, loading && { opacity: 0.5 }]}
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
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <View style={[styles.avatar, { backgroundColor: tint }]}>
                        <Text style={styles.avatarText}>
                            {formData.name ? formData.name.split(' ').map(p => p.charAt(0)).slice(0, 2).join('') : 'A'}
                        </Text>
                    </View>
                    <TouchableOpacity style={[styles.changePhotoButton, { backgroundColor: tint + '15' }]}>
                        <IconSymbol name="camera.fill" size={16} color={tint} />
                        <Text style={[styles.changePhotoText, { color: tint }]}>Change Photo</Text>
                    </TouchableOpacity>
                </View>

                {/* Form Fields */}
                <View style={styles.form}>
                    <View style={styles.field}>
                        <Text style={[styles.label, { color: text }]}>Full Name *</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                            placeholder="Enter your name"
                            placeholderTextColor={muted}
                            value={formData.name}
                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={[styles.label, { color: text }]}>Email *</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                            placeholder="Enter your email"
                            placeholderTextColor={muted}
                            value={formData.email}
                            onChangeText={(text) => setFormData({ ...formData, email: text })}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={[styles.label, { color: text }]}>Address</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                            placeholder="Enter your address"
                            placeholderTextColor={muted}
                            value={formData.address}
                            onChangeText={(text) => setFormData({ ...formData, address: text })}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={[styles.label, { color: text }]}>Gender</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                            placeholder="Enter your gender"
                            placeholderTextColor={muted}
                            value={formData.gender}
                            onChangeText={(text) => setFormData({ ...formData, gender: text })}
                        />
                    </View>
                </View>

                {/* Role Info */}
                <View style={[styles.roleCard, { backgroundColor: card, borderColor: muted + '20' }]}>
                    <View style={[styles.roleIcon, { backgroundColor: '#ef4444' + '15' }]}>
                        <IconSymbol name="shield.fill" size={24} color="#ef4444" />
                    </View>
                    <View style={styles.roleInfo}>
                        <Text style={[styles.roleTitle, { color: text }]}>Government Official Role</Text>
                        <Text style={[styles.roleText, { color: muted }]}>
                            You have full access to manage users, businesses, and system settings
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
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
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
    },
    placeholder: {
        width: 40,
    },
    saveButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    saveButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarText: {
        fontSize: 36,
        fontWeight: '700',
        color: '#fff',
    },
    changePhotoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    changePhotoText: {
        fontSize: 14,
        fontWeight: '600',
    },
    form: {
        gap: 20,
        marginBottom: 32,
    },
    field: {
        gap: 8,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
    },
    roleCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    roleIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    roleInfo: {
        flex: 1,
    },
    roleTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    roleText: {
        fontSize: 13,
        lineHeight: 18,
    },
});
