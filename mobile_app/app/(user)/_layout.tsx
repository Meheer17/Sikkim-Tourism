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
        // Extract page names for comparison
        const routePage = route.split('/').pop();
        const currentPage = pathname.split('/').pop();
        const isSamePage = routePage === currentPage;
        
        console.log('Tab pressed:', route, 'Current:', pathname, 'Same?', isSamePage);
        
        if (!isSamePage) {
            // Use push for chat to enable back gesture, replace for others
            if (route.includes('community-chat')) {
                router.push(route as any);
            } else {
                router.replace(route as any);
            }
        }
    };

    const isActiveRoute = (route: string) => {
        // Extract the page name from the route (e.g., '/home' from '/(user)/home')
        const routePage = route.split('/').pop();
        const currentPage = pathname.split('/').pop();
        return routePage === currentPage || pathname === route;
    };

    // Hide tab bar on community chat screen
    const shouldShowTabBar = !pathname.includes('/community-chat');

    return (
        <View style={styles.container}>
            <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
                <Stack.Screen name="index" options={{ gestureEnabled: false }} />
                <Stack.Screen name="home" options={{ gestureEnabled: false }} />
                <Stack.Screen name="services" options={{ gestureEnabled: false }} />
                <Stack.Screen name="explore" options={{ gestureEnabled: false }} />
                <Stack.Screen name="my-bookings" options={{ gestureEnabled: false }} />
                <Stack.Screen name="profile" options={{ gestureEnabled: false }} />
                <Stack.Screen name="community-chat" options={{ gestureEnabled: true }} />
                <Stack.Screen
                    name="(stack)"
                    options={{
                        presentation: 'modal',
                        headerShown: false,
                        gestureEnabled: true,
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
                                style={[styles.tab, isActive && styles.activeTab]}
                                onPress={() => handleTabPress(tab.route)}
                                activeOpacity={0.7}
                                disabled={isActive}
                            >
                                {isActive && <View style={styles.activeIndicator} />}
                                <IconSymbol
                                    size={24}
                                    name={tab.icon as any}
                                    color={isActive ? Colors.tint : '#8E8E93'}
                                />
                                <ThemedText
                                    style={[
                                        styles.tabLabel,
                                        { 
                                            color: isActive ? Colors.tint : '#8E8E93',
                                            fontWeight: isActive ? '600' : '500',
                                        },
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
        paddingVertical: 8,
        position: 'relative',
    },
    activeTab: {
        backgroundColor: '#f0f9ff',
    },
    activeIndicator: {
        position: 'absolute',
        top: 0,
        width: 40,
        height: 3,
        backgroundColor: Colors.tint,
        borderRadius: 1.5,
    },
    tabLabel: {
        fontSize: 11,
        marginTop: 2,
        fontWeight: '500',
    },
});
