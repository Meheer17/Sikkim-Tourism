import { IconSymbol } from '@/components/ui/icon-symbol';
import { getLanguageTranslations } from '@/constants/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useApi } from '@/hooks/useApi';
import { Place } from '@/types/admin.types';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = SCREEN_HEIGHT * 0.35;

// Mock data - replace with actual API
const MOCK_PLACES: Place[] = [
    {
        id: '1',
        name: 'Rumtek Monastery',
        description: 'Beautiful Buddhist monastery with stunning architecture and peaceful surroundings',
        category: 'Religious Site',
        location: {
            latitude: 27.2897,
            longitude: 88.5595,
            address: 'Rumtek, East Sikkim',
            city: 'Gangtok',
            state: 'Sikkim',
            country: 'India',
        },
        address: 'Rumtek, East Sikkim, Sikkim 737135',
        rating: 4.8,
        reviewCount: 234,
        visitCount: 5678,
        entryFee: 0,
        openingHours: '6:00 AM - 6:00 PM',
        bestTimeToVisit: 'March to June, September to December',
        highlights: ['Beautiful Architecture', 'Peaceful Environment', 'Cultural Experience'],
        facilities: ['Parking', 'Guided Tours', 'Restrooms'],
        status: 'active',
        createdBy: 'admin1',
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-11-20T14:30:00Z',
    },
    {
        id: '2',
        name: 'Tsomgo Lake',
        description: 'Glacial lake at high altitude with scenic beauty and serene environment',
        category: 'Natural Beauty',
        location: {
            latitude: 27.3542,
            longitude: 88.7539,
            address: 'East Sikkim',
            city: 'Near Gangtok',
            state: 'Sikkim',
            country: 'India',
        },
        address: 'East Sikkim, Sikkim',
        rating: 4.9,
        reviewCount: 567,
        visitCount: 12345,
        entryFee: 50,
        openingHours: '8:00 AM - 4:00 PM',
        bestTimeToVisit: 'May to October',
        highlights: ['Scenic Views', 'Photography', 'High Altitude Lake'],
        facilities: ['Parking', 'Food Stalls', 'Yak Rides'],
        status: 'active',
        createdBy: 'admin1',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-11-22T11:15:00Z',
    },
    {
        id: '3',
        name: 'MG Marg',
        description: 'Popular shopping street and pedestrian zone with shops and restaurants',
        category: 'Shopping',
        location: {
            latitude: 27.3314,
            longitude: 88.6138,
            address: 'Gangtok, Sikkim',
            city: 'Gangtok',
            state: 'Sikkim',
            country: 'India',
        },
        address: 'MG Marg, Gangtok, Sikkim 737101',
        rating: 4.5,
        reviewCount: 432,
        visitCount: 8765,
        entryFee: 0,
        openingHours: '10:00 AM - 9:00 PM',
        bestTimeToVisit: 'Year Round',
        highlights: ['Shopping', 'Dining', 'Street Performances'],
        facilities: ['Cafes', 'Shops', 'Seating Areas'],
        status: 'active',
        createdBy: 'admin2',
        createdAt: '2024-02-01T12:00:00Z',
        updatedAt: '2024-11-25T09:45:00Z',
    },
    {
        id: '4',
        name: 'Khecheopalri Lake',
        description: 'Sacred lake surrounded by dense forest, known for its pristine beauty',
        category: 'Natural Beauty',
        location: {
            latitude: 27.4333,
            longitude: 88.1833,
            address: 'West Sikkim',
            city: 'Pelling',
            state: 'Sikkim',
            country: 'India',
        },
        address: 'West Sikkim, Sikkim',
        rating: 4.7,
        reviewCount: 189,
        visitCount: 3456,
        entryFee: 20,
        openingHours: '7:00 AM - 5:00 PM',
        bestTimeToVisit: 'October to May',
        highlights: ['Sacred Lake', 'Bird Watching', 'Trekking'],
        facilities: ['Parking', 'Prayer Wheels', 'Restrooms'],
        status: 'draft',
        createdBy: 'admin3',
        createdAt: '2024-11-20T15:00:00Z',
        updatedAt: '2024-11-20T15:00:00Z',
    },
    {
        id: '5',
        name: 'Nathula Pass',
        description: 'Mountain pass on the Indo-China border with historical significance',
        category: 'Historical',
        location: {
            latitude: 27.3917,
            longitude: 88.8458,
            address: 'East Sikkim',
            city: 'Near Gangtok',
            state: 'Sikkim',
            country: 'India',
        },
        address: 'East Sikkim, Sikkim',
        rating: 4.6,
        reviewCount: 321,
        visitCount: 6543,
        entryFee: 100,
        openingHours: '9:00 AM - 3:00 PM (Permit Required)',
        bestTimeToVisit: 'May to October',
        highlights: ['Border Area', 'Historical Significance', 'Mountain Views'],
        facilities: ['Checkpoints', 'Bunkers', 'Memorial'],
        status: 'active',
        createdBy: 'admin1',
        createdAt: '2024-03-05T11:30:00Z',
        updatedAt: '2024-11-18T16:20:00Z',
    },
];

const CATEGORIES = ['All', 'Religious Site', 'Natural Beauty', 'Shopping', 'Historical', 'Adventure'];
const STATUSES = ['All', 'Active', 'Draft', 'Archived'];

export default function AdminPlacesScreen() {
    const router = useRouter();
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const [places, setPlaces] = useState<Place[]>(MOCK_PLACES);
    const [filteredPlaces, setFilteredPlaces] = useState<Place[]>(MOCK_PLACES);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
    const { get: getPlaces, put: updatePlace } = useApi<Place[]>();
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    const filterPlaces = useCallback(() => {
        let filtered = places;

        // Filter by category
        if (selectedCategory !== 'All') {
            filtered = filtered.filter(p => p.category === selectedCategory);
        }

        // Filter by status
        if (selectedStatus !== 'All') {
            filtered = filtered.filter(p => p.status === selectedStatus.toLowerCase());
        }

        // Filter by search query
        if (searchQuery.trim()) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.address.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredPlaces(filtered);
    }, [places, selectedCategory, selectedStatus, searchQuery]);

    useEffect(() => {
        filterPlaces();
    }, [filterPlaces]);

    const handlePlacePress = (place: Place) => {
        setSelectedPlace(place);
        // router.push(`/(admin)/(stack)/place-details?id=${place.id}` as any);
    };

    const handleEditPlace = (place: Place) => {
        router.push(`/(admin)/(stack)/edit-place?id=${place.id}` as any);
    };

    const handleDeletePlace = (placeId: string) => {
        Alert.alert(
            'Delete Place',
            'Are you sure you want to delete this place? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        // TODO: API call to delete
                        setPlaces(prev => prev.filter(p => p.id !== placeId));
                        if (selectedPlace?.id === placeId) {
                            setSelectedPlace(null);
                        }
                    },
                },
            ]
        );
    };

    const handleStatusChange = (placeId: string, newStatus: Place['status']) => {
        // TODO: API call to update status
        setPlaces(prev =>
            prev.map(p => (p.id === placeId ? { ...p, status: newStatus } : p))
        );
    };

    const getStatusColor = (status: Place['status']) => {
        switch (status) {
            case 'active':
                return '#10b981';
            case 'draft':
                return '#f59e0b';
            case 'archived':
                return '#6b7280';
            default:
                return '#687076';
        }
    };

    const getStatusBgColor = (status: Place['status']) => {
        switch (status) {
            case 'active':
                return '#d1fae5';
            case 'draft':
                return '#fef3c7';
            case 'archived':
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
                    <Text style={[styles.headerTitle, { color: text }]}>Places</Text>
                    <Text style={[styles.headerSubtitle, { color: muted }]}>
                        {filteredPlaces.length} places found
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => router.push('/(admin)/(stack)/add-place' as any)}
                >
                    <IconSymbol name="plus" size={24} color={card} />
                </TouchableOpacity>
            </View>

            {/* Map View */}
            <View style={styles.mapContainer}>
                <View style={styles.mapPlaceholder}>
                    <IconSymbol name="map.fill" size={48} color={tint} />
                    <Text style={styles.mapPlaceholderText}>Interactive Map</Text>
                    <Text style={styles.mapSubtext}>
                        {selectedPlace ? `Showing: ${selectedPlace.name}` : 'Select a place to view on map'}
                    </Text>
                </View>

                {/* Map Controls */}
                <View style={styles.mapControls}>
                    <TouchableOpacity style={styles.controlButton}>
                        <IconSymbol name="location.fill" size={20} color="#0a7ea4" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.controlButton}>
                        <IconSymbol name="plus" size={20} color={text} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.controlButton}>
                        <IconSymbol name="minus" size={20} color={text} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search and Filter */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <IconSymbol name="magnifyingglass" size={20} color={muted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search places..."
                        placeholderTextColor={muted}
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
                    <IconSymbol name="slider.horizontal.3" size={20} color={tint} />
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

            {/* Places List */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {filteredPlaces.length > 0 ? (
                    filteredPlaces.map((place) => (
                        <TouchableOpacity
                            key={place.id}
                            style={[
                                styles.placeCard,
                                selectedPlace?.id === place.id && styles.placeCardSelected,
                            ]}
                            onPress={() => handlePlacePress(place)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.placeHeader}>
                                <View style={styles.placeInfo}>
                                    <Text style={styles.placeName} numberOfLines={1}>
                                        {place.name}
                                    </Text>
                                    <Text style={styles.placeCategory}>{place.category}</Text>
                                </View>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        { backgroundColor: getStatusBgColor(place.status) },
                                    ]}
                                >
                                    <Text style={[styles.statusText, { color: getStatusColor(place.status) }]}>
                                        {place.status.charAt(0).toUpperCase() + place.status.slice(1)}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.placeDescription} numberOfLines={2}>
                                {place.description}
                            </Text>

                            <View style={styles.placeMeta}>
                                <View style={styles.metaItem}>
                                    <IconSymbol name="location.fill" size={14} color="#687076" />
                                    <Text style={styles.metaText} numberOfLines={1}>
                                        {place.location.city}
                                    </Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <IconSymbol name="star.fill" size={14} color="#fbbf24" />
                                    <Text style={styles.metaText}>
                                        {place.rating?.toFixed(1)} ({place.reviewCount})
                                    </Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <IconSymbol name="eye.fill" size={14} color="#687076" />
                                    <Text style={styles.metaText}>{place.visitCount}</Text>
                                </View>
                            </View>

                            <View style={styles.placeFooter}>
                                <Text style={styles.placeFee}>
                                    {place.entryFee ? `₹${place.entryFee}` : 'Free'}
                                </Text>
                                <View style={styles.placeActions}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.editButton]}
                                        onPress={() => handleEditPlace(place)}
                                    >
                                        <IconSymbol name="pencil" size={16} color="#fff" />
                                    </TouchableOpacity>
                                    {place.status === 'draft' && (
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.publishButton]}
                                            onPress={() => handleStatusChange(place.id, 'active')}
                                        >
                                            <IconSymbol name="checkmark" size={16} color="#fff" />
                                        </TouchableOpacity>
                                    )}
                                    {place.status === 'active' && (
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.archiveButton]}
                                            onPress={() => handleStatusChange(place.id, 'archived')}
                                        >
                                            <IconSymbol name="archivebox.fill" size={16} color="#fff" />
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.deleteButton]}
                                        onPress={() => handleDeletePlace(place.id)}
                                    >
                                        <IconSymbol name="trash.fill" size={16} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <IconSymbol name="map.fill" size={64} color="#d1d5db" />
                        <Text style={styles.emptyTitle}>No places found</Text>
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
        // backgroundColor will be set inline
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
        // backgroundColor will be set inline
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        // color will be set inline
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        // color will be set inline
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#0a7ea4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapContainer: {
        height: MAP_HEIGHT,
        backgroundColor: '#e8f4f8',
        position: 'relative',
    },
    mapPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    mapPlaceholderText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#11181C',
        marginTop: 12,
    },
    mapSubtext: {
        fontSize: 13,
        color: '#687076',
        marginTop: 4,
        textAlign: 'center',
    },
    mapControls: {
        position: 'absolute',
        right: 12,
        top: 12,
        gap: 8,
    },
    controlButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        padding: 12,
        gap: 8,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#11181C',
    },
    filterButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#e8f4f8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    filtersContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    filterSection: {
        marginBottom: 8,
    },
    filterLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#11181C',
        marginBottom: 8,
    },
    filterChips: {
        gap: 6,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    filterChipActive: {
        backgroundColor: '#0a7ea4',
        borderColor: '#0a7ea4',
    },
    filterChipText: {
        fontSize: 13,
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
        padding: 12,
        paddingBottom: 100,
    },
    placeCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    placeCardSelected: {
        borderColor: '#0a7ea4',
    },
    placeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    placeInfo: {
        flex: 1,
        marginRight: 8,
    },
    placeName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#11181C',
        marginBottom: 2,
    },
    placeCategory: {
        fontSize: 12,
        color: '#687076',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    placeDescription: {
        fontSize: 13,
        color: '#687076',
        lineHeight: 18,
        marginBottom: 10,
    },
    placeMeta: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 10,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
    },
    metaText: {
        fontSize: 12,
        color: '#687076',
        flex: 1,
    },
    placeFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    placeFee: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0a7ea4',
    },
    placeActions: {
        flexDirection: 'row',
        gap: 6,
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editButton: {
        backgroundColor: '#3b82f6',
    },
    publishButton: {
        backgroundColor: '#10b981',
    },
    archiveButton: {
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
