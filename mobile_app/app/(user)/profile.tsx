import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import MenuSection, { MenuItem } from '@/components/profile/MenuSection';
import { useAuth } from '@/hooks/useAuth';

// Configuration for menu items - easy to add/remove
const ACCOUNT_MENU_ITEMS: MenuItem[] = [
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

const SETTINGS_MENU_ITEMS: MenuItem[] = [
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
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.editAvatarButton}>
                            <IconSymbol name="camera.fill" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>
                        {user?.firstName} {user?.lastName}
                    </Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                    <TouchableOpacity style={styles.editProfileButton}>
                        <Text style={styles.editProfileText}>Edit Profile</Text>
                        <IconSymbol name="pencil" size={14} color="#0a7ea4" />
                    </TouchableOpacity>
                </View>

                {/* Favorites Card Section */}
                <View style={styles.favoritesCard}>
                    <View style={styles.favoritesHeader}>
                        <Text style={styles.favoritesTitle}>Quick Access</Text>
                    </View>
                    <View style={styles.quickAccessGrid}>
                        <TouchableOpacity
                            style={styles.quickAccessItem}
                            onPress={() => router.push('/(user)/(stack)/favorites' as any)}
                        >
                            <View style={[styles.quickAccessIcon, { backgroundColor: '#fee2e2' }]}>
                                <IconSymbol name="heart.fill" size={24} color="#ef4444" />
                            </View>
                            <Text style={styles.quickAccessLabel}>Favorites</Text>
                            <Text style={styles.quickAccessCount}>12</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.quickAccessItem}
                            onPress={() => router.push('/(user)/(stack)/saved-places' as any)}
                        >
                            <View style={[styles.quickAccessIcon, { backgroundColor: '#dbeafe' }]}>
                                <IconSymbol name="mappin.circle.fill" size={24} color="#3b82f6" />
                            </View>
                            <Text style={styles.quickAccessLabel}>Saved</Text>
                            <Text style={styles.quickAccessCount}>8</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.quickAccessItem}
                            onPress={() => router.push('/(user)/(stack)/reviews' as any)}
                        >
                            <View style={[styles.quickAccessIcon, { backgroundColor: '#fef3c7' }]}>
                                <IconSymbol name="star.fill" size={24} color="#f59e0b" />
                            </View>
                            <Text style={styles.quickAccessLabel}>Reviews</Text>
                            <Text style={styles.quickAccessCount}>5</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.quickAccessItem}
                            onPress={() => router.push('/(user)/(stack)/vouchers' as any)}
                        >
                            <View style={[styles.quickAccessIcon, { backgroundColor: '#dcfce7' }]}>
                                <IconSymbol name="ticket.fill" size={24} color="#10b981" />
                            </View>
                            <Text style={styles.quickAccessLabel}>Vouchers</Text>
                            <Text style={styles.quickAccessCount}>3</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.padding}>
                    {/* Account Menu Section */}
                    <MenuSection
                        title="Account"
                        items={ACCOUNT_MENU_ITEMS}
                        onItemPress={handleMenuItemPress}
                    />

                    {/* Support Menu Section */}
                    <MenuSection
                        title="Help & Support"
                        items={SUPPORT_MENU_ITEMS}
                        onItemPress={handleMenuItemPress}
                    />

                    {/* Settings Menu Section */}
                    <MenuSection
                        title="Settings"
                        items={SETTINGS_MENU_ITEMS}
                        onItemPress={handleMenuItemPress}
                    />

                    {/* Logout Button */}
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color="#ef4444" />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
                {/* App Version */}
                <Text style={styles.versionText}>Version 1.0.0</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    profileHeader: {
        backgroundColor: '#fff',
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
        backgroundColor: '#0a7ea4',
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
        backgroundColor: '#0a7ea4',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    padding: {
        paddingHorizontal: 20,
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#11181C',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#687076',
        marginBottom: 16,
    },
    editProfileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#e8f4f8',
    },
    editProfileText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0a7ea4',
    },
    favoritesCard: {
        backgroundColor: '#fff',
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
        color: '#11181C',
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
        color: '#687076',
        marginBottom: 4,
    },
    quickAccessCount: {
        fontSize: 18,
        fontWeight: '700',
        color: '#11181C',
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
        backgroundColor: '#fff',
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
        color: '#9ca3af',
        textAlign: 'center',
        marginTop: 24,
    },
});
