import React, { useState, useEffect } from 'react';
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
import { AdminUser, UserRole, RoleAssignment } from '@/types/admin.types';

// Mock data - replace with actual API
const MOCK_USERS: AdminUser[] = [
    {
        id: 'user1',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.USER,
        status: 'active',
        isEmailVerified: true,
        isPhoneVerified: true,
        joinedDate: '2024-01-15T10:30:00Z',
    },
    {
        id: 'user2',
        email: 'sarah.wilson@example.com',
        firstName: 'Sarah',
        lastName: 'Wilson',
        role: UserRole.BUSINESS,
        status: 'active',
        isEmailVerified: true,
        isPhoneVerified: true,
        joinedDate: '2024-02-20T08:15:00Z',
        businessIds: ['1', '4'],
    },
    {
        id: 'user5',
        email: 'alex.kumar@example.com',
        firstName: 'Alex',
        lastName: 'Kumar',
        role: UserRole.USER,
        status: 'active',
        isEmailVerified: true,
        isPhoneVerified: true,
        joinedDate: '2024-05-12T09:00:00Z',
    },
];

interface RoleOption {
    role: UserRole;
    title: string;
    description: string;
    icon: string;
    color: string;
    bgColor: string;
}

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
        role: UserRole.ORGANIZATION,
        title: 'Organization',
        description: 'Manage multiple businesses, access to organization-level analytics',
        icon: 'building.columns.fill',
        color: '#3b82f6',
        bgColor: '#dbeafe',
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
    const [users, setUsers] = useState<AdminUser[]>(MOCK_USERS);
    const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>(MOCK_USERS);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    const [reason, setReason] = useState('');

    useEffect(() => {
        filterUsers();
    }, [searchQuery, users]);

    const filterUsers = () => {
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
    };

    const handleUserPress = (user: AdminUser) => {
        setSelectedUser(user);
        setSelectedRole(user.role);
        setReason('');
        setShowRoleModal(true);
    };

    const handleRoleChange = () => {
        if (!selectedUser || !selectedRole) return;

        if (selectedRole === selectedUser.role) {
            Alert.alert('No Change', 'The selected role is the same as the current role');
            return;
        }

        Alert.alert(
            'Confirm Role Change',
            `Are you sure you want to change ${selectedUser.firstName}'s role from ${selectedUser.role} to ${selectedRole}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: () => {
                        // TODO: API call to change role
                        setUsers(prev =>
                            prev.map(u =>
                                u.id === selectedUser.id ? { ...u, role: selectedRole } : u
                            )
                        );
                        setShowRoleModal(false);
                        setSelectedUser(null);
                        Alert.alert('Success', 'Role updated successfully');
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
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Role Management</Text>
                    <Text style={styles.headerSubtitle}>
                        Assign and manage user roles
                    </Text>
                </View>
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
                <IconSymbol name="info.circle.fill" size={24} color="#3b82f6" />
                <View style={styles.infoContent}>
                    <Text style={styles.infoTitle}>About Roles</Text>
                    <Text style={styles.infoText}>
                        Roles determine user permissions and access levels. Choose carefully as this affects what users can do.
                    </Text>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <IconSymbol name="magnifyingglass" size={20} color="#687076" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search users..."
                    placeholderTextColor="#687076"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <IconSymbol name="xmark.circle.fill" size={20} color="#687076" />
                    </TouchableOpacity>
                )}
            </View>

            {/* User List */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                        <TouchableOpacity
                            key={user.id}
                            style={styles.userCard}
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
                                    <Text style={styles.userName}>
                                        {user.firstName} {user.lastName}
                                    </Text>
                                    <Text style={styles.userEmail}>{user.email}</Text>
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

                            <View style={styles.userFooter}>
                                <Text style={styles.changeRoleText}>Tap to change role</Text>
                                <IconSymbol name="chevron.right" size={16} color="#687076" />
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <IconSymbol name="person.2.fill" size={64} color="#d1d5db" />
                        <Text style={styles.emptyTitle}>No users found</Text>
                        <Text style={styles.emptySubtitle}>
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
                    <View style={styles.modalContent}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Change Role</Text>
                            <TouchableOpacity
                                onPress={() => setShowRoleModal(false)}
                                style={styles.closeButton}
                            >
                                <IconSymbol name="xmark" size={24} color="#687076" />
                            </TouchableOpacity>
                        </View>

                        {selectedUser && (
                            <>
                                {/* User Info */}
                                <View style={styles.modalUserInfo}>
                                    <View style={styles.modalUserAvatar}>
                                        <Text style={styles.modalAvatarText}>
                                            {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={styles.modalUserName}>
                                            {selectedUser.firstName} {selectedUser.lastName}
                                        </Text>
                                        <Text style={styles.modalUserEmail}>{selectedUser.email}</Text>
                                    </View>
                                </View>

                                {/* Current Role */}
                                <View style={styles.currentRoleSection}>
                                    <Text style={styles.sectionLabel}>Current Role</Text>
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
                                    <Text style={styles.sectionLabel}>Select New Role</Text>
                                    <ScrollView
                                        style={styles.roleOptions}
                                        showsVerticalScrollIndicator={false}
                                    >
                                        {ROLE_OPTIONS.map((option) => (
                                            <TouchableOpacity
                                                key={option.role}
                                                style={[
                                                    styles.roleOption,
                                                    selectedRole === option.role && styles.roleOptionSelected,
                                                    {
                                                        borderColor: selectedRole === option.role ? option.color : '#e5e7eb',
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
                                                    <Text style={styles.roleOptionTitle}>{option.title}</Text>
                                                    <Text style={styles.roleOptionDescription}>
                                                        {option.description}
                                                    </Text>
                                                </View>
                                                {selectedRole === option.role && (
                                                    <IconSymbol name="checkmark.circle.fill" size={24} color={option.color} />
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                {/* Reason Input */}
                                <View style={styles.reasonSection}>
                                    <Text style={styles.sectionLabel}>Reason (Optional)</Text>
                                    <TextInput
                                        style={styles.reasonInput}
                                        placeholder="Why are you changing this user's role?"
                                        placeholderTextColor="#9ca3af"
                                        value={reason}
                                        onChangeText={setReason}
                                        multiline
                                        numberOfLines={3}
                                        textAlignVertical="top"
                                    />
                                </View>

                                {/* Action Buttons */}
                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() => setShowRoleModal(false)}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
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
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
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
        color: '#11181C',
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 13,
        color: '#687076',
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
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#11181C',
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
        backgroundColor: '#f8f9fa',
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
        color: '#11181C',
        marginBottom: 4,
    },
    modalUserEmail: {
        fontSize: 14,
        color: '#687076',
    },
    currentRoleSection: {
        padding: 20,
        paddingBottom: 12,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#687076',
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
        padding: 20,
        paddingTop: 12,
        flex: 1,
    },
    roleOptions: {
        flex: 1,
    },
    roleOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    roleOptionSelected: {
        backgroundColor: '#f8f9fa',
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
        color: '#11181C',
        marginBottom: 4,
    },
    roleOptionDescription: {
        fontSize: 13,
        color: '#687076',
        lineHeight: 18,
    },
    reasonSection: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    reasonInput: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: '#11181C',
        minHeight: 80,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#687076',
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
