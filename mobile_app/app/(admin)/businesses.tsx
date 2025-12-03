import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Business } from '@/types/admin.types';
import { useApi } from '@/hooks/useApi';
import { useThemeColor } from '@/hooks/use-theme-color';
import { businessService, BusinessModel } from '@/services/business.service';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageTranslations } from '@/constants/translations';

// Removed static mock data. Data now loads exclusively from backend.

const CATEGORIES = ['All', 'Adventure', 'Transport', 'Culture', 'Food', 'Wellness'];
const STATUSES = ['All', 'Active', 'Pending', 'Suspended'];

export default function AdminBusinessesScreen() {
    const router = useRouter();
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [showFilters, setShowFilters] = useState(false);
    const { put: updateBusiness } = useApi();
    const { delete: deleteBusiness } = useApi();
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    const filterBusinesses = useCallback(() => {
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
    }, [businesses, selectedCategory, selectedStatus, searchQuery]);

    useEffect(() => {
        filterBusinesses();
    }, [filterBusinesses]);

    // Load businesses from backend
    useEffect(() => {
        const loadBusinesses = async () => {
            setLoading(true);
            try {
                const resp = await businessService.list({ skip: 0, limit: 100 });
                if (resp.success && resp.data) {
                    const mapped: Business[] = resp.data.map((b: BusinessModel) => ({
                        id: b.id,
                        name: b.name,
                        description: b.description,
                        category: 'Adventure',
                        price: 0,
                        icon: 'star.fill',
                        ownerId: '',
                        ownerName: '',
                        ownerEmail: '',
                        status: 'active',
                        rating: 0,
                        reviewCount: 0,
                        bookingCount: 0,
                        revenue: 0,
                        contactPhone: '',
                        createdAt: b.created_at || '',
                        updatedAt: b.updated_at || '',
                    }));
                    setBusinesses(mapped);
                    setFilteredBusinesses(mapped);
                }
            } catch (e) {
                console.warn('Failed to load businesses:', e);
            }
            setLoading(false);
        };
        loadBusinesses();
    }, []);

    const handleBusinessPress = (business: Business) => {
        router.push(`/(admin)/(stack)/business-details?id=${business.id}` as any);
    };

    const handleStatusChange = async (businessId: string, newStatus: Business['status']) => {
        const result = await updateBusiness(`/admin/businesses/${businessId}`, { status: newStatus });
        if (result) {
            setBusinesses(prev =>
                prev.map(b => (b.id === businessId ? { ...b, status: newStatus } : b))
            );
        }
    };

    const handleDeleteBusiness = async (businessId: string) => {
        Alert.alert(
            'Delete Business',
            'Are you sure you want to delete this business?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await businessService.remove(businessId);
                            setBusinesses(prev => prev.filter(b => b.id !== businessId));
                        } catch (e) {
                            Alert.alert('Error', 'Failed to delete business');
                        }
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
        <View style={[styles.container, { backgroundColor: background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: card }]}>
                <View>
                    <Text style={[styles.headerTitle, { color: text }]}>{t.businesses || 'Businesses'}</Text>
                    <Text style={[styles.headerSubtitle, { color: muted }]}>
                        {filteredBusinesses.length} {t.businessesFound || 'businesses found'}
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
            <View style={[styles.searchContainer, { backgroundColor: card }]}>
                <View style={[styles.searchBar, { backgroundColor: background, borderColor: muted + '40' }]}>
                    <IconSymbol name="magnifyingglass" size={20} color={muted} />
                    <TextInput
                        style={[styles.searchInput, { color: text }]}
                        placeholder={t.searchBusinesses || 'Search businesses...'}
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
                    style={[styles.filterButton, { backgroundColor: tint + '15' }]}
                    onPress={() => setShowFilters(!showFilters)}
                >
                    <IconSymbol name="slider.horizontal.3" size={20} color={tint} />
                </TouchableOpacity>
            </View>

            {/* Filters */}
            {showFilters && (
                <View style={[styles.filtersContainer, { backgroundColor: card, borderBottomColor: muted + '40' }]}>
                    {/* Category Filter */}
                    <View style={styles.filterSection}>
                        <Text style={[styles.filterLabel, { color: text }]}>Category</Text>
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
                                        { backgroundColor: selectedCategory === category ? tint : background, borderColor: selectedCategory === category ? tint : muted + '40' },
                                    ]}
                                    onPress={() => setSelectedCategory(category)}
                                >
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            { color: selectedCategory === category ? '#fff' : muted },
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
                        <Text style={[styles.filterLabel, { color: text }]}>Status</Text>
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
                                        { backgroundColor: selectedStatus === status ? tint : background, borderColor: selectedStatus === status ? tint : muted + '40' },
                                    ]}
                                    onPress={() => setSelectedStatus(status)}
                                >
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            { color: selectedStatus === status ? '#fff' : muted },
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
                {loading && (
                    <View style={styles.emptyState}>
                        <Text style={[styles.emptySubtitle, { color: muted }]}>Loading businesses...</Text>
                    </View>
                )}
                {!loading && filteredBusinesses.length > 0 ? (
                    filteredBusinesses.map((business) => (
                        <TouchableOpacity
                            key={business.id}
                            style={[styles.businessCard, { backgroundColor: card, borderColor: muted + '20' }]}
                            onPress={() => handleBusinessPress(business)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.businessHeader}>
                                <View style={[styles.businessIconContainer, { backgroundColor: tint + '15' }]}>
                                    <IconSymbol
                                        name={(business.icon as any) || 'star.fill'}
                                        size={24}
                                        color={tint}
                                    />
                                </View>
                                <View style={styles.businessInfo}>
                                    <Text style={[styles.businessName, { color: text }]} numberOfLines={1}>
                                        {business.name}
                                    </Text>
                                    <Text style={[styles.businessCategory, { color: muted }]}>{business.category}</Text>
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

                            <Text style={[styles.businessDescription, { color: muted }]} numberOfLines={2}>
                                {business.description}
                            </Text>

                            <View style={styles.businessMeta}>
                                <View style={styles.metaItem}>
                                    <IconSymbol name="person.fill" size={14} color={muted} />
                                    <Text style={[styles.metaText, { color: muted }]}>{business.ownerName}</Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <IconSymbol name="star.fill" size={14} color="#fbbf24" />
                                    <Text style={[styles.metaText, { color: muted }]}>
                                        {business.rating?.toFixed(1) || 'N/A'} ({business.reviewCount || 0})
                                    </Text>
                                </View>
                            </View>

                            <View style={[styles.businessFooter, { borderTopColor: muted + '20' }]}>
                                <Text style={[styles.businessPrice, { color: tint }]}>₹{business.price}</Text>
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
                ) : (!loading && (
                    <View style={styles.emptyState}>
                        <IconSymbol name="building.2.fill" size={64} color={muted} />
                        <Text style={[styles.emptyTitle, { color: text }]}>No businesses found</Text>
                        <Text style={[styles.emptySubtitle, { color: muted }]}>
                            Try adjusting your search or filters
                        </Text>
                    </View>
                ))}
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
        padding: 20,
        paddingTop: 20,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
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
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    filterButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filtersContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    filterSection: {
        marginBottom: 12,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    filterChips: {
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    businessCard: {
        borderRadius: 16,
        borderWidth: 1,
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
        marginBottom: 2,
    },
    businessCategory: {
        fontSize: 13,
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
    },
    businessFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
    },
    businessPrice: {
        fontSize: 20,
        fontWeight: '700',
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
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
    },
});
