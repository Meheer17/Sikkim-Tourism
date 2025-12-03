import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Dimensions,
    Modal,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Place } from '@/types/admin.types';
import { useApi } from '@/hooks/useApi';
import { useThemeColor } from '@/hooks/use-theme-color';
import { locationService, LocationModel } from '@/services/location.service';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = SCREEN_HEIGHT * 0.64;

// Default center for Sikkim
const DEFAULT_REGION = {
    latitude: 27.533,
    longitude: 88.5122,
    latitudeDelta: 1.5,
    longitudeDelta: 1.5,
};

// Removed static mock data; places now only from backend.

const CATEGORIES = ['All', 'Religious Site', 'Natural Beauty', 'Shopping', 'Historical', 'Adventure'];
const STATUSES = ['All', 'Active', 'Draft', 'Archived'];

export default function AdminPlacesScreen() {
    const router = useRouter();
    const mapRef = useRef<MapView>(null);
    const [places, setPlaces] = useState<Place[]>([]);
    const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
    const [showSearchModal, setShowSearchModal] = useState(false);
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

    // Load from backend /location
    useEffect(() => {
        const loadLocations = async () => {
            try {
                const resp = await locationService.list({ skip: 0, limit: 100 });
                console.log('Raw location response:', JSON.stringify(resp.data?.[0], null, 2));
                if (resp.success && resp.data) {
                    const mapped: Place[] = resp.data.map((loc: any) => {
                        return {
                        id: loc.id,
                        name: loc.name,
                        description: loc.description,
                        category: loc.type === 'tourism' ? 'Natural Beauty' : loc.type,
                        location: {
                            latitude: loc.position?.y ?? 0,  // position.y is latitude
                            longitude: loc.position?.x ?? 0, // position.x is longitude
                            address: '',
                            city: '',
                            state: '',
                            country: '',
                        },
                        address: loc.short_description,
                        rating: undefined as any,
                        reviewCount: undefined as any,
                        visitCount: undefined as any,
                        entryFee: undefined as any,
                        openingHours: '',
                        bestTimeToVisit: '',
                        highlights: [],
                        facilities: [],
                        status: 'active',
                        createdBy: '',
                        createdAt: loc.created_at || '',
                        updatedAt: loc.updated_at || '',
                    };
                    });
                    setPlaces(mapped);
                    setFilteredPlaces(mapped);
                }
            } catch (e) {
                console.warn('Failed to load locations:', e);
            } finally {
                setLoading(false);
            }
        };
        loadLocations();
    }, []);

    const handlePlacePress = (place: Place) => {
        setSelectedPlace(place);
        // Animate map to the selected place
        if (mapRef.current && place.location.latitude && place.location.longitude) {
            mapRef.current.animateToRegion({
                latitude: place.location.latitude,
                longitude: place.location.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            }, 1000);
        }
        // Navigate to place details
        router.push(`/(admin)/(stack)/place-details?id=${place.id}` as any);
    };

    const handleEditPlace = (place: Place) => {
        if (!place.id) {
            Alert.alert('Error', 'Place ID is missing');
            console.error('Cannot edit place without ID:', place);
            return;
        }
        console.log('Editing place with ID:', place.id);
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
                    onPress: async () => {
                        try {
                            await locationService.remove(placeId);
                            setPlaces(prev => prev.filter(p => p.id !== placeId));
                            if (selectedPlace?.id === placeId) {
                                setSelectedPlace(null);
                            }
                        } catch (e) {
                            Alert.alert('Error', 'Failed to delete place');
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

    const handleRecenter = () => {
        if (mapRef.current) {
            if (selectedPlace && selectedPlace.location.latitude && selectedPlace.location.longitude) {
                mapRef.current.animateToRegion({
                    latitude: selectedPlace.location.latitude,
                    longitude: selectedPlace.location.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }, 1000);
            } else {
                mapRef.current.animateToRegion(DEFAULT_REGION, 1000);
            }
        }
    };

    const handleZoomIn = () => {
        if (mapRef.current) {
            mapRef.current.getCamera().then(camera => {
                if (camera.zoom) {
                    camera.zoom += 1;
                    mapRef.current?.animateCamera(camera, { duration: 300 });
                }
            });
        }
    };

    const handleZoomOut = () => {
        if (mapRef.current) {
            mapRef.current.getCamera().then(camera => {
                if (camera.zoom && camera.zoom > 1) {
                    camera.zoom -= 1;
                    mapRef.current?.animateCamera(camera, { duration: 300 });
                }
            });
        }
    };

    const getMarkerColor = (place: Place) => {
        if (selectedPlace?.id === place.id) return '#0a7ea4';
        switch (place.status) {
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

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: card, borderBottomColor: muted + '40' }]}>
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
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    provider={PROVIDER_DEFAULT}
                    initialRegion={DEFAULT_REGION}
                    showsUserLocation={true}
                    showsMyLocationButton={false}
                    showsCompass={true}
                    showsScale={true}
                    loadingEnabled={true}
                >
                    {filteredPlaces.map((place, index) => {
                        if (!place.location.latitude || !place.location.longitude) return null;
                        
                        return (
                            <Marker
                                key={`marker-${place.id}-${index}`}
                                coordinate={{
                                    latitude: place.location.latitude,
                                    longitude: place.location.longitude,
                                }}
                                title={place.name}
                                description={place.category}
                                pinColor={getMarkerColor(place)}
                                onPress={() => handlePlacePress(place)}
                            />
                        );
                    })}
                </MapView>

                {/* Map Info Overlay */}
                {selectedPlace && (
                    <View style={[styles.mapInfoOverlay, { backgroundColor: card }]}>
                        <View style={styles.mapInfoContent}>
                            <Text style={[styles.mapInfoTitle, { color: text }]} numberOfLines={1}>
                                {selectedPlace.name}
                            </Text>
                            <Text style={[styles.mapInfoSubtitle, { color: muted }]} numberOfLines={1}>
                                {selectedPlace.category}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.mapInfoClose, { backgroundColor: background }]}
                            onPress={() => setSelectedPlace(null)}
                        >
                            <IconSymbol name="xmark" size={16} color={muted} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Map Controls */}
                <View style={styles.mapControls}>
                    <TouchableOpacity style={[styles.controlButton, { backgroundColor: card }]} onPress={handleRecenter}>
                        <IconSymbol name="location.fill" size={20} color={tint} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.controlButton, { backgroundColor: card }]} onPress={handleZoomIn}>
                        <IconSymbol name="plus" size={20} color={text} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.controlButton, { backgroundColor: card }]} onPress={handleZoomOut}>
                        <IconSymbol name="minus" size={20} color={text} />
                    </TouchableOpacity>
                </View>

            </View>

            {/* Search Bar */}
            <View 
                style={[styles.searchBarContainer, { backgroundColor: card, borderBottomColor: muted + '40' }]}
                pointerEvents="auto"
            >
                <TouchableOpacity
                    onPress={() => setShowSearchModal(true)}
                    activeOpacity={0.7}
                    style={{ flex: 1 }}
                >
                    <View style={[styles.searchBarButton, { backgroundColor: background, borderColor: muted + '40' }]}>
                        <IconSymbol name="magnifyingglass" size={20} color={muted} />
                        <Text style={[styles.searchPlaceholder, { color: muted }]}>
                            {searchQuery || selectedCategory !== 'All' || selectedStatus !== 'All'
                                ? `${filteredPlaces.length} places found`
                                : 'Search or View Places...'}
                        </Text>
                        {(searchQuery || selectedCategory !== 'All' || selectedStatus !== 'All') && (
                            <View style={[styles.activeFilterBadge, { backgroundColor: tint }]}>
                                <IconSymbol name="line.horizontal.3.decrease.circle.fill" size={20} color="#fff" />
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </View>

            {/* Empty placeholder for layout */}
            <View style={{ flex: 1 }}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    bounces={true}
                >
                    <View style={styles.emptyState}>
                        <IconSymbol name="map.fill" size={64} color={muted} />
                        <Text style={[styles.emptyTitle, { color: text }]}>Tap the search bar above</Text>
                        <Text style={[styles.emptySubtitle, { color: muted }]}>
                            Search and browse all places on the map
                        </Text>
                    </View>
                </ScrollView>
            </View>

            {/* Search Modal with Places List */}
            <Modal
                visible={showSearchModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowSearchModal(false)}
            >
                <View style={[styles.modalContainer, { backgroundColor: background }]}>
                    {/* Modal Header */}
                    <View style={[styles.modalHeader, { backgroundColor: card, borderBottomColor: muted + '40' }]}>
                        <Text style={[styles.modalTitle, { color: text }]}>Places</Text>
                        <TouchableOpacity onPress={() => setShowSearchModal(false)}>
                            <IconSymbol name="xmark.circle.fill" size={28} color={muted} />
                        </TouchableOpacity>
                    </View>

                    {/* Search Bar in Modal */}
                    <View style={[styles.modalSearchContainer, { backgroundColor: card, borderBottomColor: muted + '40' }]}>
                        <View style={[styles.searchBar, { backgroundColor: background, borderColor: muted + '40' }]}>
                            <IconSymbol name="magnifyingglass" size={20} color={muted} />
                            <TextInput
                                style={[styles.searchInput, { color: text }]}
                                placeholder="Search places..."
                                placeholderTextColor={muted}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus={false}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <IconSymbol name="xmark.circle.fill" size={20} color={muted} />
                                </TouchableOpacity>
                            )}
                        </View>
                        <TouchableOpacity
                            style={[styles.filterToggleButton, { backgroundColor: showFilters ? tint : background, borderColor: showFilters ? tint : muted + '40' }]}
                            onPress={() => setShowFilters(!showFilters)}
                        >
                            <IconSymbol name="line.horizontal.3.decrease.circle" size={20} color={showFilters ? '#fff' : muted} />
                        </TouchableOpacity>
                    </View>

                    {/* Filters */}
                    {showFilters && (
                        <View style={[styles.filtersContainer, { backgroundColor: card, borderBottomColor: muted + '40' }]}>
                            {/* Category Filter */}
                            <View style={styles.filterSection}>
                                <Text style={[styles.filterLabel, { color: text }]}>Category</Text>
                                <View style={styles.filterChipsContainer}>
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
                                </View>
                            </View>

                            {/* Status Filter */}
                            <View style={styles.filterSection}>
                                <Text style={[styles.filterLabel, { color: text }]}>Status</Text>
                                <View style={styles.filterChipsContainer}>
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
                                </View>
                            </View>

                            {/* Clear Filters */}
                            {(searchQuery || selectedCategory !== 'All' || selectedStatus !== 'All') && (
                                <TouchableOpacity
                                    style={[styles.clearFiltersButton, { backgroundColor: background, borderColor: muted + '40' }]}
                                    onPress={() => {
                                        setSearchQuery('');
                                        setSelectedCategory('All');
                                        setSelectedStatus('All');
                                    }}
                                >
                                    <IconSymbol name="xmark" size={16} color={muted} />
                                    <Text style={[styles.clearFiltersText, { color: muted }]}>Clear All</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {/* Places List in Modal */}
                    <ScrollView
                        style={styles.modalPlacesList}
                        contentContainerStyle={styles.modalPlacesContent}
                        showsVerticalScrollIndicator={true}
                    >
                        {loading && (
                            <View style={styles.emptyState}>
                                <Text style={[styles.emptySubtitle, { color: muted }]}>Loading places...</Text>
                            </View>
                        )}
                        {!loading && filteredPlaces.length > 0 ? (
                            filteredPlaces.map((place, index) => (
                            <TouchableOpacity
                                key={`place-${place.id || 'unknown'}-${index}`}
                            style={[
                                styles.placeCard,
                                { backgroundColor: card, borderColor: muted + '30' },
                                selectedPlace?.id === place.id && [styles.placeCardSelected, { borderColor: tint }],
                            ]}
                            onPress={() => handlePlacePress(place)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.placeHeader}>
                                <View style={styles.placeInfo}>
                                    <Text style={[styles.placeName, { color: text }]} numberOfLines={1}>
                                        {place.name}
                                    </Text>
                                    <Text style={[styles.placeCategory, { color: muted }]}>{place.category}</Text>
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

                            <Text style={[styles.placeDescription, { color: muted }]} numberOfLines={2}>
                                {place.description}
                            </Text>

                            <View style={styles.placeMeta}>
                                <View style={styles.metaItem}>
                                    <IconSymbol name="location.fill" size={14} color={muted} />
                                    <Text style={[styles.metaText, { color: muted }]} numberOfLines={1}>
                                        {place.location.city}
                                    </Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <IconSymbol name="star.fill" size={14} color="#fbbf24" />
                                    <Text style={[styles.metaText, { color: muted }]}>
                                        {place.rating?.toFixed(1)} ({place.reviewCount})
                                    </Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <IconSymbol name="eye.fill" size={14} color={muted} />
                                    <Text style={[styles.metaText, { color: muted }]}>{place.visitCount}</Text>
                                </View>
                            </View>

                            <View style={[styles.placeFooter, { borderTopColor: muted + '20' }]}>
                                <Text style={[styles.placeFee, { color: tint }]}>
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
                        ) : (!loading && (
                            <View style={styles.emptyState}>
                                <IconSymbol name="map.fill" size={64} color={muted} />
                                <Text style={[styles.emptyTitle, { color: text }]}>No places found</Text>
                                <Text style={[styles.emptySubtitle, { color: muted }]}>
                                    Try adjusting your search or filters
                                </Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </Modal>
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
    map: {
        width: '100%',
        height: '100%',
    },
    mapInfoOverlay: {
        position: 'absolute',
        top: 12,
        left: 12,
        right: 60,
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    mapInfoContent: {
        flex: 1,
    },
    mapInfoTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
    },
    mapInfoSubtitle: {
        fontSize: 12,
    },
    mapInfoClose: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
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
        marginTop: 12,
    },
    mapSubtext: {
        fontSize: 13,
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
    searchBarContainer: {
        padding: 16,
        zIndex: 10,
        elevation: 5,
        minHeight: 80,
    },
    searchBarButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    searchPlaceholder: {
        flex: 1,
        fontSize: 16,
    },
    activeFilterBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 20,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '700',
    },
    modalSearchContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 8,
        borderBottomWidth: 1,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 12,

        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    filterToggleButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filtersContainer: {
        padding: 16,
        borderBottomWidth: 1,
    },
    filterSection: {
        marginBottom: 16,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
    },
    filterChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: '600',
    },
    clearFiltersButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 8,
    },
    clearFiltersText: {
        fontSize: 14,
        fontWeight: '600',
    },
    modalPlacesList: {
        flex: 1,
    },
    modalPlacesContent: {
        padding: 12,
        paddingBottom: 40,
    },
    scrollView: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    scrollContent: {
        padding: 12,
        paddingBottom: 120,
    },
    placeCard: {
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderWidth: 2,
    },
    placeCardSelected: {
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
        marginBottom: 2,
    },
    placeCategory: {
        fontSize: 12,
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
        flex: 1,
    },
    placeFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
    },
    placeFee: {
        fontSize: 18,
        fontWeight: '700',
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
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
    },
});
