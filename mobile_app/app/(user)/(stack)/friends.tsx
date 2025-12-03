import { IconSymbol } from '@/components/ui/icon-symbol';
import { getLanguageTranslations } from '@/constants/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Animated, Dimensions, PanResponder, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = SCREEN_HEIGHT * 0.45;
const MODAL_MIN_HEIGHT = SCREEN_HEIGHT * 0.35;
const MODAL_MAX_HEIGHT = SCREEN_HEIGHT * 0.75;

// Mock friend data with locations
interface Friend {
    id: string;
    name: string;
    avatar: string;
    location: {
        lat: number;
        lng: number;
        placeName: string;
    };
    distance: string;
    lastSeen: string;
    isOnline: boolean;
    sharingLocation: boolean;
}

const MOCK_FRIENDS: Friend[] = [
    {
        id: '1',
        name: 'Rajesh Kumar',
        avatar: 'RK',
        location: {
            lat: 27.3389,
            lng: 88.6065,
            placeName: 'MG Marg, Gangtok',
        },
        distance: '0.8 km',
        lastSeen: 'Just now',
        isOnline: true,
        sharingLocation: true,
    },
    {
        id: '2',
        name: 'Priya Sharma',
        avatar: 'PS',
        location: {
            lat: 27.3314,
            lng: 88.6138,
            placeName: 'Rumtek Monastery',
        },
        distance: '4.2 km',
        lastSeen: '5 min ago',
        isOnline: true,
        sharingLocation: true,
    },
    {
        id: '3',
        name: 'Amit Patel',
        avatar: 'AP',
        location: {
            lat: 27.3525,
            lng: 88.6094,
            placeName: 'Enchey Monastery',
        },
        distance: '2.1 km',
        lastSeen: '15 min ago',
        isOnline: true,
        sharingLocation: true,
    },
    {
        id: '4',
        name: 'Sneha Desai',
        avatar: 'SD',
        location: {
            lat: 27.3364,
            lng: 88.6139,
            placeName: 'Ridge Park',
        },
        distance: '1.5 km',
        lastSeen: '2 hours ago',
        isOnline: false,
        sharingLocation: true,
    },
    {
        id: '5',
        name: 'Vikram Singh',
        avatar: 'VS',
        location: {
            lat: 27.3389,
            lng: 88.6065,
            placeName: 'Tsomgo Lake',
        },
        distance: '38 km',
        lastSeen: '1 hour ago',
        isOnline: false,
        sharingLocation: false,
    },
];

const RADIUS_OPTIONS = [1, 5, 10, 25, 50];

export default function FriendsScreen() {
    const router = useRouter();
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const [friends] = useState<Friend[]>(MOCK_FRIENDS);
    const [selectedRadius, setSelectedRadius] = useState(10); // in km
    const [shareMyLocation, setShareMyLocation] = useState(true);
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
    const modalHeight = useRef(new Animated.Value(MODAL_MIN_HEIGHT)).current;
    const [isExpanded, setIsExpanded] = useState(false);

    const filteredFriends = friends.filter((friend) => {
        if (!friend.sharingLocation) return false;
        const distance = parseFloat(friend.distance.split(' ')[0]);
        return distance <= selectedRadius;
    });

    const handleFriendPress = (friend: Friend) => {
        setSelectedFriend(friend);
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dy) > 5;
            },
            onPanResponderMove: (_, gestureState) => {
                const baseHeight = isExpanded ? MODAL_MAX_HEIGHT : MODAL_MIN_HEIGHT;
                const newHeight = baseHeight - gestureState.dy;

                let clampedHeight;
                if (newHeight > MODAL_MAX_HEIGHT) {
                    const overflow = newHeight - MODAL_MAX_HEIGHT;
                    clampedHeight = MODAL_MAX_HEIGHT + (overflow * 0.2);
                } else if (newHeight < MODAL_MIN_HEIGHT) {
                    const underflow = MODAL_MIN_HEIGHT - newHeight;
                    clampedHeight = MODAL_MIN_HEIGHT - (underflow * 0.2);
                } else {
                    clampedHeight = newHeight;
                }

                clampedHeight = Math.max(MODAL_MIN_HEIGHT * 0.8, clampedHeight);
                modalHeight.setValue(clampedHeight);
            },
            onPanResponderRelease: (_, gestureState) => {
                const baseHeight = isExpanded ? MODAL_MAX_HEIGHT : MODAL_MIN_HEIGHT;
                const currentHeight = baseHeight - gestureState.dy;
                const threshold = (MODAL_MAX_HEIGHT + MODAL_MIN_HEIGHT) / 2;

                let targetHeight = MODAL_MIN_HEIGHT;
                let shouldExpand = false;

                if (gestureState.vy < -0.5) {
                    targetHeight = MODAL_MAX_HEIGHT;
                    shouldExpand = true;
                } else if (gestureState.vy > 0.5) {
                    targetHeight = MODAL_MIN_HEIGHT;
                    shouldExpand = false;
                } else if (Math.abs(gestureState.dy) > 50) {
                    if (gestureState.dy < 0) {
                        targetHeight = MODAL_MAX_HEIGHT;
                        shouldExpand = true;
                    } else {
                        targetHeight = MODAL_MIN_HEIGHT;
                        shouldExpand = false;
                    }
                } else {
                    if (currentHeight > threshold) {
                        targetHeight = MODAL_MAX_HEIGHT;
                        shouldExpand = true;
                    } else {
                        targetHeight = MODAL_MIN_HEIGHT;
                        shouldExpand = false;
                    }
                }

                setIsExpanded(shouldExpand);
                Animated.timing(modalHeight, {
                    toValue: targetHeight,
                    duration: 350,
                    useNativeDriver: false,
                }).start();
            },
        })
    ).current;

    const toggleModal = () => {
        const targetHeight = isExpanded ? MODAL_MIN_HEIGHT : MODAL_MAX_HEIGHT;
        setIsExpanded(!isExpanded);
        Animated.timing(modalHeight, {
            toValue: targetHeight,
            duration: 350,
            useNativeDriver: false,
        }).start();
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <IconSymbol name="chevron.left" size={24} color="#11181C" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>{t.friendsLocation}</Text>
                    <Text style={styles.headerSubtitle}>
                        {filteredFriends.length} {t.friendsLocationSubtitle}
                    </Text>
                </View>
                <TouchableOpacity style={styles.addButton}>
                    <IconSymbol name="person.badge.plus" size={24} color="#0a7ea4" />
                </TouchableOpacity>
            </View>

            {/* Map Container */}
            <View style={styles.mapContainer}>
                <View style={styles.mapPlaceholder}>
                    <IconSymbol name="map.fill" size={64} color="#0a7ea4" />
                    <Text style={styles.mapPlaceholderText}>{t.location} {t.explore}</Text>
                    <Text style={styles.mapSubtext}>
                        {t.searchRadius} {selectedRadius} km
                    </Text>

                    {/* Friend Markers Preview */}
                    <View style={styles.markersPreview}>
                        {filteredFriends.map((friend, index) => (
                            <View
                                key={friend.id}
                                style={[
                                    styles.markerPreview,
                                    {
                                        left: `${(index * 20) % 80}%`,
                                        top: `${(index * 15) % 60}%`,
                                    },
                                ]}
                            >
                                <View style={[
                                    styles.markerDot,
                                    friend.isOnline && styles.markerDotOnline,
                                ]}>
                                    <Text style={styles.markerText}>{friend.avatar}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Map Controls */}
                <View style={styles.mapControls}>
                    <TouchableOpacity style={styles.controlButton}>
                        <IconSymbol name="location.fill" size={24} color="#0a7ea4" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.controlButton}>
                        <IconSymbol name="plus" size={24} color="#11181C" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.controlButton}>
                        <IconSymbol name="minus" size={24} color="#11181C" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Controls Section */}
            <Animated.View
                style={[
                    styles.modalContainer,
                    { height: modalHeight }
                ]}
            >
                {/* Handle */}
                <View
                    style={styles.modalHandle}
                    {...panResponder.panHandlers}
                >
                    <TouchableOpacity
                        onPress={toggleModal}
                        activeOpacity={0.7}
                        style={styles.handleTouchable}
                    >
                        <View style={styles.handle} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.modalScroll}
                    contentContainerStyle={styles.modalContent}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={isExpanded}
                >
                    {/* Share Location Toggle */}
                    <View style={styles.shareLocationCard}>
                        <View style={styles.shareLocationLeft}>
                            <View style={[styles.shareIcon, { backgroundColor: shareMyLocation ? '#dcfce7' : '#fee2e2' }]}>
                                <IconSymbol
                                    name={shareMyLocation ? 'location.fill' : 'location.slash.fill'}
                                    size={24}
                                    color={shareMyLocation ? '#10b981' : '#ef4444'}
                                />
                            </View>
                            <View>
                                <Text style={styles.shareLocationTitle}>{t.shareMyLocation}</Text>
                                <Text style={styles.shareLocationSubtitle}>
                                    {shareMyLocation ? t.shareLocationToggleOn : t.shareLocationToggleOff}
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={shareMyLocation}
                            onValueChange={setShareMyLocation}
                            trackColor={{ false: '#d1d5db', true: '#0a7ea4' }}
                            thumbColor="#fff"
                        />
                    </View>

                    {/* Radius Selector */}
                    <View style={styles.radiusSection}>
                        <Text style={styles.radiusTitle}>{t.searchRadius}</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.radiusOptions}
                        >
                            {RADIUS_OPTIONS.map((radius) => (
                                <TouchableOpacity
                                    key={radius}
                                    style={[
                                        styles.radiusButton,
                                        selectedRadius === radius && styles.radiusButtonActive,
                                    ]}
                                    onPress={() => setSelectedRadius(radius)}
                                >
                                    <Text
                                        style={[
                                            styles.radiusText,
                                            selectedRadius === radius && styles.radiusTextActive,
                                        ]}
                                    >
                                        {radius} km
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Friends List */}
                    <Text style={styles.sectionTitle}>
                        {t.nearbyFriends} ({filteredFriends.length})
                    </Text>

                    {filteredFriends.map((friend) => (
                        <TouchableOpacity
                            key={friend.id}
                            style={[
                                styles.friendCard,
                                selectedFriend?.id === friend.id && styles.friendCardSelected,
                            ]}
                            onPress={() => handleFriendPress(friend)}
                        >
                            <View style={styles.friendLeft}>
                                <View style={styles.friendAvatarContainer}>
                                    <View style={styles.friendAvatar}>
                                        <Text style={styles.friendAvatarText}>{friend.avatar}</Text>
                                    </View>
                                    {friend.isOnline && <View style={styles.onlineBadge} />}
                                </View>
                                <View style={styles.friendInfo}>
                                    <Text style={styles.friendName}>{friend.name}</Text>
                                    <View style={styles.locationInfo}>
                                        <IconSymbol name="mappin.circle.fill" size={14} color="#687076" />
                                        <Text style={styles.locationText}>{friend.location.placeName}</Text>
                                    </View>
                                    <Text style={styles.lastSeen}>{friend.lastSeen}</Text>
                                </View>
                            </View>
                            <View style={styles.friendRight}>
                                <View style={styles.distanceBadge}>
                                    <Text style={styles.distanceText}>{friend.distance}</Text>
                                </View>
                                <TouchableOpacity style={styles.directionsButton}>
                                    <IconSymbol name="arrow.triangle.turn.up.right.circle.fill" size={24} color="#0a7ea4" />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))}

                    {/* Offline/Not Sharing Friends */}
                    {friends.filter(f => !f.sharingLocation).length > 0 && (
                        <>
                            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
                                {t.notSharingLocation}
                            </Text>
                            {friends.filter(f => !f.sharingLocation).map((friend) => (
                                <View key={friend.id} style={styles.friendCard}>
                                    <View style={styles.friendLeft}>
                                        <View style={styles.friendAvatarContainer}>
                                            <View style={[styles.friendAvatar, styles.friendAvatarOffline]}>
                                                <Text style={styles.friendAvatarText}>{friend.avatar}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.friendInfo}>
                                            <Text style={styles.friendName}>{friend.name}</Text>
                                            <Text style={styles.offlineText}>{t.locationSharingDisabled}</Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </>
                    )}
                </ScrollView>
            </Animated.View>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#11181C',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#687076',
        marginTop: 2,
    },
    addButton: {
        width: 40,
        height: 40,
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
        position: 'relative',
    },
    mapPlaceholderText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#11181C',
        marginTop: 12,
    },
    mapSubtext: {
        fontSize: 14,
        color: '#687076',
        marginTop: 4,
    },
    markersPreview: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    markerPreview: {
        position: 'absolute',
    },
    markerDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#687076',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    markerDotOnline: {
        backgroundColor: '#10b981',
    },
    markerText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#fff',
    },
    mapControls: {
        position: 'absolute',
        right: 16,
        top: 16,
        gap: 8,
    },
    controlButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    modalContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    modalHandle: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    handleTouchable: {
        padding: 8,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#d1d5db',
        borderRadius: 2,
    },
    modalScroll: {
        flex: 1,
    },
    modalContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    shareLocationCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    shareLocationLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    shareIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    shareLocationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#11181C',
    },
    shareLocationSubtitle: {
        fontSize: 13,
        color: '#687076',
        marginTop: 2,
    },
    radiusSection: {
        marginTop: 8,
    },
    radiusTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#11181C',
        marginBottom: 12,
    },
    radiusOptions: {
        gap: 8,
    },
    radiusButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    radiusButtonActive: {
        backgroundColor: '#0a7ea4',
        borderColor: '#0a7ea4',
    },
    radiusText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#687076',
    },
    radiusTextActive: {
        color: '#fff',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#11181C',
        marginBottom: 12,
        marginTop: 16,
    },
    friendCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    friendCardSelected: {
        borderWidth: 2,
        borderColor: '#0a7ea4',
    },
    friendLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    friendAvatarContainer: {
        position: 'relative',
    },
    friendAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#0a7ea4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    friendAvatarOffline: {
        backgroundColor: '#9ca3af',
    },
    friendAvatarText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#10b981',
        borderWidth: 2,
        borderColor: '#fff',
    },
    friendInfo: {
        flex: 1,
    },
    friendName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#11181C',
        marginBottom: 4,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 2,
    },
    locationText: {
        fontSize: 13,
        color: '#687076',
    },
    lastSeen: {
        fontSize: 12,
        color: '#9ca3af',
    },
    offlineText: {
        fontSize: 13,
        color: '#9ca3af',
        fontStyle: 'italic',
    },
    friendRight: {
        alignItems: 'flex-end',
        gap: 8,
    },
    distanceBadge: {
        backgroundColor: '#e8f4f8',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    distanceText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0a7ea4',
    },
    directionsButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
