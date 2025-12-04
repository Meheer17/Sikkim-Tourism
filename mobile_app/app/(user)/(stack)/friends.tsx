import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Dimensions, Animated, PanResponder, Modal, TextInput, ActivityIndicator, Platform, Keyboard, Alert, KeyboardAvoidingView, StatusBar } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as Location from 'expo-location';
import { FriendsAPI, MemberLocation } from '@/services/friends.service';
import { AppStorage } from '@/utils/storage';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageTranslations } from '@/constants/translations';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = SCREEN_HEIGHT;
const MODAL_MIN_HEIGHT = SCREEN_HEIGHT * 0.35;
const MODAL_MAX_HEIGHT = SCREEN_HEIGHT * 0.75;

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

const RADIUS_OPTIONS = [1, 5, 10, 25, 50];

export default function FriendsScreen() {
    const router = useRouter();
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const [group, setGroup] = useState<GroupInfo | null>(null);
    const [isGroupOwner, setIsGroupOwner] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [members, setMembers] = useState<MemberLocation[]>([]);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedRadius, setSelectedRadius] = useState(10); // in km
    const [shareMyLocation, setShareMyLocation] = useState(true);
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
    const modalHeight = useRef(new Animated.Value(MODAL_MIN_HEIGHT)).current;
    const [isExpanded, setIsExpanded] = useState(false);
    const [loadingGroupAction, setLoadingGroupAction] = useState(false);
    const [showGroupPrompt, setShowGroupPrompt] = useState(false);
    const [promptMode, setPromptMode] = useState<'choose' | 'create' | 'join' | 'created'>('choose');
    const [joinCode, setJoinCode] = useState('');
    const [createdGroupCode, setCreatedGroupCode] = useState('');
    const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const fetchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const disbandAlertShown = useRef(false);

    const filteredFriends = friends.filter((friend) => {
        if (!friend.sharingLocation) return false;
        const distance = parseFloat(friend.distance.split(' ')[0]);
        return distance <= selectedRadius;
    });

    const handleFriendPress = (friend: Friend) => {
        setSelectedFriend(friend);
    };

    // Helpers
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

    const refreshFriendsFromMembers = () => {
        const mapped = members.map(toFriend).filter(Boolean) as Friend[];
        setFriends(mapped);
    };

    useEffect(() => { refreshFriendsFromMembers(); }, [members, currentPosition]);

    // Load group from storage on mount and when screen gains focus
    useFocusEffect(
        React.useCallback(() => {
            let isMounted = true;
            
            const loadGroupData = async () => {
                try {
                    console.log('[Friends] Loading group from storage...');
                    
                    // Get current user ID from token
                    const { TokenManager } = await import('@/utils/storage');
                    const token = await TokenManager.getAccessToken();
                    let userId: string | null = null;
                    if (token) {
                        // Decode JWT to get user ID
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        userId = payload.sub;
                        setCurrentUserId(userId);
                    }

                    const saved = await AppStorage.getItem<GroupInfo>('friends_group');
                    console.log('[Friends] Loaded from storage:', saved);
                    
                    if (!isMounted) return;
                    
                    if (saved?.group_id && saved?.code) {
                        // Load group immediately without waiting for validation
                        console.log('[Friends] Loading saved group:', saved.group_id);
                        setGroup(saved);
                        setShowGroupPrompt(false);
                        setIsInitialized(true);
                        
                        // Validate and get owner info in background (non-blocking)
                        (async () => {
                            try {
                                const [validation, info] = await Promise.all([
                                    FriendsAPI.validateGroup(saved.group_id),
                                    FriendsAPI.getGroupInfo(saved.group_id)
                                ]);
                                
                                if (!isMounted) return;
                                
                                // Check if group still exists
                                if (!validation.data?.exists) {
                                    console.log('[Friends] Group no longer exists, clearing storage');
                                    await AppStorage.removeItem('friends_group');
                                    if (!isMounted) return;
                                    setGroup(null);
                                    setShowGroupPrompt(true);
                                    setPromptMode('choose');
                                    if (!disbandAlertShown.current) {
                                        disbandAlertShown.current = true;
                                        Alert.alert('Group Disbanded', 'The group owner has disbanded this group.');
                                    }
                                    return;
                                }
                                
                                // Update owner info
                                if (info.data && userId) {
                                    setIsGroupOwner(info.data.owner_id === userId);
                                }
                            } catch (e: any) {
                                console.error('[Friends] Background validation error:', e);
                                // Only clear on 404, keep group for other errors
                                if (e?.response?.status === 404) {
                                    console.log('[Friends] Group not found (404), clearing storage');
                                    await AppStorage.removeItem('friends_group');
                                    if (!isMounted) return;
                                    setGroup(null);
                                    setShowGroupPrompt(true);
                                    setPromptMode('choose');
                                    if (!disbandAlertShown.current) {
                                        disbandAlertShown.current = true;
                                        Alert.alert('Group Disbanded', 'The group owner has disbanded this group.');
                                    }
                                }
                            }
                        })();
                    } else {
                        console.log('[Friends] No saved group found, showing prompt');
                        if (!isMounted) return;
                        setShowGroupPrompt(true);
                        setPromptMode('choose');
                        setIsInitialized(true);
                    }
                } catch (error) {
                    console.error('[Friends] Error loading group data:', error);
                    if (isMounted) {
                        setShowGroupPrompt(true);
                        setPromptMode('choose');
                        setIsInitialized(true);
                    }
                }
            };
            
            loadGroupData();
            
            // Hide navigation bar on Android when screen is focused
            if (Platform.OS === 'android') {
                StatusBar.setHidden(true);
            }
            
            return () => {
                isMounted = false;
                // Restore navigation bar on Android when leaving screen
                if (Platform.OS === 'android') {
                    StatusBar.setHidden(false);
                }
            };
        }, [])
    );

    // Cleanup intervals on unmount
    useEffect(() => {
        return () => {
            if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
            if (fetchIntervalRef.current) clearInterval(fetchIntervalRef.current);
        };
    }, []);

    // Start polling when group and sharing are active
    useEffect(() => {
        const start = async () => {
            if (!group) return;

            // Ensure permission
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status !== 'granted') {
                const req = await Location.requestForegroundPermissionsAsync();
                if (req.status !== 'granted') return;
            }

            // Clear any existing intervals
            if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
            if (fetchIntervalRef.current) clearInterval(fetchIntervalRef.current);

            // Try to get cached location first (instant)
            try {
                const lastKnown = await Location.getLastKnownPositionAsync();
                if (lastKnown) {
                    setCurrentPosition({ 
                        lat: lastKnown.coords.latitude, 
                        lng: lastKnown.coords.longitude 
                    });
                }
            } catch (e) {
                console.log('[Friends] No cached location available');
            }

            // Fetch members immediately (don't wait for location)
            fetchMembersOnce();

            // Get accurate location in background (don't await)
            updateMyLocationOnce();

            // Then schedule intervals
            locationIntervalRef.current = setInterval(() => {
                updateMyLocationOnce();
            }, 15000);

            fetchIntervalRef.current = setInterval(() => {
                fetchMembersOnce();
            }, 15000);
        };

        if (group && shareMyLocation) {
            start();
        } else {
            if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
            if (fetchIntervalRef.current) clearInterval(fetchIntervalRef.current);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [group, shareMyLocation]);

    const updateMyLocationOnce = async () => {
        try {
            const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setCurrentPosition({ lat, lng });
            if (group && shareMyLocation) {
                await FriendsAPI.updateLocation(group.group_id, lat, lng);
            }
        } catch (e) {
            // ignore
        }
    };

    const fetchMembersOnce = async () => {
        try {
            if (!group) return;
            const resp = await FriendsAPI.listMembers(group.group_id);
            if (resp.data) {
                setMembers(resp.data.members);
                // If members list is empty, validate that the group still exists
                if (resp.data.members.length === 0) {
                    const validation = await FriendsAPI.validateGroup(group.group_id);
                    if (validation.data && !validation.data.exists) {
                        // Group was disbanded, clear storage and show prompt
                        await AppStorage.removeItem('friends_group');
                        setGroup(null);
                        setIsGroupOwner(false);
                        setMembers([]);
                        setFriends([]);
                        setShowGroupPrompt(true);
                        setPromptMode('choose');
                        if (!disbandAlertShown.current) {
                            disbandAlertShown.current = true;
                            Alert.alert('Group Disbanded', 'The group owner has disbanded this group.');
                        }
                    }
                }
            }
        } catch (error) {
            console.error('[Friends] Error fetching members:', error);
            // If we get an error fetching members, the group might not exist
            if (group) {
                try {
                    const validation = await FriendsAPI.validateGroup(group.group_id);
                    if (validation.data && !validation.data.exists) {
                        await AppStorage.removeItem('friends_group');
                        setGroup(null);
                        setIsGroupOwner(false);
                        setMembers([]);
                        setFriends([]);
                        setShowGroupPrompt(true);
                        setPromptMode('choose');
                        if (!disbandAlertShown.current) {
                            disbandAlertShown.current = true;
                            Alert.alert('Group Disbanded', 'The group owner has disbanded this group.');
                        }
                    }
                } catch (validationError) {
                    console.error('[Friends] Error validating group:', validationError);
                }
            }
        }
    };

    const handleCreateGroup = async () => {
        setLoadingGroupAction(true);
        try {
            console.log('[Friends] Creating new group...');
            const resp = await FriendsAPI.createGroup();
            if (resp.data) {
                const g = { group_id: resp.data.group_id, code: resp.data.code };
                console.log('[Friends] Group created:', g);
                await AppStorage.setItem('friends_group', g);
                
                // Verify the save
                const verified = await AppStorage.getItem<GroupInfo>('friends_group');
                console.log('[Friends] Verified saved group:', verified);
                
                setGroup(g);
                setIsGroupOwner(true);
                setCreatedGroupCode(resp.data.code);
                setPromptMode('created');
            }
        } catch (error: any) {
            console.error('[Friends] Error creating group:', error);
            Alert.alert('Error', error?.response?.data?.detail || 'Failed to create group');
        } finally {
            setLoadingGroupAction(false);
        }
    };

    const handleJoinGroup = async () => {
        if (joinCode.length !== 4) return;
        Keyboard.dismiss(); // Dismiss keyboard before processing
        setLoadingGroupAction(true);
        try {
            console.log('[Friends] Joining group with code:', joinCode);
            const resp = await FriendsAPI.joinGroup(joinCode);
            if (resp.data) {
                const g = { group_id: resp.data.group_id, code: resp.data.code };
                console.log('[Friends] Joined group:', g);
                await AppStorage.setItem('friends_group', g);
                
                // Verify the save
                const verified = await AppStorage.getItem<GroupInfo>('friends_group');
                console.log('[Friends] Verified saved group:', verified);
                
                setGroup(g);
                setIsGroupOwner(false);
                setShowGroupPrompt(false);
            }
        } catch (error: any) {
            console.error('[Friends] Error joining group:', error);
            Alert.alert('Error', error?.response?.data?.detail || 'Failed to join group');
        } finally {
            setLoadingGroupAction(false);
        }
    };

    const handleDisbandGroup = () => {
        Alert.alert(
            'Disband Group',
            'Are you sure? This will remove all members and delete the group permanently.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Disband',
                    style: 'destructive',
                    onPress: async () => {
                        if (!group) return;
                        try {
                            await FriendsAPI.disbandGroup(group.group_id);
                            await AppStorage.removeItem('friends_group');
                            setGroup(null);
                            setIsGroupOwner(false);
                            setMembers([]);
                            setFriends([]);
                            setShowGroupPrompt(true);
                            setPromptMode('choose');
                            Alert.alert('Success', 'Group disbanded successfully');
                        } catch (error: any) {
                            Alert.alert('Error', error?.response?.data?.detail || 'Failed to disband group');
                        }
                    },
                },
            ]
        );
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: (evt, gestureState) => true,
            onStartShouldSetPanResponderCapture: (evt, gestureState) => false,
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                // Only respond to vertical drags
                return Math.abs(gestureState.dy) > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
            },
            onMoveShouldSetPanResponderCapture: (evt, gestureState) => false,
            onPanResponderTerminationRequest: () => true,
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
                    <Text style={styles.headerTitle}>{t.friendsLocation || 'Friends & Location'}</Text>
                    <Text style={styles.headerSubtitle}>
                        {filteredFriends.length} {t.nearbyFriends || 'nearby friends'} {group ? `(${t.code || 'code'} ${group.code})` : ''}
                    </Text>
                </View>
                {isGroupOwner ? (
                    <TouchableOpacity style={styles.disbandButton} onPress={handleDisbandGroup}>
                        <IconSymbol name="xmark.circle.fill" size={24} color="#ef4444" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.addButton} onPress={() => router.push('/(user)/(stack)/friends-list' as any)}>
                        <IconSymbol name="person.2.fill" size={24} color="#0a7ea4" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Map Container */}
            <View style={styles.mapContainer}>
                {currentPosition ? (
                    <MapView
                        style={styles.map}
                        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                        initialRegion={{
                            latitude: currentPosition.lat,
                            longitude: currentPosition.lng,
                            latitudeDelta: 0.0922,
                            longitudeDelta: 0.0421,
                        }}
                        showsUserLocation
                        showsMyLocationButton
                    >
                        {/* Radius circle around current user */}
                        {currentPosition && (
                            <Circle
                                center={{
                                    latitude: currentPosition.lat,
                                    longitude: currentPosition.lng,
                                }}
                                radius={selectedRadius * 1000} // convert km to meters
                                strokeColor="rgba(10, 126, 164, 0.3)"
                                fillColor="rgba(10, 126, 164, 0.1)"
                                strokeWidth={2}
                            />
                        )}

                        {/* Friend markers */}
                        {filteredFriends.map((friend) => (
                            <Marker
                                key={friend.id}
                                coordinate={{
                                    latitude: friend.location.lat,
                                    longitude: friend.location.lng,
                                }}
                                title={friend.name}
                                description={`${friend.distance} away · ${friend.lastSeen}`}
                                onPress={() => handleFriendPress(friend)}
                            >
                                <View style={[
                                    styles.customMarker,
                                    friend.isOnline && styles.customMarkerOnline,
                                    selectedFriend?.id === friend.id && styles.customMarkerSelected,
                                ]}>
                                    <Text style={styles.customMarkerText}>{friend.avatar}</Text>
                                </View>
                            </Marker>
                        ))}
                    </MapView>
                ) : (
                    <View style={styles.mapPlaceholder}>
                        <IconSymbol name="map.fill" size={64} color="#0a7ea4" />
                        <Text style={styles.mapPlaceholderText}>{t.locating || 'Locating...'}</Text>
                        <Text style={styles.mapSubtext}>
                            {group ? `${t.group || 'Group'} ${group.code}` : (t.createJoinGroup || 'Create or join a group')}
                        </Text>
                    </View>
                )}
            </View>

            {/* Floating Action Buttons */}
            <View style={styles.floatingButtons}>
                {!group && (
                    <TouchableOpacity
                        style={[styles.floatingButton, styles.primaryFloatingButton]}
                        onPress={() => { setShowGroupPrompt(true); setPromptMode('choose'); }}
                        activeOpacity={0.8}
                    >
                        <IconSymbol name="person.badge.plus" size={24} color="#fff" />
                        <Text style={styles.floatingButtonText}>Create/Join Group</Text>
                    </TouchableOpacity>
                )}
                {group && (
                    <TouchableOpacity
                        style={[styles.floatingButton, styles.secondaryFloatingButton]}
                        onPress={() => router.push('/(user)/(stack)/friends-list' as any)}
                        activeOpacity={0.8}
                    >
                        <IconSymbol name="list.bullet" size={24} color="#0a7ea4" />
                        <Text style={[styles.floatingButtonText, { color: '#0a7ea4' }]}>View Friends List</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Group Prompt Modal */}
            <Modal visible={showGroupPrompt} transparent animationType="fade" onRequestClose={() => setShowGroupPrompt(false)}>
                <TouchableOpacity 
                    style={styles.modalBackdrop} 
                    activeOpacity={1} 
                    onPress={() => setShowGroupPrompt(false)}
                >
                    <KeyboardAvoidingView 
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ width: '90%', maxWidth: 400 }}
                    >
                        <TouchableOpacity style={styles.groupModal} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                            {promptMode === 'choose' && (
                            <>
                                <Text style={styles.groupTitle}>Find My Friends</Text>
                                <Text style={styles.groupSubtitle}>Create a group or join with a 4-digit code.</Text>
                                <View style={{ height: 12 }} />
                                <TouchableOpacity style={styles.primaryBtn} onPress={() => setPromptMode('create')}>
                                    <Text style={styles.primaryBtnText}>Create Group</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setPromptMode('join')}>
                                    <Text style={styles.secondaryBtnText}>Join Group</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {promptMode === 'create' && (
                            <>
                                <Text style={styles.groupTitle}>Create Group</Text>
                                <Text style={styles.groupSubtitle}>We'll generate a 4-digit code to share.</Text>
                                <View style={{ height: 16 }} />
                                <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateGroup} disabled={loadingGroupAction}>
                                    {loadingGroupAction ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Create</Text>}
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.ghostBtn} onPress={() => setPromptMode('choose')}>
                                    <Text style={styles.secondaryBtnText}>Back</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {promptMode === 'join' && (
                            <>
                                <Text style={styles.groupTitle}>Join Group</Text>
                                <Text style={styles.groupSubtitle}>Enter the 4-digit code shared with you.</Text>
                                <View style={{ height: 12 }} />
                                <TextInput
                                    style={styles.codeInput}
                                    placeholder="1234"
                                    keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                                    maxLength={4}
                                    value={joinCode}
                                    onChangeText={(t) => setJoinCode(t.replace(/[^0-9]/g, ''))}
                                    returnKeyType="done"
                                    onSubmitEditing={handleJoinGroup}
                                    blurOnSubmit={true}
                                />
                                <TouchableOpacity style={[styles.primaryBtn, joinCode.length !== 4 && { opacity: 0.6 }]} onPress={handleJoinGroup} disabled={loadingGroupAction || joinCode.length !== 4}>
                                    {loadingGroupAction ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Join</Text>}
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.ghostBtn} onPress={() => setPromptMode('choose')}>
                                    <Text style={styles.secondaryBtnText}>Back</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {promptMode === 'created' && (
                            <>
                                <View style={styles.successContainer}>
                                    <View style={styles.successIconContainer}>
                                        <IconSymbol name="checkmark.circle.fill" size={64} color="#10b981" />
                                    </View>
                                    <Text style={styles.groupTitle}>Group Created!</Text>
                                    <Text style={styles.groupSubtitle}>Share this code with your friends:</Text>
                                    <View style={styles.codeDisplayContainer}>
                                        <Text style={styles.codeDisplayText}>{createdGroupCode}</Text>
                                    </View>
                                    <Text style={styles.codeHintText}>Tap the code to copy</Text>
                                </View>
                                <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowGroupPrompt(false)}>
                                    <Text style={styles.primaryBtnText}>Start Sharing Location</Text>
                                </TouchableOpacity>
                            </>
                        )}
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </TouchableOpacity>
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
    disbandButton: {
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
    map: {
        flex: 1,
        width: '100%',
        height: '120%',
    },
    mapPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        backgroundColor: '#e8f4f8',
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
    customMarker: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#687076',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    customMarkerOnline: {
        backgroundColor: '#10b981',
    },
    customMarkerSelected: {
        borderColor: '#0a7ea4',
        borderWidth: 4,
        transform: [{ scale: 1.2 }],
    },
    customMarkerText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
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
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    groupModal: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        maxHeight: '100%',
        width: '100%',
    },
    groupTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#11181C',
    },
    groupSubtitle: {
        fontSize: 14,
        color: '#687076',
        marginTop: 6,
    },
    primaryBtn: {
        backgroundColor: '#0a7ea4',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    primaryBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    secondaryBtn: {
        backgroundColor: '#e8f4f8',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    secondaryBtnText: {
        color: '#0a7ea4',
        fontWeight: '700',
        fontSize: 16,
    },
    ghostBtn: {
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    codeInput: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 18,
        letterSpacing: 8,
        textAlign: 'center',
    },
    successContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    successIconContainer: {
        marginBottom: 16,
    },
    codeDisplayContainer: {
        backgroundColor: '#0a7ea4',
        paddingHorizontal: 40,
        paddingVertical: 20,
        borderRadius: 16,
        marginVertical: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    codeDisplayText: {
        fontSize: 48,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 12,
    },
    codeHintText: {
        fontSize: 12,
        color: '#687076',
        fontStyle: 'italic',
    },
    floatingButtons: {
        position: 'absolute',
        bottom: 120,
        left: 20,
        right: 20,
        gap: 12,
    },
    floatingButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    primaryFloatingButton: {
        backgroundColor: '#0a7ea4',
    },
    secondaryFloatingButton: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#0a7ea4',
    },
    floatingButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});
