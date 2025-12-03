import ThemeToggle from '@/components/common/ThemeToggle';
import MenuSection, { MenuItem } from '@/components/profile/MenuSection';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getLanguageTranslations } from '@/constants/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


// Configuration for menu items - easy to add/remove
const getAccountMenuItems = (t: any): MenuItem[] => [
    {
        id: 'favorites',
        label: t.myFavorites,
        icon: 'heart.fill',
        route: '/(user)/(stack)/favorites',
    },
    {
        id: 'bookings-history',
        label: t.bookingHistoryMenu,
        icon: 'clock.fill',
        route: '/(user)/(stack)/booking-history',
    },
    {
        id: 'saved-places',
        label: t.savedPlaces,
        icon: 'bookmark.fill',
        route: '/(user)/(stack)/saved-places',
    },
];

const getSupportMenuItems = (t: any): MenuItem[] => [
    {
        id: 'help',
        label: t.helpSupport,
        icon: 'questionmark.circle.fill',
        route: '/(user)/(stack)/help-support',
    },
    {
        id: 'safety',
        label: t.safetyCenter,
        icon: 'shield.fill',
        route: '/(user)/(stack)/safety',
    },
    {
        id: 'terms',
        label: t.terms,
        icon: 'doc.text.fill',
        route: '/(user)/(stack)/terms',
    },
    {
        id: 'privacy',
        label: t.privacy,
        icon: 'lock.fill',
        route: '/(user)/(stack)/privacy',
    },
];

const getSettingsMenuItems = (t: any): MenuItem[] => [
    {
        id: 'friends',
        label: t.friendsLocation,
        icon: 'person.2.fill',
        route: '/(user)/(stack)/friends',
    },
    {
        id: 'notifications',
        label: t.notifications,
        icon: 'bell.fill',
        route: '/(user)/(stack)/notifications',
    },
    {
        id: 'language',
        label: t.language,
        icon: 'globe',
        route: '/(user)/(stack)/language',
    },
    {
        id: 'about',
        label: t.about,
        icon: 'info.circle.fill',
        route: '/(user)/(stack)/about',
    },
];

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);

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
                                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                            </Text>
                        </View>
                        <TouchableOpacity style={[styles.editAvatarButton, { backgroundColor: tint, borderColor: cardBg }]}>
                            <IconSymbol name="camera.fill" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.userName, { color: text }]}>
                        {user?.firstName} {user?.lastName}
                    </Text>
                    <Text style={[styles.userEmail, { color: mutedText }]}>{user?.email}</Text>
                    <TouchableOpacity style={[styles.editProfileButton, { backgroundColor: soft }]}>
                        <Text style={[styles.editProfileText, { color: tint }]}>{t.editProfile}</Text>
                        <IconSymbol name="pencil" size={14} color={tint as string} />
                    </TouchableOpacity>
                </View>

                {/* Favorites Card Section */}
                <View style={[styles.favoritesCard, { backgroundColor: cardBg }]}>
                    <View style={styles.favoritesHeader}>
                        <Text style={[styles.favoritesTitle, { color: text }]}>Quick Access</Text>
                    </View>
                    <View style={styles.quickAccessGrid}>
                        <TouchableOpacity
                            style={styles.quickAccessItem}
                            onPress={() => router.push('/(user)/(stack)/favorites' as any)}
                        >
                            <View style={[styles.quickAccessIcon, { backgroundColor: '#fee2e2' }]}>
                                <IconSymbol name="heart.fill" size={24} color="#ef4444" />
                            </View>
                            <Text style={[styles.quickAccessLabel, { color: mutedText }]}>Favorites</Text>
                            <Text style={[styles.quickAccessCount, { color: text }]}>12</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.quickAccessItem}
                            onPress={() => router.push('/(user)/(stack)/saved-places' as any)}
                        >
                            <View style={[styles.quickAccessIcon, { backgroundColor: '#dbeafe' }]}>
                                <IconSymbol name="mappin.circle.fill" size={24} color="#3b82f6" />
                            </View>
                            <Text style={[styles.quickAccessLabel, { color: mutedText }]}>Saved</Text>
                            <Text style={[styles.quickAccessCount, { color: text }]}>8</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.quickAccessItem}
                            onPress={() => router.push('/(user)/(stack)/reviews' as any)}
                        >
                            <View style={[styles.quickAccessIcon, { backgroundColor: '#fef3c7' }]}>
                                <IconSymbol name="star.fill" size={24} color="#f59e0b" />
                            </View>
                            <Text style={[styles.quickAccessLabel, { color: mutedText }]}>Reviews</Text>
                            <Text style={[styles.quickAccessCount, { color: text }]}>5</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.quickAccessItem}
                            onPress={() => router.push('/(user)/(stack)/vouchers' as any)}
                        >
                            <View style={[styles.quickAccessIcon, { backgroundColor: '#dcfce7' }]}>
                                <IconSymbol name="ticket.fill" size={24} color="#10b981" />
                            </View>
                            <Text style={[styles.quickAccessLabel, { color: mutedText }]}>Vouchers</Text>
                            <Text style={[styles.quickAccessCount, { color: text }]}>3</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.padding}>
                    {/* Account Menu Section */}
                    <MenuSection
                        title={t.myProfile}
                        items={getAccountMenuItems(t)}
                        onItemPress={handleMenuItemPress}
                    />

                    {/* Support Menu Section */}
                    <MenuSection
                        title={t.helpSupport}
                        items={getSupportMenuItems(t)}
                        onItemPress={handleMenuItemPress}
                    />

                    {/* Settings Menu Section */}
                    <MenuSection
                        title={t.settings}
                        items={getSettingsMenuItems(t)}
                        onItemPress={handleMenuItemPress}
                    />
                </View>

                {/* Theme Toggle */}
                <ThemeToggle />

                <View style={styles.padding}>
                    {/* Logout Button */}
                    <TouchableOpacity style={[styles.logoutButton, { backgroundColor: cardBg }]} onPress={handleLogout}>
                        <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color="#ef4444" />
                        <Text style={styles.logoutText}>{t.logout}</Text>
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
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
        marginTop: 24,
    },
});
