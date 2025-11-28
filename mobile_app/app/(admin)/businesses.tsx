import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Business, BusinessFilter } from '@/types/admin.types';

// Mock data - replace with actual API
const MOCK_BUSINESSES: Business[] = [
    {
        id: '1',
        name: 'Mountain Trekking Guide',
        description: 'Professional trekking guide for Himalayan trails with 10 years experience',
        category: 'Adventure',
        price: 2500,
        icon: 'mountain.2.fill',
        ownerId: 'owner1',
        ownerName: 'Rajesh Kumar',
        ownerEmail: 'rajesh@example.com',
        status: 'active',
        rating: 4.8,
        reviewCount: 124,
        bookingCount: 567,
        revenue: 1417500,
        contactPhone: '+91 98765 43210',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-11-20T15:45:00Z',
    },
    {
        id: '2',
        name: 'Local Cab Service',
        description: '24/7 available cab service for local travel',
        category: 'Transport',
        price: 800,
        icon: 'car.fill',
        ownerId: 'owner2',
        ownerName: 'Priya Sharma',
        ownerEmail: 'priya@example.com',
        status: 'active',
        rating: 4.5,
        reviewCount: 89,
        bookingCount: 1234,
        revenue: 987200,
        contactPhone: '+91 87654 32109',
        createdAt: '2024-02-20T08:15:00Z',
        updatedAt: '2024-11-25T12:20:00Z',
    },
    {
        id: '3',
        name: 'Heritage Museum Tours',
        description: 'Guided tours of heritage museums with cultural insights',
        category: 'Culture',
        price: 150,
        icon: 'building.columns.fill',
        ownerId: 'owner3',
        ownerName: 'Sonam Lepcha',
        ownerEmail: 'sonam@example.com',
        status: 'pending',
        rating: 0,
        reviewCount: 0,
        bookingCount: 0,
        revenue: 0,
        contactPhone: '+91 76543 21098',
        createdAt: '2024-11-20T14:30:00Z',
        updatedAt: '2024-11-20T14:30:00Z',
    },
    {
        id: '4',
        name: 'River Rafting Adventures',
        description: 'Thrilling river rafting experience with safety equipment',
        category: 'Adventure',
        price: 1500,
        icon: 'water.waves',
        ownerId: 'owner4',
        ownerName: 'Amit Singh',
        ownerEmail: 'amit@example.com',
        status: 'active',
        rating: 4.9,
        reviewCount: 156,
        bookingCount: 432,
        revenue: 648000,
        contactPhone: '+91 65432 10987',
        createdAt: '2024-03-10T11:00:00Z',
        updatedAt: '2024-11-22T09:15:00Z',
    },
    {
        id: '5',
        name: 'Spa & Wellness Center',
        description: 'Relaxation and wellness services with traditional therapies',
        category: 'Wellness',
        price: 2000,
        icon: 'heart.text.square.fill',
        ownerId: 'owner5',
        ownerName: 'Maya Tamang',
        ownerEmail: 'maya@example.com',
        status: 'suspended',
        rating: 4.3,
        reviewCount: 67,
        bookingCount: 234,
        revenue: 468000,
        contactPhone: '+91 54321 09876',
        createdAt: '2024-04-05T13:45:00Z',
        updatedAt: '2024-11-18T16:30:00Z',
    },
];

const CATEGORIES = ['All', 'Adventure', 'Transport', 'Culture', 'Food', 'Wellness'];
const STATUSES = ['All', 'Active', 'Pending', 'Suspended'];

export default function AdminBusinessesScreen() {
    const router = useRouter();
    const [businesses, setBusinesses] = useState<Business[]>(MOCK_BUSINESSES);
    const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>(MOCK_BUSINESSES);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        filterBusinesses();
    }, [searchQuery, selectedCategory, selectedStatus, businesses]);

    const filterBusinesses = () => {
        let filtered = businesses;

        // Filter by category
        if (selectedCategory !== 'All') {
            filtered = filtered.filter(b => b.category === selectedCategory);
        }

        // Filter by status
        if (selectedStatus !== 'All') {
            filtered = filtered.filter(b => b.status === selectedStatus.toLowerCase());
        }

        // Filter by search query
        if (searchQuery.trim()) {
            filtered = filtered.filter(b =>
                b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                b.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredBusinesses(filtered);
    };

    const handleBusinessPress = (business: Business) => {
        router.push(`/(admin)/(stack)/business-details?id=${business.id}` as any);
    };

    const handleStatusChange = (businessId: string, newStatus: Business['status']) => {
        Alert.alert(
            'Change Status',
            `Are you sure you want to change this business status to ${newStatus}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: () => {
                        // TODO: API call to update status
                        setBusinesses(prev =>
                            prev.map(b => (b.id === businessId ? { ...b, status: newStatus } : b))
                        );
                    },
                },
            ]
        );
    };

    const handleDeleteBusiness = (businessId: string) => {
        Alert.alert(
            'Delete Business',
            'Are you sure you want to delete this business? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        // TODO: API call to delete
                        setBusinesses(prev => prev.filter(b => b.id !== businessId));
                    },
                },
            ]
        );
    };

    const getStatusColor = (status: Business['status']) => {
        switch (status) {
            case 'active':
                return '#10b981';
            case 'pending':
                return '#f59e0b';
            case 'suspended':
                return '#ef4444';
            case 'rejected':
                return '#6b7280';
            default:
                return '#687076';
        }
    };

    const getStatusBgColor = (status: Business['status']) => {
        switch (status) {
            case 'active':
                return '#d1fae5';
            case 'pending':
                return '#fef3c7';
            case 'suspended':
                return '#fee2e2';
            case 'rejected':
                return '#f3f4f6';
            default:
                return '#f8f9fa';
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Businesses</Text>
                    <Text style={styles.headerSubtitle}>
                        {filteredBusinesses.length} businesses found
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => router.push('/(admin)/(stack)/add-business' as any)}
                >
                    <IconSymbol name="plus" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Search and Filter */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <IconSymbol name="magnifyingglass" size={20} color="#687076" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search businesses..."
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
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setShowFilters(!showFilters)}
                >
                    <IconSymbol name="slider.horizontal.3" size={20} color="#0a7ea4" />
                </TouchableOpacity>
            </View>

            {/* Filters */}
            {showFilters && (
                <View style={styles.filtersContainer}>
                    {/* Category Filter */}
                    <View style={styles.filterSection}>
                        <Text style={styles.filterLabel}>Category</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.filterChips}
                        >
                            {CATEGORIES.map((category) => (
                                <TouchableOpacity
                                    key={category}
                                    style={[
                                        styles.filterChip,
                                        selectedCategory === category && styles.filterChipActive,
                                    ]}
                                    onPress={() => setSelectedCategory(category)}
                                >
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            selectedCategory === category && styles.filterChipTextActive,
                                        ]}
                                    >
                                        {category}
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

            {/* Business List */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {filteredBusinesses.length > 0 ? (
                    filteredBusinesses.map((business) => (
                        <TouchableOpacity
                            key={business.id}
                            style={styles.businessCard}
                            onPress={() => handleBusinessPress(business)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.businessHeader}>
                                <View style={styles.businessIconContainer}>
                                    <IconSymbol
                                        name={(business.icon as any) || 'star.fill'}
                                        size={24}
                                        color="#0a7ea4"
                                    />
                                </View>
                                <View style={styles.businessInfo}>
                                    <Text style={styles.businessName} numberOfLines={1}>
                                        {business.name}
                                    </Text>
                                    <Text style={styles.businessCategory}>{business.category}</Text>
                                </View>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        { backgroundColor: getStatusBgColor(business.status) },
                                    ]}
                                >
                                    <Text style={[styles.statusText, { color: getStatusColor(business.status) }]}>
                                        {business.status.charAt(0).toUpperCase() + business.status.slice(1)}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.businessDescription} numberOfLines={2}>
                                {business.description}
                            </Text>

                            <View style={styles.businessMeta}>
                                <View style={styles.metaItem}>
                                    <IconSymbol name="person.fill" size={14} color="#687076" />
                                    <Text style={styles.metaText}>{business.ownerName}</Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <IconSymbol name="star.fill" size={14} color="#fbbf24" />
                                    <Text style={styles.metaText}>
                                        {business.rating?.toFixed(1) || 'N/A'} ({business.reviewCount || 0})
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.businessFooter}>
                                <Text style={styles.businessPrice}>₹{business.price}</Text>
                                <View style={styles.businessActions}>
                                    {business.status === 'pending' && (
                                        <>
                                            <TouchableOpacity
                                                style={[styles.actionButton, styles.approveButton]}
                                                onPress={() => handleStatusChange(business.id, 'active')}
                                            >
                                                <IconSymbol name="checkmark" size={16} color="#fff" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.actionButton, styles.rejectButton]}
                                                onPress={() => handleStatusChange(business.id, 'rejected')}
                                            >
                                                <IconSymbol name="xmark" size={16} color="#fff" />
                                            </TouchableOpacity>
                                        </>
                                    )}
                                    {business.status === 'active' && (
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.suspendButton]}
                                            onPress={() => handleStatusChange(business.id, 'suspended')}
                                        >
                                            <IconSymbol name="pause.fill" size={16} color="#fff" />
                                        </TouchableOpacity>
                                    )}
                                    {business.status === 'suspended' && (
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.approveButton]}
                                            onPress={() => handleStatusChange(business.id, 'active')}
                                        >
                                            <IconSymbol name="play.fill" size={16} color="#fff" />
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.deleteButton]}
                                        onPress={() => handleDeleteBusiness(business.id)}
                                    >
                                        <IconSymbol name="trash.fill" size={16} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <IconSymbol name="building.2.fill" size={64} color="#d1d5db" />
                        <Text style={styles.emptyTitle}>No businesses found</Text>
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
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#0a7ea4',
        justifyContent: 'center',
        alignItems: 'center',
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
    businessCard: {
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
    businessHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    businessIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#e8f4f8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    businessInfo: {
        flex: 1,
    },
    businessName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#11181C',
        marginBottom: 2,
    },
    businessCategory: {
        fontSize: 13,
        color: '#687076',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    businessDescription: {
        fontSize: 14,
        color: '#687076',
        lineHeight: 20,
        marginBottom: 12,
    },
    businessMeta: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 13,
        color: '#687076',
    },
    businessFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    businessPrice: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0a7ea4',
    },
    businessActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    approveButton: {
        backgroundColor: '#10b981',
    },
    rejectButton: {
        backgroundColor: '#ef4444',
    },
    suspendButton: {
        backgroundColor: '#f59e0b',
    },
    deleteButton: {
        backgroundColor: '#ef4444',
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
