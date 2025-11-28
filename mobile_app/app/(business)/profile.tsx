import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/hooks/useAuth';

export default function BusinessProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();

    const handleLogout = async () => { await logout(); router.replace('/(auth)/login' as any); };

    const menu = [
        { label: 'My Services', icon: 'square.grid.2x2.fill', route: '/(business)/services' },
        { label: 'Bookings', icon: 'ticket.fill', route: '/(business)/bookings' },
        { label: 'Requests', icon: 'tray.full.fill', route: '/(business)/requests' },
        { label: 'Edit Profile', icon: 'pencil', route: '/(business)/(stack)/edit-profile' },
        { label: 'Payouts', icon: 'banknote.fill', route: '/(business)/(stack)/payouts' },
        { label: 'Settings', icon: 'gearshape.fill', route: '/(business)/(stack)/settings' },
    ];

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{user?.firstName?.[0]}{user?.lastName?.[0]}</Text></View>
                    <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
                    <Text style={styles.email}>{user?.email}</Text>
                    <View style={styles.badge}><IconSymbol name="briefcase.fill" size={16} color="#fff" /><Text style={styles.badgeText}>Business</Text></View>
                </View>

                <View style={styles.menuList}>
                    {menu.map((m, i) => (
                        <TouchableOpacity key={i} style={styles.menuItem} onPress={() => router.push(m.route as any)}>
                            <View style={styles.menuLeft}>
                                <View style={styles.menuIcon}><IconSymbol name={m.icon as any} size={20} color="#0a7ea4" /></View>
                                <Text style={styles.menuText}>{m.label}</Text>
                            </View>
                            <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color="#ef4444" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    scroll: { flex: 1 },
    content: { paddingBottom: 100 },
    header: { backgroundColor: '#fff', paddingTop: 60, paddingBottom: 24, alignItems: 'center' },
    avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#0a7ea4', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 34, fontWeight: '700', color: '#fff' },
    name: { fontSize: 22, fontWeight: '700', color: '#11181C', marginTop: 12 },
    email: { fontSize: 13, color: '#687076', marginTop: 4 },
    badge: { flexDirection: 'row', gap: 6, backgroundColor: '#0a7ea4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginTop: 10 },
    badgeText: { fontSize: 12, fontWeight: '600', color: '#fff' },
    menuList: { backgroundColor: '#fff', borderRadius: 12, margin: 16, overflow: 'hidden' },
    menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    menuIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e8f4f8', justifyContent: 'center', alignItems: 'center' },
    menuText: { fontSize: 16, fontWeight: '600', color: '#11181C' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, paddingVertical: 16, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#fee2e2' },
    logoutText: { fontSize: 16, fontWeight: '600', color: '#ef4444' },
});
