import ThemeToggle from '@/components/common/ThemeToggle';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getLanguageTranslations } from '@/constants/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function OrganizationProfile() {
    const router = useRouter();
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const { user, logout } = useAuth();
    const tint = useThemeColor('tint');
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const textColor = useThemeColor('text');
    const muted = useThemeColor('mutedText');

    const handleLogout = async () => { await logout(); router.replace('/(auth)/login' as any); };

    const menu = [
        { label: 'Places', icon: 'map.fill', route: '/(organization)/places' },
        { label: 'Events', icon: 'calendar', route: '/(organization)/events' },
        { label: 'Tickets', icon: 'ticket.fill', route: '/(organization)/tickets' },
        { label: 'Manage Tickets', icon: 'rectangle.3.offgrid.fill', route: '/(organization)/(stack)/manage-tickets' },
        { label: 'Edit Profile', icon: 'pencil', route: '/(organization)/(stack)/edit-profile' },
        { label: 'Settings', icon: 'gearshape.fill', route: '/(organization)/(stack)/settings' },
    ];

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scroll} contentContainerStyle={[styles.content,{backgroundColor:background}]}>
                <View style={[styles.header,{backgroundColor:card}]}>
                    <View style={[styles.avatar, { backgroundColor: tint }]}><Text style={styles.avatarText}>{user?.firstName?.[0]}{user?.lastName?.[0]}</Text></View>
                    <Text style={[styles.name,{color:textColor}]}>{user?.firstName} {user?.lastName}</Text>
                    <Text style={[styles.email,{color:muted}]}>{user?.email}</Text>
                    <View style={[styles.badge,{backgroundColor:tint}]}><IconSymbol name="person.3.fill" size={16} color="#fff" /><Text style={styles.badgeText}>Organization</Text></View>
                </View>

                <View style={[styles.menuList,{backgroundColor:card}]}>
                    {menu.map((m, i) => (
                        <TouchableOpacity key={i} style={styles.menuItem} onPress={() => router.push(m.route as any)}>
                            <View style={styles.menuLeft}>
                                <View style={[styles.menuIcon, { backgroundColor: '#e8f4f8' }]}><IconSymbol name={m.icon as any} size={20} color={tint} /></View>
                                <Text style={styles.menuText}>{m.label}</Text>
                            </View>
                            <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Theme Toggle */}
                <ThemeToggle />

                <TouchableOpacity style={[styles.logoutBtn,{backgroundColor:card}]} onPress={handleLogout}>
                    <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={tint} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { flex: 1 },
    content: { paddingBottom: 100 },
    header: { paddingTop: 60, paddingBottom: 24, alignItems: 'center' },
    avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#0a7ea4', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 34, fontWeight: '700', color: '#fff' },
    name: { fontSize: 22, fontWeight: '700', color: '#11181C', marginTop: 12 },
    email: { fontSize: 13, color: '#687076', marginTop: 4 },
    badge: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginTop: 10 },
    badgeText: { fontSize: 12, fontWeight: '600', color: '#fff' },
    menuList: { backgroundColor: '#fff', borderRadius: 12, margin: 16, overflow: 'hidden' },
    menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    menuIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e8f4f8', justifyContent: 'center', alignItems: 'center' },
    menuText: { fontSize: 16, fontWeight: '600', color: '#11181C' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, paddingVertical: 16, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#fee2e2' },
    logoutText: { fontSize: 16, fontWeight: '600', color: '#ef4444' },
});
