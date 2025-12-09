import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IconSymbol } from '@/components/ui/icon-symbol';
import MenuSection, { MenuItem } from '@/components/profile/MenuSection';
import { useAuth } from '@/hooks/useAuth';
import { useThemeColor } from '@/hooks/use-theme-color';
import ThemeToggle from '@/components/common/ThemeToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageTranslations } from '@/constants/translations';


// Configuration for menu items - easy to add/remove
const ACCOUNT_MENU_ITEMS: MenuItem[] = [
    {
        id: 'edit-profile',
        label: 'Edit Profile',
        icon: 'pencil',
        route: '/(user)/(stack)/edit-profile',
    },
    {
        id: 'favorites',
        label: 'My Favorites',
        icon: 'heart.fill',
        route: '/(user)/(stack)/favorites',
    },
    {
        id: 'bookings-history',
        label: 'Booking History',
        icon: 'clock.fill',
        route: '/(user)/(stack)/booking-history',
    },
    {
        id: 'saved-places',
        label: 'Saved Places',
        icon: 'bookmark.fill',
        route: '/(user)/(stack)/saved-places',
    },
];

const SUPPORT_MENU_ITEMS: MenuItem[] = [
    {
        id: 'help',
        label: 'Help & Support',
        icon: 'questionmark.circle.fill',
        route: '/(user)/(stack)/help-support',
    },
    {
        id: 'safety',
        label: 'Safety Center',
        icon: 'shield.fill',
        route: '/(user)/(stack)/safety',
    },
    {
        id: 'terms',
        label: 'Terms & Conditions',
        icon: 'doc.text.fill',
        route: '/(user)/(stack)/terms',
    },
    {
        id: 'privacy',
        label: 'Privacy Policy',
        icon: 'lock.fill',
        route: '/(user)/(stack)/privacy',
    },
];

const BUSINESS_MENU_ITEMS: MenuItem[] = [
    {
        id: 'my-businesses',
        label: 'My Businesses',
        icon: 'building.2',
        route: '/(user)/(stack)/my-businesses',
    },
    {
        id: 'create-business',
        label: 'Create Business',
        icon: 'building.2.fill',
        route: '/(user)/(stack)/create-business',
    },
];

const SETTINGS_MENU_ITEMS: MenuItem[] = [
    {
        id: 'friends',
        label: 'Friends & Location',
        icon: 'person.2.fill',
        route: '/(user)/(stack)/friends',
    },
    {
        id: 'notifications',
        label: 'Notifications',
        icon: 'bell.fill',
        route: '/(user)/(stack)/notifications',
    },
    {
        id: 'language',
        label: 'Language',
        icon: 'globe',
        route: '/(user)/(stack)/language',
    },
    {
        id: 'about',
        label: 'About',
        icon: 'info.circle.fill',
        route: '/(user)/(stack)/about',
    },
];

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const [favoritesCount, setFavoritesCount] = useState(0);
    const [bookingsCount, setBookingsCount] = useState(0);
    const [reviewsCount, setReviewsCount] = useState(0);
    const [vouchersCount, setVouchersCount] = useState(0);

    useEffect(() => {
        loadCounts();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            loadCounts();
        }, [])
    );

    const loadCounts = async () => {
        try {
            const favoritesData = await AsyncStorage.getItem('favorites');
            const favorites = favoritesData ? JSON.parse(favoritesData) : [];
            setFavoritesCount(favorites.length);
            setBookingsCount(0);
            setReviewsCount(0);
            setVouchersCount(0);
        } catch (error) {
            console.error('Error loading counts:', error);
            setFavoritesCount(0);
            setBookingsCount(0);
            setReviewsCount(0);
            setVouchersCount(0);
        }
    };

    // Create translated menu items
    const ACCOUNT_MENU_ITEMS_TRANSLATED: MenuItem[] = [
        { id: 'edit-profile', label: t.editProfile || 'Edit Profile', icon: 'pencil', route: '/(user)/(stack)/edit-profile' },
        { id: 'favorites', label: t.myFavorites || 'My Favorites', icon: 'heart.fill', route: '/(user)/(stack)/favorites' },
        { id: 'bookings-history', label: t.bookingHistory || 'Booking History', icon: 'clock.fill', route: '/(user)/(stack)/booking-history' },
        { id: 'saved-places', label: t.savedPlaces || 'Saved Places', icon: 'bookmark.fill', route: '/(user)/(stack)/saved-places' },
    ];

    const SUPPORT_MENU_ITEMS_TRANSLATED: MenuItem[] = [
        { id: 'help', label: t.helpSupport || 'Help & Support', icon: 'questionmark.circle.fill', route: '/(user)/(stack)/help-support' },
        { id: 'safety', label: t.safetyCenter || 'Safety Center', icon: 'shield.fill', route: '/(user)/(stack)/safety' },
        { id: 'terms', label: t.termsConditions || 'Terms & Conditions', icon: 'doc.text.fill', route: '/(user)/(stack)/terms' },
        { id: 'privacy', label: t.privacyPolicy || 'Privacy Policy', icon: 'lock.fill', route: '/(user)/(stack)/privacy' },
    ];

    const BUSINESS_MENU_ITEMS_TRANSLATED: MenuItem[] = [
        { id: 'my-businesses', label: t.myBusinesses || 'My Businesses', icon: 'building.2', route: '/(user)/(stack)/my-businesses' },
        { id: 'create-business', label: t.createBusiness || 'Create Business', icon: 'building.2.fill', route: '/(user)/(stack)/create-business' },
    ];

    const SETTINGS_MENU_ITEMS_TRANSLATED: MenuItem[] = [
        { id: 'friends', label: t.friendsLocation || 'Friends & Location', icon: 'person.2.fill', route: '/(user)/(stack)/friends' },
        { id: 'notifications', label: t.notifications || 'Notifications', icon: 'bell.fill', route: '/(user)/(stack)/notifications' },
        { id: 'language', label: t.language || 'Language', icon: 'globe', route: '/(user)/(stack)/language' },
        { id: 'about', label: t.about || 'About', icon: 'info.circle.fill', route: '/(user)/(stack)/about' },
    ];

    // Theme colors
    const screenBg = useThemeColor('background');
    const cardBg = useThemeColor('card');
    const text = useThemeColor('text');
    const mutedText = useThemeColor('mutedText');
    const tint = useThemeColor('tint');
    const soft = useThemeColor('tintSoftBg');

    const handleMenuItemPress = (item: MenuItem) => {
        if (item.route) {
            router.push(item.route as any);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login' as any);
    };

    return (
        <View style={[styles.container, { backgroundColor: screenBg }]}>
            {/* Back Button Header */}
            <View style={styles.headerTop}>
                <TouchableOpacity onPress={() => router.back()}>
                    <IconSymbol name="chevron.left" size={24} color={text} />
                </TouchableOpacity>
            </View>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Header */}
                <View style={[styles.profileHeader, { backgroundColor: cardBg }]}>
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatar, { backgroundColor: tint }]}>
                            <Text style={styles.avatarText}>
                                {user?.name ? user.name.split(' ').map(p => p.charAt(0)).slice(0, 2).join('') : 'U'}
                            </Text>
                        </View>
                    </View>
                    <Text style={[styles.userName, { color: text }]}>{user?.name}</Text>
                    <Text style={[styles.userEmail, { color: mutedText }]}>{user?.email}</Text>
                    <TouchableOpacity
                        style={[styles.editProfileButton, { backgroundColor: soft }]}
                        onPress={() => router.push('/(user)/(stack)/edit-profile' as any)}
                    >
                        <Text style={[styles.editProfileText, { color: tint }]}>{t.editProfile || 'Edit Profile'}</Text>
                        <IconSymbol name="pencil" size={14} color={tint as string} />
                    </TouchableOpacity>
                </View>

                {/* Favorites Card Section */}
                <View style={[styles.favoritesCard, { backgroundColor: cardBg }]}>
                    <View style={styles.favoritesHeader}>
                        <Text style={[styles.favoritesTitle, { color: text }]}>{t.quickAccess || 'Quick Access'}</Text>
                    </View>
                    <View style={styles.quickAccessGrid}>
                        <TouchableOpacity
                            style={styles.quickAccessItem}
                            onPress={() => router.push('/(user)/(stack)/favorites' as any)}
                        >
                            <View style={[styles.quickAccessIcon, { backgroundColor: '#fee2e2' }]}>
                                <IconSymbol name="heart.fill" size={24} color="#ef4444" />
                            </View>
                            <Text style={[styles.quickAccessLabel, { color: mutedText }]}>{t.myFavorites || 'Favorites'}</Text>
                            <Text style={[styles.quickAccessCount, { color: text }]}>{favoritesCount}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.quickAccessItem}
                            onPress={() => router.push('/(user)/(stack)/schedule' as any)}
                        >
                            <View style={[styles.quickAccessIcon, { backgroundColor: '#8baedcff' }]}>
                                <IconSymbol name="ticket.fill" size={24} color="#114b72ff" />
                            </View>
                            <Text style={[styles.quickAccessLabel, { color: mutedText }]}>{t.bookings || 'Bookings'}</Text>
                            <Text style={[styles.quickAccessCount, { color: text }]}>{bookingsCount}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.quickAccessItem}
                            onPress={() => router.push('/(user)/(stack)/reviews' as any)}
                        >
                            <View style={[styles.quickAccessIcon, { backgroundColor: '#fef3c7' }]}>
                                <IconSymbol name="star.fill" size={24} color="#f59e0b" />
                            </View>
                            <Text style={[styles.quickAccessLabel, { color: mutedText }]}>{t.reviews || 'Reviews'}</Text>
                            <Text style={[styles.quickAccessCount, { color: text }]}>{reviewsCount}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.quickAccessItem}
                            onPress={() => router.push('/(user)/(stack)/vouchers' as any)}
                        >
                            <View style={[styles.quickAccessIcon, { backgroundColor: '#dcfce7' }]}>
                                <IconSymbol name="ticket.fill" size={24} color="#10b981" />
                            </View>
                            <Text style={[styles.quickAccessLabel, { color: mutedText }]}>{t.vouchers || 'Vouchers'}</Text>
                            <Text style={[styles.quickAccessCount, { color: text }]}>{vouchersCount}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.padding}>
                    {/* Account Menu Section */}
                    <MenuSection
                        title={t.account || 'Account'}
                        items={ACCOUNT_MENU_ITEMS_TRANSLATED}
                        onItemPress={handleMenuItemPress}
                    />

                    {/* Business Menu Section */}
                    <MenuSection
                        title={t.business || 'Business'}
                        items={BUSINESS_MENU_ITEMS_TRANSLATED}
                        onItemPress={handleMenuItemPress}
                    />

                    {/* Support Menu Section */}
                    <MenuSection
                        title={t.helpSupport || 'Help & Support'}
                        items={SUPPORT_MENU_ITEMS_TRANSLATED}
                        onItemPress={handleMenuItemPress}
                    />

                    {/* Settings Menu Section */}
                    <MenuSection
                        title={t.settings || 'Settings'}
                        items={SETTINGS_MENU_ITEMS_TRANSLATED}
                        onItemPress={handleMenuItemPress}
                    />
                </View>

                {/* Theme Toggle */}
                <ThemeToggle />

                <View style={styles.padding}>
                    {/* Logout Button */}
                    <TouchableOpacity style={[styles.logoutButton, { backgroundColor: cardBg }]} onPress={handleLogout}>
                        <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color="#ef4444" />
                        <Text style={styles.logoutText}>{t.logout || 'Logout'}</Text>
                    </TouchableOpacity>
                </View>
                {/* App Version */}
                <Text style={[styles.versionText, { color: mutedText }]}>Version 1.0.0</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerTop: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 8,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    profileHeader: {
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 36,
        fontWeight: '700',
        color: '#fff',
    },
    editAvatarButton: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
    },
    padding: {
        paddingHorizontal: 20,
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        marginBottom: 16,
    },
    editProfileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    editProfileText: {
        fontSize: 14,
        fontWeight: '600',
    },
    favoritesCard: {
        marginHorizontal: 20,
        marginTop: 16,
        marginBottom: 24,
        borderRadius: 16,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    favoritesHeader: {
        marginBottom: 16,
    },
    favoritesTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    quickAccessGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    quickAccessItem: {
        flex: 1,
        minWidth: '45%',
        alignItems: 'center',
        paddingVertical: 16,
    },
    quickAccessIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    quickAccessLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 4,
    },
    quickAccessCount: {
        fontSize: 18,
        fontWeight: '700',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: 20,
        marginTop: 16,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fee2e2',
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ef4444',
    },
    versionText: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 5,
    },
});
