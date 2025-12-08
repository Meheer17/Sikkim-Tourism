import { Stack, usePathname, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, FadeInDown, SlideInUp, SlideOutDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getLanguageTranslations } from '@/constants/translations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useThemeColor } from '@/hooks/use-theme-color';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function UserLayout() {
    const router = useRouter();
    const pathname = usePathname();
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const tint = useThemeColor('tint');
    const icon = useThemeColor('icon');
    const cardBg = useThemeColor('card');
    const border = useThemeColor('border');
    const activeTabBg = useThemeColor('activeTabBg');

    const tabs = [
        { name: t.home ?? 'Home', icon: 'house.fill', route: '/(user)/home' },
        { name: t.services ?? 'Services', icon: 'square.grid.2x2.fill', route: '/(user)/services' },
        { name: t.explore ?? 'Explore', icon: 'map.fill', route: '/(user)/explore' },
        { name: t.bookings ?? 'Bookings', icon: 'ticket.fill', route: '/(user)/my-bookings' },
        { name: t.chat ?? 'Chat', icon: 'bubble.left.and.bubble.right.fill', route: '/(user)/community-chat' },
    ];

    const handleTabPress = (route: string) => {
        // Extract page names for comparison
        const routePage = route.split('/').pop();
        const currentPage = pathname.split('/').pop();
        const isSamePage = routePage === currentPage;

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

    // Hide tab bar on community chat, immersive experience, friends list, AI chat screens, and create event
    const shouldShowTabBar = !pathname.includes('/community-chat') && !pathname.includes('/immersive-experience') && !pathname.includes('/friends-list') && !pathname.includes('/ai-planner-chat') && !pathname.includes('/create-event') && !pathname.includes('/profile');

    return (
        <View style={styles.container}>
            <Stack screenOptions={{ 
                headerShown: false, 
                gestureEnabled: false,
                animation: 'fade',
                animationDuration: 200,
                presentation: 'card'
            }}>
                <Stack.Screen name="index" options={{ gestureEnabled: false, animation: 'fade' }} />
                <Stack.Screen name="home" options={{ gestureEnabled: false, animation: 'fade' }} />
                <Stack.Screen name="services" options={{ gestureEnabled: false, animation: 'fade' }} />
                <Stack.Screen name="explore" options={{ gestureEnabled: false, animation: 'fade' }} />
                <Stack.Screen name="my-bookings" options={{ gestureEnabled: false, animation: 'fade' }} />
                <Stack.Screen name="profile" options={{ gestureEnabled: false, animation: 'fade' }} />
                <Stack.Screen name="community-chat" options={{ gestureEnabled: true, animation: 'slide_from_right' }} />
                <Stack.Screen
                    name="(stack)"
                    options={{
                        presentation: 'modal',
                        headerShown: false,
                        gestureEnabled: true,
                        animation: 'slide_from_bottom'
                    }}
                />
            </Stack>

            {shouldShowTabBar && (
                <Animated.View 
                    style={[styles.tabBar, { backgroundColor: cardBg, borderTopColor: border }]}
                    entering={SlideInUp.duration(300).easing(Easing.out(Easing.cubic))}
                    exiting={SlideOutDown.duration(200).easing(Easing.in(Easing.cubic))}
                >
                    {tabs.map((tab, index) => {
                        const isActive = isActiveRoute(tab.route);
                        return (
                            <AnimatedTouchableOpacity
                                key={index}
                                style={[styles.tab, isActive && [styles.activeTab, { backgroundColor: activeTabBg }]]}
                                onPress={() => handleTabPress(tab.route)}
                                activeOpacity={0.7}
                                disabled={isActive}
                                entering={FadeInDown.delay(index * 50).duration(400).easing(Easing.out(Easing.cubic))}
                            >
                                {isActive && <View style={[styles.activeIndicator, { backgroundColor: tint }]} />}
                                <IconSymbol
                                    size={24}
                                    name={tab.icon as any}
                                    color={isActive ? tint : icon}
                                />
                                <ThemedText
                                    style={[
                                        styles.tabLabel,
                                        { 
                                            color: isActive ? tint : icon,
                                            fontWeight: isActive ? '600' : '500',
                                        },
                                    ]}
                                >
                                    {tab.name}
                                </ThemedText>
                            </AnimatedTouchableOpacity>
                        );
                    })}
                </Animated.View>
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
    activeTab: {},
    activeIndicator: {
        position: 'absolute',
        top: 0,
        width: 40,
        height: 3,
        borderRadius: 1.5,
    },
    tabLabel: {
        fontSize: 11,
        marginTop: 2,
        fontWeight: '500',
    },
});
