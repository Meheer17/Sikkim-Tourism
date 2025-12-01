import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/hooks/useAuth';

export default function AdminProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login' as any);
    };

    const menuSections = [
        {
            title: 'Admin Tools',
            items: [
                {
                    label: 'System Settings',
                    icon: 'gearshape.fill',
                    route: '/(admin)/(stack)/settings',
                },
                {
                    label: 'Analytics',
                    icon: 'chart.bar.fill',
                    route: '/(admin)/(stack)/analytics',
                },
                {
                    label: 'Reports',
                    icon: 'doc.text.fill',
                    route: '/(admin)/(stack)/reports',
                },
            ],
        },
        {
            title: 'Account',
            items: [
                {
                    label: 'Edit Profile',
                    icon: 'person.crop.circle.fill',
                    route: '/(admin)/(stack)/edit-profile',
                },
                {
                    label: 'Security',
                    icon: 'lock.shield.fill',
                    route: '/(admin)/(stack)/security',
                },
            ],
        },
    ];

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
                                {user?.name ? user.name.split(' ').map(p => p.charAt(0)).slice(0, 2).join('') : 'A'}
                            </Text>
                        </View>
                        <View style={styles.adminBadge}>
                            <IconSymbol name="shield.fill" size={16} color="#fff" />
                        </View>
                    </View>
                    <Text style={styles.userName}>{user?.name}</Text>
                    <Text style={styles.userRole}>Administrator</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                </View>

                {/* Menu Sections */}
                <View style={styles.padding}>
                    {menuSections.map((section, index) => (
                        <View key={index} style={styles.menuSection}>
                            <Text style={styles.sectionTitle}>{section.title}</Text>
                            <View style={styles.menuItems}>
                                {section.items.map((item, itemIndex) => (
                                    <TouchableOpacity
                                        key={itemIndex}
                                        style={styles.menuItem}
                                        onPress={() => router.push(item.route as any)}
                                    >
                                        <View style={styles.menuItemLeft}>
                                            <View style={styles.menuIcon}>
                                                <IconSymbol
                                                    name={item.icon as any}
                                                    size={20}
                                                    color="#0a7ea4"
                                                />
                                            </View>
                                            <Text style={styles.menuItemText}>{item.label}</Text>
                                        </View>
                                        <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ))}

                    {/* Logout Button */}
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color="#ef4444" />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>

                {/* App Version */}
                <Text style={styles.versionText}>Admin Panel v1.0.0</Text>
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
        backgroundColor: '#0a7ea4',
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
        color: '#11181C',
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
        color: '#687076',
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
        color: '#687076',
        textTransform: 'uppercase',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    menuItems: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
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
        backgroundColor: '#e8f4f8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#11181C',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 24,
        paddingVertical: 16,
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
