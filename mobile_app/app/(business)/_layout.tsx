        // juhygtfrdesw-o0dfxrzeswaq    uimport React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter, usePathname } from 'expo-router';
import Animated, { FadeInDown, SlideInUp, SlideOutDown, Easing } from 'react-native-reanimated';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function BusinessLayout() {
    const router = useRouter();
    const pathname = usePathname();
    const tint = useThemeColor('tint');
    const icon = useThemeColor('icon');
    const cardBg = useThemeColor('card');
    const border = useThemeColor('border');
    const activeTabBg = useThemeColor('activeTabBg');

    const tabs = [
        { name: 'Dashboard', icon: 'chart.bar.fill', route: '/(business)/dashboard' },
        { name: 'Services', icon: 'square.grid.2x2.fill', route: '/(business)/services' },
        { name: 'Manage', icon: 'rectangle.3.offgrid.fill', route: '/(business)/manage' },
        { name: 'Profile', icon: 'person.crop.circle.fill', route: '/(business)/profile' },
    ];

    const handleTabPress = (route: string) => {
        const routePage = route.split('/').pop();
        const currentPage = pathname.split('/').pop();
        const isSamePage = routePage === currentPage;

        if (!isSamePage) {
            router.replace(route as any);
        }
    };

    const isActiveRoute = (route: string) => {
        const routePage = route.split('/').pop();
        const currentPage = pathname.split('/').pop();
        return routePage === currentPage || pathname === route;
    };

    const shouldShowTabBar = !pathname.includes('/(business)/(stack)');

    return (
        <View style={styles.container}>
            <Stack
                screenOptions={{
                    headerShown: false,
                    gestureEnabled: false,
                    animation: 'fade',
                    animationDuration: 200,
                    presentation: 'card',
                }}
            >
                <Stack.Screen name="index" options={{ gestureEnabled: false }} />
                <Stack.Screen name="dashboard" options={{ gestureEnabled: false }} />
                <Stack.Screen name="services" options={{ gestureEnabled: false }} />
                <Stack.Screen name="manage" options={{ gestureEnabled: false }} />
                <Stack.Screen name="bookings" options={{ gestureEnabled: false }} />
                <Stack.Screen name="requests" options={{ gestureEnabled: false }} />
                <Stack.Screen name="profile" options={{ gestureEnabled: false }} />
                <Stack.Screen name="(stack)" options={{ presentation: 'modal', headerShown: false, gestureEnabled: true, animation: 'slide_from_bottom' }} />
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
        paddingVertical: 4,
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
