import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageTranslations } from '@/constants/translations';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { monasteryService, MonasteryData } from '@/services/monastery.service';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

export default function MonasteryProfileScreen() {
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');
    const { user, logout } = useAuth();
    const router = useRouter();

    const [monasteryData, setMonasteryData] = useState<MonasteryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [editForm, setEditForm] = useState({
        name: '',
        description: '',
        short_description: '',
        address: '',
        open_hours_start: '',
        open_hours_end: '',
    });

    useEffect(() => {
        loadMonasteryData();
    }, []);

    const loadMonasteryData = async () => {
        try {
            setLoading(true);
            const response = await monasteryService.getMonasteryDetails();

            if (response.success && response.data) {
                setMonasteryData(response.data);
                setEditForm({
                    name: response.data.name,
                    description: response.data.description,
                    short_description: response.data.short_description,
                    address: response.data.address,
                    open_hours_start: response.data.open_hours.start,
                    open_hours_end: response.data.open_hours.end,
                });
            }
        } catch (error) {
            console.error('Error loading monastery data:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to load monastery data',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveChanges = async () => {
        if (!editForm.name || !editForm.description || !editForm.address) {
            Toast.show({
                type: 'error',
                text1: 'Missing Fields',
                text2: 'Please fill in all required fields',
            });
            return;
        }

        setSaving(true);
        try {
            const response = await monasteryService.updateMonastery({
                name: editForm.name,
                description: editForm.description,
                short_description: editForm.short_description,
                address: editForm.address,
            });

            if (response.success && response.data) {
                setMonasteryData(response.data);
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Monastery information updated',
                });
                setShowEditModal(false);
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to update information',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', onPress: () => { }, style: 'cancel' },
                {
                    text: 'Logout',
                    onPress: async () => {
                        await logout();
                        router.replace('/(auth)/login' as any);
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={tint} />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={[styles.headerSection, { backgroundColor: card }]}>
                    <View style={[styles.avatarContainer, { backgroundColor: tint + '20' }]}>
                        <IconSymbol size={48} name="building.2.fill" color={tint} />
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={[styles.headerName, { color: text }]}>{monasteryData?.name}</Text>
                        <View style={styles.statusRow}>
                            <View style={[
                                styles.statusIndicator,
                                { backgroundColor: monasteryData?.approved ? '#10b981' : '#f59e0b' }
                            ]} />
                            <Text style={[styles.statusText, { color: muted }]}>
                                {monasteryData?.approved ? 'Verified & Approved' : 'Pending Verification'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Information Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: text }]}>Information</Text>
                        <TouchableOpacity onPress={() => setShowEditModal(true)}>
                            <Text style={[styles.editButton, { color: tint }]}>Edit</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.infoCard, { backgroundColor: card }]}>
                        <View style={styles.infoItem}>
                            <Text style={[styles.infoLabel, { color: muted }]}>Monastery Name</Text>
                            <Text style={[styles.infoValue, { color: text }]}>{monasteryData?.name}</Text>
                        </View>

                        <View style={[styles.divider, { backgroundColor: muted + '20' }]} />

                        <View style={styles.infoItem}>
                            <Text style={[styles.infoLabel, { color: muted }]}>Email</Text>
                            <Text style={[styles.infoValue, { color: text }]}>{monasteryData?.email}</Text>
                        </View>

                        <View style={[styles.divider, { backgroundColor: muted + '20' }]} />

                        <View style={styles.infoItem}>
                            <Text style={[styles.infoLabel, { color: muted }]}>Address</Text>
                            <Text style={[styles.infoValue, { color: text }]}>{monasteryData?.address}</Text>
                        </View>

                        <View style={[styles.divider, { backgroundColor: muted + '20' }]} />

                        <View style={styles.infoItem}>
                            <Text style={[styles.infoLabel, { color: muted }]}>Operating Hours</Text>
                            <Text style={[styles.infoValue, { color: text }]}>
                                {monasteryData?.open_hours.start} - {monasteryData?.open_hours.end}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Description Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: text }]}>Description</Text>
                    <View style={[styles.descriptionCard, { backgroundColor: card }]}>
                        <Text style={[styles.description, { color: text }]}>
                            {monasteryData?.description}
                        </Text>
                    </View>
                </View>

                {/* Short Description Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: text }]}>Short Description</Text>
                    <View style={[styles.descriptionCard, { backgroundColor: card }]}>
                        <Text style={[styles.description, { color: text }]}>
                            {monasteryData?.short_description}
                        </Text>
                    </View>
                </View>

                {/* Statistics Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: text }]}>Statistics</Text>

                    <View style={[styles.statsContainer, { backgroundColor: card }]}>
                        <View style={styles.statItem}>
                            <View style={[styles.statIcon, { backgroundColor: tint + '20' }]}>
                                <IconSymbol size={24} name="photo.fill" color={tint} />
                            </View>
                            <Text style={[styles.statLabel, { color: muted }]}>Total Artifacts</Text>
                            <Text style={[styles.statValue, { color: text }]}>
                                {monasteryData?.artifacts_count || 0}
                            </Text>
                        </View>

                        <View style={[styles.statDivider, { backgroundColor: muted + '20' }]} />

                        <View style={styles.statItem}>
                            <View style={[styles.statIcon, { backgroundColor: '#10b98120' }]}>
                                <IconSymbol size={24} name="checkmark.circle.fill" color="#10b981" />
                            </View>
                            <Text style={[styles.statLabel, { color: muted }]}>Account Status</Text>
                            <Text style={[styles.statValue, { color: text }]}>
                                {monasteryData?.approved ? 'Approved' : 'Pending'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: text }]}>Quick Actions</Text>

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: card, borderWidth: 1, borderColor: muted + '40' }]}
                        onPress={() => router.push('/(monastery)/' as any)}>
                        <IconSymbol size={20} name="house.fill" color={tint} />
                        <Text style={[styles.actionButtonText, { color: text }]}>Go to Dashboard</Text>
                        <IconSymbol size={16} name="chevron.right" color={muted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: card, borderWidth: 1, borderColor: muted + '40' }]}
                        onPress={() => router.push('/(monastery)/artifacts' as any)}>
                        <IconSymbol size={20} name="photo.fill" color={tint} />
                        <Text style={[styles.actionButtonText, { color: text }]}>Manage Artifacts</Text>
                        <IconSymbol size={16} name="chevron.right" color={muted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: card, borderWidth: 1, borderColor: muted + '40' }]}
                        onPress={() => router.push('/(monastery)/gallery' as any)}>
                        <IconSymbol size={20} name="square.grid.2x2.fill" color={tint} />
                        <Text style={[styles.actionButtonText, { color: text }]}>View Gallery</Text>
                        <IconSymbol size={16} name="chevron.right" color={muted} />
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                    style={[styles.logoutButton, { backgroundColor: '#fee2e2' }]}
                    onPress={handleLogout}>
                    <IconSymbol size={20} name="rectangle.portrait.and.arrow.right.fill" color="#ef4444" />
                    <Text style={[styles.logoutButtonText, { color: '#ef4444' }]}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Edit Modal */}
            <Modal
                visible={showEditModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowEditModal(false)}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={[styles.modalContainer, { backgroundColor: background + 'E6' }]}>
                    <ScrollView contentContainerStyle={styles.modalContent}>
                        <View style={[styles.modalHeader, { backgroundColor: card }]}>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                <IconSymbol size={24} name="xmark.circle.fill" color={muted} />
                            </TouchableOpacity>
                            <Text style={[styles.modalTitle, { color: text }]}>Edit Information</Text>
                            <View style={{ width: 24 }} />
                        </View>

                        <View style={styles.formSection}>
                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: text }]}>Monastery Name*</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                    placeholder="Monastery name"
                                    placeholderTextColor={muted}
                                    value={editForm.name}
                                    onChangeText={(value) => setEditForm(prev => ({ ...prev, name: value }))}
                                    editable={!saving}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: text }]}>Email*</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                    placeholder="Email"
                                    placeholderTextColor={muted}
                                    value={monasteryData?.email || ''}
                                    editable={false}
                                />
                                <Text style={[styles.helperText, { color: muted }]}>Email cannot be changed</Text>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: text }]}>Address*</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                    placeholder="Physical address"
                                    placeholderTextColor={muted}
                                    value={editForm.address}
                                    onChangeText={(value) => setEditForm(prev => ({ ...prev, address: value }))}
                                    editable={!saving}
                                    multiline
                                    numberOfLines={2}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: text }]}>Description*</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                    placeholder="Detailed description"
                                    placeholderTextColor={muted}
                                    value={editForm.description}
                                    onChangeText={(value) => setEditForm(prev => ({ ...prev, description: value }))}
                                    editable={!saving}
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: text }]}>Short Description</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                    placeholder="Brief summary (max 255 characters)"
                                    placeholderTextColor={muted}
                                    value={editForm.short_description}
                                    onChangeText={(value) => setEditForm(prev => ({ ...prev, short_description: value.slice(0, 255) }))}
                                    editable={!saving}
                                    maxLength={255}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: tint, opacity: saving ? 0.6 : 1 }]}
                            onPress={handleSaveChanges}
                            disabled={saving}>
                            {saving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <IconSymbol size={20} name="checkmark.circle.fill" color="#fff" />
                                    <Text style={styles.saveButtonText}>Save Changes</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 16,
        paddingBottom: 32,
        gap: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerSection: {
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerInfo: {
        flex: 1,
    },
    headerName: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
    section: {
        gap: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    editButton: {
        fontSize: 14,
        fontWeight: '600',
    },
    infoCard: {
        borderRadius: 12,
        padding: 16,
    },
    infoItem: {
        paddingVertical: 8,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        marginVertical: 12,
    },
    descriptionCard: {
        borderRadius: 12,
        padding: 16,
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
    },
    statsContainer: {
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: 8,
    },
    statIcon: {
        width: 50,
        height: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    statDivider: {
        width: 1,
        marginHorizontal: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 8,
        gap: 12,
        marginBottom: 8,
    },
    actionButtonText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 8,
        gap: 8,
        marginTop: 12,
    },
    logoutButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        flexGrow: 1,
        paddingTop: 12,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    formSection: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 16,
    },
    inputContainer: {
        gap: 6,
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
    },
    helperText: {
        fontSize: 11,
        marginTop: 4,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        margin: 16,
        borderRadius: 8,
        gap: 8,
    },
    saveButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
});
