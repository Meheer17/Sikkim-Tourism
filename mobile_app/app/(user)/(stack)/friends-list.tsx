import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform, ActivityIndicator, StatusBar, Linking, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as Location from 'expo-location';
import { FriendsAPI, MemberLocation } from '@/services/friends.service';
import { AppStorage } from '@/utils/storage';


interface Friend {
    id: string;
    name: string;
    avatar: string;
    location: {
        lat: number;
        lng: number;
        placeName?: string;
    };
    distance: string;
    lastSeen: string;
    isOnline: boolean;
    sharingLocation: boolean;
}

type GroupInfo = { group_id: string; code: string };

export default function FriendsListPage() {
    const router = useRouter();
    const [selectedRadius, setSelectedRadius] = useState(10);
    const [shareMyLocation, setShareMyLocation] = useState(true);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [members, setMembers] = useState<MemberLocation[]>([]);
    const [group, setGroup] = useState<GroupInfo | null>(null);
    const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const isInitialized = useRef(false);
    const disbandAlertShown = useRef(false);
    const [isGroupOwner, setIsGroupOwner] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Hide status bar while on this screen
    useEffect(() => {
        StatusBar.setHidden(false, 'fade');
        return () => {
            StatusBar.setHidden(false, 'fade');
        };
    }, []);

    const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const toRad = (v: number) => (v * Math.PI) / 180;
        const R = 6371; // km
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const timeAgo = (iso?: string) => {
        return 'Just now';
    };

    const toFriend = (m: MemberLocation): Friend | null => {
        const my = currentPosition;
        const hasLocation = m.lat != null && m.lng != null;
        const distance = my && hasLocation ? getDistanceKm(my.lat, my.lng, m.lat!, m.lng!) : undefined;
        return {
            id: m.user_id,
            name: m.name || 'Friend',
            avatar: m.initials || 'FR',
            location: { lat: m.lat || 0, lng: m.lng || 0, placeName: undefined },
            distance: distance !== undefined ? `${distance.toFixed(1)} km` : '—',
            lastSeen: timeAgo(m.last_seen_at),
            isOnline: !!(m.last_seen_at && (Date.now() - new Date(m.last_seen_at).getTime()) < 2 * 60 * 1000),
            sharingLocation: hasLocation,
        };
    };

    useEffect(() => {
        const loadInitial = async () => {
            try {
                // Get current user ID from token
                const { TokenManager } = await import('@/utils/storage');
                const token = await TokenManager.getAccessToken();
                let userId: string | null = null;
                if (token) {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    userId = payload.sub;
                    setCurrentUserId(userId);
                }

                // Restore preferences
                const savedRadius = await AppStorage.getItem<number>('friends_radius');
                if (typeof savedRadius === 'number') setSelectedRadius(savedRadius);
                const savedShare = await AppStorage.getItem<boolean>('friends_share_location');
                if (typeof savedShare === 'boolean') setShareMyLocation(savedShare);

                // Get current position
                const { status } = await Location.getForegroundPermissionsAsync();
                if (status === 'granted') {
                    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    setCurrentPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                }

                // Get group from storage
                const saved = await AppStorage.getItem<GroupInfo>('friends_group');
                if (saved?.group_id) {
                    setGroup(saved);
                    // Get group info to check ownership
                    const info = await FriendsAPI.getGroupInfo(saved.group_id);
                    if (info.data && userId) {
                        const isOwner = info.data.owner_id === userId;
                        console.log('[FriendsList] Owner check:', { 
                            ownerId: info.data.owner_id, 
                            userId, 
                            isOwner 
                        });
                        setIsGroupOwner(isOwner);
                    }
                    const resp = await FriendsAPI.listMembers(saved.group_id);
                    if (resp.data) setMembers(resp.data.members);
                }
            } catch (error) {
                console.error('Error loading friends:', error);
            } finally {
                setLoading(false);
                isInitialized.current = true;
            }
        };
        loadInitial();
    }, []);

    // Refetch members when screen gains focus without resetting UI state
    useFocusEffect(
        React.useCallback(() => {
            const refetch = async () => {
                try {
                    if (group?.group_id) {
                        // Validate group still exists to avoid infinite alerts
                        const valid = await FriendsAPI.validateGroup(group.group_id);
                        if (valid.data && valid.data.exists) {
                            const resp = await FriendsAPI.listMembers(group.group_id);
                            if (resp.data) setMembers(resp.data.members);
                        } else {
                            // Group disbanded: clear state and storage; alert only once
                            setGroup(null);
                            setMembers([]);
                            await AppStorage.removeItem('friends_group');
                            if (!disbandAlertShown.current) {
                                disbandAlertShown.current = true;
                                Alert.alert('Group Disbanded', 'The group owner has disbanded this group.');
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error refreshing friends:', error);
                }
            };
            refetch();
            return undefined;
        }, [group?.group_id])
    );

    useEffect(() => {
        const mapped = members.map(toFriend).filter(Boolean) as Friend[];
        setFriends(mapped);
    }, [members, currentPosition]);

    const filteredFriends = friends.filter((f) => {
        if (!f.sharingLocation) return false;
        const distance = parseFloat(f.distance.split(' ')[0]);
        return !isNaN(distance) && distance <= selectedRadius;
    });

    // Persist preference changes
    useEffect(() => {
        if (isInitialized.current) AppStorage.setItem('friends_radius', selectedRadius);
    }, [selectedRadius]);
    useEffect(() => {
        if (isInitialized.current) AppStorage.setItem('friends_share_location', shareMyLocation);
    }, [shareMyLocation]);

    const openDirections = (friend: Friend) => {
        const lat = friend.location.lat;
        const lng = friend.location.lng;
        const label = encodeURIComponent(friend.name);
        
        // Open Google Maps with walking directions
        const url = Platform.select({
            ios: `maps://app?daddr=${lat},${lng}&dirflg=w`,
            android: `google.navigation:q=${lat},${lng}&mode=w`,
            default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`
        });
        
        Linking.openURL(url!).catch(() => {
            // Fallback to web URL if native app fails
            const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
            Linking.openURL(webUrl);
        });
    };

    const handleLeaveGroup = () => {
        if (!group) return;
        
        Alert.alert(
            'Leave Group',
            'Are you sure you want to leave this group?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Leave',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await FriendsAPI.leaveGroup(group.group_id);
                            await AppStorage.removeItem('friends_group');
                            setGroup(null);
                            setMembers([]);
                            setFriends([]);
                            Alert.alert('Success', 'You have left the group');
                            router.back();
                        } catch (error: any) {
                            Alert.alert('Error', error?.response?.data?.detail || 'Failed to leave group');
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => router.back()}
                >
                    <IconSymbol name="chevron.left" size={24} color="#11181C" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Friends List</Text>
                {group && !isGroupOwner ? (
                    <TouchableOpacity
                        style={styles.leaveButton}
                        onPress={handleLeaveGroup}
                    >
                        <IconSymbol name="rectangle.portrait.and.arrow.right" size={24} color="#ef4444" />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.placeholder} />
                )}
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#0a7ea4" />
                        <Text style={styles.loadingText}>Loading friends...</Text>
                    </View>
                ) : (
                    <>
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
                            <Text style={styles.shareLocationTitle}>Share My Location</Text>
                            <Text style={styles.shareLocationSubtitle}>
                                {shareMyLocation ? 'Friends can see your location' : 'Location sharing is off'}
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

                {/* Friends List */}
                <Text style={styles.sectionTitle}>
                    Nearby Friends ({filteredFriends.length})
                </Text>

                {filteredFriends.length === 0 && (
                    <View style={styles.emptyState}>
                        <IconSymbol name="person.2" size={64} color="#d1d5db" />
                        <Text style={styles.emptyText}>No friends nearby</Text>
                        <Text style={styles.emptySubtext}>Create or join a group to see your friends</Text>
                    </View>
                )}

                {filteredFriends.map((friend: any) => (
                    <TouchableOpacity
                        key={friend.id}
                        style={styles.friendCard}
                        onPress={() => router.back()}
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
                                    <Text style={styles.locationText}>
                                        {friend.location.placeName || `${friend.location.lat.toFixed(4)}, ${friend.location.lng.toFixed(4)}`}
                                    </Text>
                                </View>
                                <Text style={styles.lastSeen}>{friend.lastSeen}</Text>
                            </View>
                        </View>
                        <View style={styles.friendRight}>
                            <View style={styles.distanceBadge}>
                                <Text style={styles.distanceText}>{friend.distance}</Text>
                            </View>
                            <TouchableOpacity 
                                style={styles.directionsButton}
                                onPress={() => openDirections(friend)}
                            >
                                <IconSymbol name="arrow.triangle.turn.up.right.circle.fill" size={24} color="#0a7ea4" />
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                ))}

                {/* Offline/Not Sharing Friends */}
                {friends.filter((f: any) => !f.sharingLocation).length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
                            Not Sharing Location
                        </Text>
                        {friends.filter((f: any) => !f.sharingLocation).map((friend: any) => (
                            <View key={friend.id} style={styles.friendCard}>
                                <View style={styles.friendLeft}>
                                    <View style={styles.friendAvatarContainer}>
                                        <View style={[styles.friendAvatar, styles.friendAvatarOffline]}>
                                            <Text style={styles.friendAvatarText}>{friend.avatar}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.friendInfo}>
                                        <Text style={styles.friendName}>{friend.name}</Text>
                                        <Text style={styles.offlineText}>Location sharing disabled</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </>
                )}
                    </>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 48,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    closeButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#11181C',
    },
    placeholder: {
        width: 40,
    },
    leaveButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    shareLocationCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
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
        marginBottom: 24,
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
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 2,
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
        fontSize: 15,
        fontWeight: '700',
        color: '#11181C',
        marginBottom: 12,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#687076',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 8,
        textAlign: 'center',
    },
    friendCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    friendCardSelected: {
        backgroundColor: '#e0f2fe',
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
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    distanceText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#687076',
    },
    directionsButton: {
        padding: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        fontSize: 16,
        color: '#687076',
        marginTop: 16,
    },
});
