import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter, usePathname } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

export default function OrganizationLayout() {
    const router = useRouter();
    const pathname = usePathname();

    const tabs = [
        { name: 'Dashboard', icon: 'chart.bar.fill', route: '/(organization)/dashboard' },
        { name: 'Places', icon: 'map.fill', route: '/(organization)/places' },
        { name: 'Events', icon: 'calendar', route: '/(organization)/events' },
        { name: 'Tickets', icon: 'ticket.fill', route: '/(organization)/tickets' },
        { name: 'Profile', icon: 'person.crop.circle.fill', route: '/(organization)/profile' },
    ];

    const handleTabPress = (route: string) => router.push(route as any);
    const isActiveRoute = (route: string) => pathname === route;

    return (
        <View style={styles.container}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="dashboard" />
                <Stack.Screen name="places" />
                <Stack.Screen name="events" />
                <Stack.Screen name="tickets" />
                <Stack.Screen name="profile" />
                <Stack.Screen name="(stack)" options={{ presentation: 'modal', headerShown: false }} />
            </Stack>

            <View style={[styles.tabBar, { backgroundColor: '#fff' }]}>
                {tabs.map((tab, i) => {
                    const isActive = isActiveRoute(tab.route);
                    return (
                        <TouchableOpacity key={i} style={styles.tab} onPress={() => handleTabPress(tab.route)}>
                            <IconSymbol size={24} name={tab.icon as any} color={isActive ? Colors.tint : '#8E8E93'} />
                            <ThemedText style={[styles.tabLabel, { color: isActive ? Colors.tint : '#8E8E93' }]}>
                                {tab.name}
                            </ThemedText>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    tabBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row',
        borderTopWidth: 1, borderTopColor: '#e5e5e5', paddingBottom: 20, paddingTop: 8,
        elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 4,
    },
    tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
    tabLabel: { fontSize: 11, marginTop: 2, fontWeight: '500' },
});
