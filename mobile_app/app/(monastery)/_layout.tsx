import React from 'react';
import { Tabs } from 'expo-router';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';

export default function MonasteryLayout() {
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const tint = useThemeColor('tint');
    const { user } = useAuth();
    const router = useRouter();

    // Check if user is monastery, if not redirect
    React.useEffect(() => {
        if (user && user.role !== 'monastery') {
            router.replace('/(user)/' as any);
        }
    }, [user]);

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: tint,
                tabBarInactiveTintColor: '#999',
                tabBarStyle: {
                    backgroundColor: card,
                    borderTopColor: '#e5e7eb',
                    borderTopWidth: 1,
                    paddingBottom: 8,
                },
                headerStyle: {
                    backgroundColor: card,
                    borderBottomColor: '#e5e7eb',
                    borderBottomWidth: 1,
                },
                headerTintColor: text,
                headerTitleStyle: {
                    color: text,
                    fontWeight: '600',
                },
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    headerTitle: 'Monastery Dashboard',
                    tabBarLabel: 'Dashboard',
                    tabBarIcon: ({ color, focused }) => (
                        <IconSymbol size={24} name={focused ? 'house.fill' : 'house'} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="artifacts"
                options={{
                    title: 'Artifacts',
                    headerTitle: 'Manage Artifacts',
                    tabBarLabel: 'Artifacts',
                    tabBarIcon: ({ color, focused }) => (
                        <IconSymbol size={24} name={focused ? 'photo.fill' : 'photo'} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="gallery"
                options={{
                    title: 'Gallery',
                    headerTitle: 'View Gallery',
                    tabBarLabel: 'Gallery',
                    tabBarIcon: ({ color, focused }) => (
                        <IconSymbol size={24} name={focused ? 'square.grid.2x2.fill' : 'square.grid.2x2'} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    headerTitle: 'Monastery Profile',
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <IconSymbol size={24} name={focused ? 'person.fill' : 'person'} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
