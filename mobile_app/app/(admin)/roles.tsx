import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Modal,
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AdminUser, UserRole } from '@/types/admin.types';
import { useApi } from '@/hooks/useApi';
import { useThemeColor } from '@/hooks/use-theme-color';
import { userService } from '@/services';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageTranslations } from '@/constants/translations';

interface RoleOption {
    role: UserRole;
    title: string;
    description: string;
    icon: string;
    color: string;
    bgColor: string;
}

// Note: Role options will use translations dynamically in the component

const ROLE_OPTIONS: RoleOption[] = [
    {
        role: UserRole.USER,
        title: 'User',
        description: 'Regular user with basic access to book services and explore places',
        icon: 'person.fill',
        color: '#10b981',
        bgColor: '#d1fae5',
    },
    {
        role: UserRole.BUSINESS,
        title: 'Business',
        description: 'Can create and manage business services, view bookings and revenue',
        icon: 'building.2.fill',
        color: '#8b5cf6',
        bgColor: '#ede9fe',
    },
    {
        role: UserRole.ADMIN,
        title: 'Admin',
        description: 'Full system access including user management and platform settings',
        icon: 'shield.fill',
        color: '#ef4444',
        bgColor: '#fee2e2',
    },
];

export default function AdminRolesScreen() {
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(true);
    const { put: updateUserRole } = useApi();
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const response = await userService.list();
            const backendUsers = response.data || [];

            // Map backend users to AdminUser format
            const mappedUsers: AdminUser[] = backendUsers.map((u: any) => {
                const [firstName = '', lastName = ''] = (u.name || '').split(' ');
                return {
                    id: u.id || u._id,  // Try both id and _id fields
                    email: u.email,
                    firstName: firstName,
                    lastName: lastName,
                    role: u.role as UserRole,
                    status: u.approved ? 'active' : 'pending',
                    isEmailVerified: u.approved || false,
                    isPhoneVerified: false,
                    joinedDate: u.created_at || new Date().toISOString(),
                };
            });

            setUsers(mappedUsers);
            setFilteredUsers(mappedUsers);
        } catch (error) {
            console.error('Failed to load users:', error);
            Alert.alert('Error', 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const filterUsers = useCallback(() => {
        if (searchQuery.trim()) {
            const filtered = users.filter(u =>
                u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredUsers(filtered);
        } else {
            setFilteredUsers(users);
        }
    }, [users, searchQuery]);

    useEffect(() => {
        filterUsers();
    }, [filterUsers]);

    const handleUserPress = (user: AdminUser) => {
        setSelectedUser(user);
        setSelectedRole(user.role);
        setReason('');
        setShowRoleModal(true);
    };

    const handleRoleChange = async () => {
        if (!selectedUser || !selectedRole) return;

        if (selectedRole === selectedUser.role) {
            Alert.alert('No Change', 'The selected role is the same as the current role');
            return;
        }

        if (!selectedUser.id) {
            Alert.alert('Error', 'User ID is missing. Please refresh and try again.');
            return;
        }

        Alert.alert(
            'Confirm Role Change',
            `Are you sure you want to change ${selectedUser.firstName}'s role from ${selectedUser.role} to ${selectedRole}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            console.log('Updating role for user:', selectedUser.id, 'to:', selectedRole);
                            await userService.updateRole(selectedUser.id, selectedRole);
                            
                            // Update local state only after successful API call
                            setUsers(prev =>
                                prev.map(u =>
                                    u.id === selectedUser.id ? { ...u, role: selectedRole } : u
                                )
                            );
                            setFilteredUsers(prev =>
                                prev.map(u =>
                                    u.id === selectedUser.id ? { ...u, role: selectedRole } : u
                                )
                            );
                            setShowRoleModal(false);
                            setSelectedUser(null);
                            Alert.alert('Success', 'Role updated successfully');
                        } catch (error) {
                            console.error('Failed to update role:', error);
                            Alert.alert('Error', 'Failed to update user role. Please try again.');
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const getRoleColor = (role: UserRole) => {
        const roleOption = ROLE_OPTIONS.find(r => r.role === role);
        return roleOption?.color || '#687076';
    };

    const getRoleBgColor = (role: UserRole) => {
        const roleOption = ROLE_OPTIONS.find(r => r.role === role);
        return roleOption?.bgColor || '#f3f4f6';
    };

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: card, borderBottomColor: muted + '40' }]}>
                <View>
                    <Text style={[styles.headerTitle, { color: text }]}>Role Management</Text>
                    <Text style={[styles.headerSubtitle, { color: muted }]}>
                        Assign and manage user roles
                    </Text>
                </View>
            </View>

            {/* Info Card */}
            <View style={[styles.infoCard, { backgroundColor: tint + '15', borderColor: tint + '30' }]}>
                <IconSymbol name="info.circle.fill" size={24} color={tint} />
                <View style={styles.infoContent}>
                    <Text style={[styles.infoTitle, { color: tint }]}>About Roles</Text>
                    <Text style={[styles.infoText, { color: tint }]}>
                        Roles determine user permissions and access levels. Choose carefully as this affects what users can do.
                    </Text>
                </View>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: card, borderBottomColor: muted + '40' }]}>
                <IconSymbol name="magnifyingglass" size={20} color={muted} />
                <TextInput
                    style={[styles.searchInput, { color: text }]}
                    placeholder="Search users..."
                    placeholderTextColor={muted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <IconSymbol name="xmark.circle.fill" size={20} color={muted} />
                    </TouchableOpacity>
                )}
            </View>

            {/* User List */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {loading ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyTitle}>Loading users...</Text>
                    </View>
                ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                        <TouchableOpacity
                            key={user.id}
                            style={[styles.userCard, { backgroundColor: card, borderColor: muted + '40' }]}
                            onPress={() => handleUserPress(user)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.userHeader}>
                                <View style={styles.userAvatar}>
                                    <Text style={styles.avatarText}>
                                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                    </Text>
                                </View>
                                <View style={styles.userInfo}>
                                    <Text style={[styles.userName, { color: text }]}>
                                        {user.firstName} {user.lastName}
                                    </Text>
                                    <Text style={[styles.userEmail, { color: muted }]}>{user.email}</Text>
                                </View>
                                <View
                                    style={[
                                        styles.roleBadge,
                                        { backgroundColor: getRoleBgColor(user.role) },
                                    ]}
                                >
                                    <Text style={[styles.roleText, { color: getRoleColor(user.role) }]}>
                                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                    </Text>
                                </View>
                            </View>

                            <View style={[styles.userFooter, { borderTopColor: muted + '20' }]}>
                                <Text style={[styles.changeRoleText, { color: muted }]}>Tap to change role</Text>
                                <IconSymbol name="chevron.right" size={16} color={muted} />
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <IconSymbol name="person.2.fill" size={64} color={muted} />
                        <Text style={[styles.emptyTitle, { color: text }]}>No users found</Text>
                        <Text style={[styles.emptySubtitle, { color: muted }]}>
                            Try adjusting your search
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Role Selection Modal */}
            <Modal
                visible={showRoleModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowRoleModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: card }]}>
                        {/* Modal Header */}
                        <View style={[styles.modalHeader, { borderBottomColor: muted + '40' }]}>
                            <Text style={[styles.modalTitle, { color: text }]}>Change Role</Text>
                            <TouchableOpacity
                                onPress={() => setShowRoleModal(false)}
                                style={styles.closeButton}
                            >
                                <IconSymbol name="xmark" size={24} color={muted} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={true}>
                        {selectedUser && (
                            <>
                                {/* User Info */}
                                <View style={[styles.modalUserInfo, { backgroundColor: background }]}>
                                    <View style={styles.modalUserAvatar}>
                                        <Text style={styles.modalAvatarText}>
                                            {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={[styles.modalUserName, { color: text }]}>
                                            {selectedUser.firstName} {selectedUser.lastName}
                                        </Text>
                                        <Text style={[styles.modalUserEmail, { color: muted }]}>{selectedUser.email}</Text>
                                    </View>
                                </View>

                                {/* Current Role */}
                                <View style={styles.currentRoleSection}>
                                    <Text style={[styles.sectionLabel, { color: muted }]}>Current Role</Text>
                                    <View
                                        style={[
                                            styles.currentRoleBadge,
                                            { backgroundColor: getRoleBgColor(selectedUser.role) },
                                        ]}
                                    >
                                        <Text style={[styles.currentRoleText, { color: getRoleColor(selectedUser.role) }]}>
                                            {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                                        </Text>
                                    </View>
                                </View>

                                {/* Role Options */}
                                <View style={styles.roleOptionsSection}>
                                    <Text style={[styles.sectionLabel, { color: muted }]}>Select New Role</Text>
                                    <View style={styles.roleOptions}>
                                        {ROLE_OPTIONS.map((option) => (
                                            <TouchableOpacity
                                                key={option.role}
                                                style={[
                                                    styles.roleOption,
                                                    { backgroundColor: card },
                                                    selectedRole === option.role && styles.roleOptionSelected,
                                                    {
                                                        borderColor: selectedRole === option.role ? option.color : muted + '40',
                                                    },
                                                ]}
                                                onPress={() => setSelectedRole(option.role)}
                                            >
                                                <View
                                                    style={[
                                                        styles.roleIcon,
                                                        { backgroundColor: option.bgColor },
                                                    ]}
                                                >
                                                    <IconSymbol
                                                        name={option.icon as any}
                                                        size={24}
                                                        color={option.color}
                                                    />
                                                </View>
                                                <View style={styles.roleOptionInfo}>
                                                    <Text style={[styles.roleOptionTitle, { color: text }]}>{option.title}</Text>
                                                    <Text style={[styles.roleOptionDescription, { color: muted }]}>
                                                        {option.description}
                                                    </Text>
                                                </View>
                                                {selectedRole === option.role && (
                                                    <IconSymbol name="checkmark.circle.fill" size={24} color={option.color} />
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Reason Input */}
                                <View style={styles.reasonSection}>
                                    <Text style={[styles.sectionLabel, { color: muted }]}>Reason (Optional)</Text>
                                    <TextInput
                                        style={[styles.reasonInput, { backgroundColor: background, color: text, borderColor: muted + '40' }]}
                                        placeholder="Why are you changing this user's role?"
                                        placeholderTextColor={muted}
                                        value={reason}
                                        onChangeText={setReason}
                                        multiline
                                        numberOfLines={3}
                                        textAlignVertical="top"
                                    />
                                </View>

                                {/* Action Buttons */}
                                <View style={[styles.modalActions, { backgroundColor: card }]}>
                                    <TouchableOpacity
                                        style={[styles.cancelButton, { backgroundColor: background }]}
                                        onPress={() => setShowRoleModal(false)}
                                    >
                                        <Text style={[styles.cancelButtonText, { color: muted }]}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.confirmButton,
                                            selectedRole === selectedUser.role && styles.confirmButtonDisabled,
                                        ]}
                                        onPress={handleRoleChange}
                                        disabled={selectedRole === selectedUser.role}
                                    >
                                        <Text style={styles.confirmButtonText}>Update Role</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#11181C',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#687076',
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#eff6ff',
        borderRadius: 12,
        padding: 16,
        margin: 16,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    infoContent: {
        flex: 1,
        marginLeft: 12,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e40af',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 13,
        color: '#1e40af',
        lineHeight: 18,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 16,
        gap: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#11181C',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    userCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderWidth: 1,
    },
    userHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    userAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#0a7ea4',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 13,
    },
    roleBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    roleText: {
        fontSize: 12,
        fontWeight: '600',
    },
    userFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    changeRoleText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0a7ea4',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#11181C',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#687076',
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        flex: 1,
    },
    modalScrollView: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    closeButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalUserInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    modalUserAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#0a7ea4',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    modalAvatarText: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
    },
    modalUserName: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    modalUserEmail: {
        fontSize: 14,
    },
    currentRoleSection: {
        padding: 20,
        paddingBottom: 12,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    currentRoleBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    currentRoleText: {
        fontSize: 14,
        fontWeight: '600',
    },
    roleOptionsSection: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 12,
    },
    roleOptions: {
    },
    roleOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        marginBottom: 12,
    },
    roleOptionSelected: {
    },
    roleIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    roleOptionInfo: {
        flex: 1,
    },
    roleOptionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    roleOptionDescription: {
        fontSize: 13,
        lineHeight: 18,
    },
    reasonSection: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    reasonInput: {
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        minHeight: 80,
        borderWidth: 1,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#0a7ea4',
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        backgroundColor: '#d1d5db',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
