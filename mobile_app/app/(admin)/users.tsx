import { IconSymbol } from '@/components/ui/icon-symbol';
import { getLanguageTranslations } from '@/constants/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useApi } from '@/hooks/useApi';
import { AdminUser, UserRole } from '@/types/admin.types';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Mock data - replace with actual API
const MOCK_USERS: AdminUser[] = [
    {
        id: 'user1',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+91 98765 43210',
        role: UserRole.USER,
        status: 'active',
        isEmailVerified: true,
        isPhoneVerified: true,
        totalBookings: 12,
        totalSpent: 45600,
        joinedDate: '2024-01-15T10:30:00Z',
        lastLoginDate: '2024-11-27T14:20:00Z',
    },
    {
        id: 'user2',
        email: 'sarah.wilson@example.com',
        firstName: 'Sarah',
        lastName: 'Wilson',
        phone: '+91 87654 32109',
        role: UserRole.BUSINESS,
        status: 'active',
        isEmailVerified: true,
        isPhoneVerified: true,
        totalBookings: 3,
        totalSpent: 12000,
        joinedDate: '2024-02-20T08:15:00Z',
        lastLoginDate: '2024-11-26T09:45:00Z',
        businessIds: ['1', '4'],
    },
    {
        id: 'user3',
        email: 'mike.chen@example.com',
        firstName: 'Mike',
        lastName: 'Chen',
        phone: '+91 76543 21098',
        role: UserRole.USER,
        status: 'suspended',
        isEmailVerified: true,
        isPhoneVerified: false,
        totalBookings: 5,
        totalSpent: 18900,
        joinedDate: '2024-03-10T12:45:00Z',
        lastLoginDate: '2024-11-15T16:30:00Z',
    },
    {
        id: 'user4',
        email: 'priya.sharma@example.com',
        firstName: 'Priya',
        lastName: 'Sharma',
        phone: '+91 65432 10987',
        role: UserRole.ORGANIZATION,
        status: 'active',
        isEmailVerified: true,
        isPhoneVerified: true,
        totalBookings: 0,
        totalSpent: 0,
        joinedDate: '2024-04-05T14:20:00Z',
        lastLoginDate: '2024-11-28T11:10:00Z',
        organizationId: 'org1',
    },
    {
        id: 'user5',
        email: 'alex.kumar@example.com',
        firstName: 'Alex',
        lastName: 'Kumar',
        phone: '+91 54321 09876',
        role: UserRole.USER,
        status: 'active',
        isEmailVerified: false,
        isPhoneVerified: true,
        totalBookings: 8,
        totalSpent: 32400,
        joinedDate: '2024-05-12T09:00:00Z',
        lastLoginDate: '2024-11-27T18:55:00Z',
    },
    {
        id: 'user6',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        phone: '+91 99999 88888',
        role: UserRole.ADMIN,
        status: 'active',
        isEmailVerified: true,
        isPhoneVerified: true,
        totalBookings: 0,
        totalSpent: 0,
        joinedDate: '2024-01-01T00:00:00Z',
        lastLoginDate: '2024-11-28T12:00:00Z',
    },
];

const ROLES = ['All', 'User', 'Business', 'Organization', 'Admin'];
const STATUSES = ['All', 'Active', 'Suspended'];

export default function AdminUsersScreen() {
    const router = useRouter();
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const [users, setUsers] = useState<AdminUser[]>(MOCK_USERS);
    const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>(MOCK_USERS);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [showFilters, setShowFilters] = useState(false);
    const { put: updateUser, delete: deleteUserApi } = useApi();
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    const filterUsers = useCallback(() => {
        let filtered = users;

        // Filter by role
        if (selectedRole !== 'All') {
            filtered = filtered.filter(u => u.role === selectedRole.toLowerCase());
        }

        // Filter by status
        if (selectedStatus !== 'All') {
            filtered = filtered.filter(u => u.status === selectedStatus.toLowerCase());
        }

        // Filter by search query
        if (searchQuery.trim()) {
            filtered = filtered.filter(u =>
                u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredUsers(filtered);
    }, [users, selectedRole, selectedStatus, searchQuery]);

    useEffect(() => {
        filterUsers();
    }, [filterUsers]);

    const handleUserPress = (user: AdminUser) => {
        router.push(`/(admin)/(stack)/user-details?id=${user.id}` as any);
    };

    const handleSuspendUser = async (userId: string) => {
        const result = await updateUser(`/admin/users/${userId}`, { status: 'suspended' });
        if (result) {
            setUsers(prev =>
                prev.map(u => (u.id === userId ? { ...u, status: 'suspended' } : u))
            );
        }
    };

    const handleActivateUser = async (userId: string) => {
        const result = await updateUser(`/admin/users/${userId}`, { status: 'active' });
        if (result) {
            setUsers(prev =>
                prev.map(u => (u.id === userId ? { ...u, status: 'active' } : u))
            );
        }
    };

    const handleDeleteUser = async (userId: string) => {
        const result = await deleteUserApi(`/admin/users/${userId}`);
        if (result) {
            setUsers(prev => prev.filter(u => u.id !== userId));
        }
    };

    const getRoleColor = (role: UserRole) => {
        switch (role) {
            case UserRole.ADMIN:
                return '#ef4444';
            case UserRole.BUSINESS:
                return '#8b5cf6';
            case UserRole.ORGANIZATION:
                return '#3b82f6';
            case UserRole.USER:
                return '#10b981';
            default:
                return '#687076';
        }
    };

    const getRoleBgColor = (role: UserRole) => {
        switch (role) {
            case UserRole.ADMIN:
                return '#fee2e2';
            case UserRole.BUSINESS:
                return '#ede9fe';
            case UserRole.ORGANIZATION:
                return '#dbeafe';
            case UserRole.USER:
                return '#d1fae5';
            default:
                return '#f3f4f6';
        }
    };

    const getStatusColor = (status: AdminUser['status']) => {
        switch (status) {
            case 'active':
                return '#10b981';
            case 'suspended':
                return '#ef4444';
            default:
                return '#687076';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: card }]}>
                <View>
                    <Text style={[styles.headerTitle, { color: text }]}>Users</Text>
                    <Text style={[styles.headerSubtitle, { color: muted }]}>
                        {filteredUsers.length} users found
                    </Text>
                </View>
            </View>

            {/* Search and Filter */}
            <View style={styles.searchContainer}>
                <View style={[styles.searchBar, { backgroundColor: card }]}>
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
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setShowFilters(!showFilters)}
                >
                    <IconSymbol name="slider.horizontal.3" size={20} color={tint} />
                </TouchableOpacity>
            </View>

            {/* Filters */}
            {showFilters && (
                <View style={styles.filtersContainer}>
                    {/* Role Filter */}
                    <View style={styles.filterSection}>
                        <Text style={styles.filterLabel}>Role</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.filterChips}
                        >
                            {ROLES.map((role) => (
                                <TouchableOpacity
                                    key={role}
                                    style={[
                                        styles.filterChip,
                                        selectedRole === role && styles.filterChipActive,
                                    ]}
                                    onPress={() => setSelectedRole(role)}
                                >
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            selectedRole === role && styles.filterChipTextActive,
                                        ]}
                                    >
                                        {role}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Status Filter */}
                    <View style={styles.filterSection}>
                        <Text style={styles.filterLabel}>Status</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.filterChips}
                        >
                            {STATUSES.map((status) => (
                                <TouchableOpacity
                                    key={status}
                                    style={[
                                        styles.filterChip,
                                        selectedStatus === status && styles.filterChipActive,
                                    ]}
                                    onPress={() => setSelectedStatus(status)}
                                >
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            selectedStatus === status && styles.filterChipTextActive,
                                        ]}
                                    >
                                        {status}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            )}

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
                                <View style={styles.badges}>
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
                            </View>

                            <View style={styles.userMeta}>
                                <View style={styles.metaItem}>
                                    <IconSymbol
                                        name="circle.fill"
                                        size={8}
                                        color={getStatusColor(user.status)}
                                    />
                                    <Text style={styles.metaText}>
                                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                    </Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <IconSymbol name="calendar" size={14} color="#687076" />
                                    <Text style={styles.metaText}>
                                        Joined {formatDate(user.joinedDate)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.userStats}>
                                <View style={styles.statItem}>
                                    <IconSymbol name="ticket.fill" size={16} color="#687076" />
                                    <Text style={styles.statValue}>{user.totalBookings}</Text>
                                    <Text style={styles.statLabel}>Bookings</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <IconSymbol name="indianrupeesign.circle.fill" size={16} color="#687076" />
                                    <Text style={styles.statValue}>₹{(user.totalSpent || 1000 / 1000).toFixed(1)}k</Text>
                                    <Text style={styles.statLabel}>Spent</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <IconSymbol
                                        name={user.isEmailVerified ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                                        size={16}
                                        color={user.isEmailVerified ? '#10b981' : '#ef4444'}
                                    />
                                    <Text style={styles.statLabel}>Email</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <IconSymbol
                                        name={user.isPhoneVerified ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                                        size={16}
                                        color={user.isPhoneVerified ? '#10b981' : '#ef4444'}
                                    />
                                    <Text style={styles.statLabel}>Phone</Text>
                                </View>
                            </View>

                            <View style={styles.userActions}>
                                {user.status === 'active' && user.role !== UserRole.ADMIN && (
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.suspendButton]}
                                        onPress={() => handleSuspendUser(user.id)}
                                    >
                                        <IconSymbol name="hand.raised.fill" size={14} color="#fff" />
                                        <Text style={styles.actionButtonText}>Suspend</Text>
                                    </TouchableOpacity>
                                )}
                                {user.status === 'suspended' && (
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.activateButton]}
                                        onPress={() => handleActivateUser(user.id)}
                                    >
                                        <IconSymbol name="checkmark.circle.fill" size={14} color="#fff" />
                                        <Text style={styles.actionButtonText}>Activate</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.roleButton]}
                                    onPress={() => router.push(`/(admin)/roles?userId=${user.id}` as any)}
                                >
                                    <IconSymbol name="person.badge.key.fill" size={14} color="#fff" />
                                    <Text style={styles.actionButtonText}>Change Role</Text>
                                </TouchableOpacity>
                                {user.role !== UserRole.ADMIN && (
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.deleteButton]}
                                        onPress={() => handleDeleteUser(user.id)}
                                    >
                                        <IconSymbol name="trash.fill" size={14} color="#fff" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <IconSymbol name="person.2.fill" size={64} color="#d1d5db" />
                        <Text style={styles.emptyTitle}>No users found</Text>
                        <Text style={styles.emptySubtitle}>
                            Try adjusting your search or filters
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    searchContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        backgroundColor: '#fff',
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#11181C',
    },
    filterButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#e8f4f8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    filtersContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    filterSection: {
        marginBottom: 12,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#11181C',
        marginBottom: 8,
    },
    filterChips: {
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    filterChipActive: {
        backgroundColor: '#0a7ea4',
        borderColor: '#0a7ea4',
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#687076',
    },
    filterChipTextActive: {
        color: '#fff',
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
        borderRadius: 16,
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
    badges: {
        gap: 4,
    },
    roleBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    roleText: {
        fontSize: 12,
        fontWeight: '600',
    },
    userMeta: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 13,
        color: '#687076',
    },
    userStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#f3f4f6',
        marginBottom: 12,
    },
    statItem: {
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#11181C',
    },
    statLabel: {
        fontSize: 11,
        color: '#687076',
    },
    userActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    actionButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
    },
    suspendButton: {
        backgroundColor: '#f59e0b',
    },
    activateButton: {
        backgroundColor: '#10b981',
    },
    roleButton: {
        backgroundColor: '#8b5cf6',
    },
    deleteButton: {
        backgroundColor: '#ef4444',
        flex: 0,
        paddingHorizontal: 12,
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
});
