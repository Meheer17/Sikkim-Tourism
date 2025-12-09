import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/hooks/useAuth';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageTranslations } from '@/constants/translations';

export default function AdminProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login' as any);
    };

    const menuSections = [
        {
            title: t.adminTools || 'Admin Tools',
            items: [
                {
                    label: t.systemSettings || 'System Settings',
                    icon: 'gearshape.fill',
                    route: '/(government)/(stack)/settings',
                },
                {
                    label: t.analytics || 'Analytics',
                    icon: 'chart.bar.fill',
                    route: '/(government)/(stack)/analytics',
                },
                {
                    label: t.reports || 'Reports',
                    icon: 'doc.text.fill',
                    route: '/(government)/(stack)/reports',
                },
            ],
        },
        {
            title: t.account || 'Account',
            items: [
                {
                    label: t.editProfile || 'Edit Profile',
                    icon: 'person.crop.circle.fill',
                    route: '/(government)/(stack)/edit-profile',
                },
                {
                    label: t.security || 'Security',
                    icon: 'lock.shield.fill',
                    route: '/(government)/(stack)/security',
                },
            ],
        },
    ];

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Header */}
                <View style={[styles.profileHeader, { backgroundColor: card }]}>
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatar, { backgroundColor: tint }]}>
                            <Text style={styles.avatarText}>
                                {user?.name ? user.name.split(' ').map(p => p.charAt(0)).slice(0, 2).join('') : 'A'}
                            </Text>
                        </View>
                        <View style={styles.adminBadge}>
                            <IconSymbol name="shield.fill" size={16} color="#fff" />
                        </View>
                    </View>
                    <Text style={[styles.userName, { color: text }]}>{user?.name}</Text>
                    <Text style={styles.userRole}>{t.governmentOfficial || 'Government Official'}</Text>
                    <Text style={[styles.userEmail, { color: muted }]}>{user?.email}</Text>
                </View>

                {/* Menu Sections */}
                <View style={styles.padding}>
                    {menuSections.map((section, index) => (
                        <View key={index} style={styles.menuSection}>
                            <Text style={[styles.sectionTitle, { color: muted }]}>{section.title}</Text>
                            <View style={[styles.menuItems, { backgroundColor: card }]}>
                                {section.items.map((item, itemIndex) => (
                                    <TouchableOpacity
                                        key={itemIndex}
                                        style={[styles.menuItem, { borderBottomColor: muted + '20' }]}
                                        onPress={() => router.push(item.route as any)}
                                    >
                                        <View style={styles.menuItemLeft}>
                                            <View style={[styles.menuIcon, { backgroundColor: tint + '15' }]}>
                                                <IconSymbol
                                                    name={item.icon as any}
                                                    size={20}
                                                    color={tint}
                                                />
                                            </View>
                                            <Text style={[styles.menuItemText, { color: text }]}>{item.label}</Text>
                                        </View>
                                        <IconSymbol name="chevron.right" size={16} color={muted} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ))}

                    {/* Logout Button */}
                    <TouchableOpacity style={[styles.logoutButton, { backgroundColor: card }]} onPress={handleLogout}>
                        <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color="#ef4444" />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>

                {/* App Version */}
                <Text style={[styles.versionText, { color: muted }]}>Admin Panel v1.0.0</Text>
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
        paddingBottom: 32,
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
    adminBadge: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4,
    },
    userRole: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ef4444',
        marginBottom: 8,
    },
    userEmail: {
        fontSize: 14,
    },
    padding: {
        paddingHorizontal: 20,
    },
    menuSection: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    menuItems: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    menuIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '600',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 24,
        paddingVertical: 16,
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
