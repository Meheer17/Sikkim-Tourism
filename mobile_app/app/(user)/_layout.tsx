import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter, usePathname } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

export default function UserLayout() {
    const router = useRouter();
    const pathname = usePathname();

    const tabs = [
        { name: 'Home', icon: 'house.fill', route: '/(user)/home' },
        { name: 'Services', icon: 'square.grid.2x2.fill', route: '/(user)/services' },
        { name: 'Explore', icon: 'map.fill', route: '/(user)/explore' },
        { name: 'Bookings', icon: 'ticket.fill', route: '/(user)/my-bookings' },
        { name: 'Chat', icon: 'bubble.left.and.bubble.right.fill', route: '/(user)/community-chat' },
    ];

    const handleTabPress = (route: string) => {
        router.push(route as any);
    };

    const isActiveRoute = (route: string) => {
        return pathname === route;
    };

    // Hide tab bar on community chat screen
    const shouldShowTabBar = !pathname.includes('/community-chat');

    return (
        <View style={styles.container}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="home" />
                <Stack.Screen name="services" />
                <Stack.Screen name="explore" />
                <Stack.Screen name="my-bookings" />
                <Stack.Screen name="profile" />
                <Stack.Screen name="community-chat" />
                <Stack.Screen
                    name="(stack)"
                    options={{
                        presentation: 'modal',
                        headerShown: false,
                    }}
                />
            </Stack>

            {shouldShowTabBar && (
                <View style={[styles.tabBar, { backgroundColor: '#fff' }]}>
                    {tabs.map((tab, index) => {
                        const isActive = isActiveRoute(tab.route);
                        return (
                            <TouchableOpacity
                                key={index}
                                style={styles.tab}
                                onPress={() => handleTabPress(tab.route)}
                            >
                                <IconSymbol
                                    size={24}
                                    name={tab.icon as any}
                                    color={isActive ? Colors.tint : '#8E8E93'}
                                />
                                <ThemedText
                                    style={[
                                        styles.tabLabel,
                                        { color: isActive ? Colors.tint : '#8E8E93' },
                                    ]}
                                >
                                    {tab.name}
                                </ThemedText>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    tabBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#e5e5e5',
        paddingBottom: 20,
        paddingTop: 8,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
    },
    tabLabel: {
        fontSize: 11,
        marginTop: 2,
        fontWeight: '500',
    },
});
