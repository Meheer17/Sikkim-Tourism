import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

export function ScrollableTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const label =
                        options.tabBarLabel !== undefined
                            ? options.tabBarLabel
                            : options.title !== undefined
                                ? options.title
                                : route.name;

                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    return (
                        <TouchableOpacity
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            style={[styles.tab, isFocused && styles.tabFocused]}
                        >
                            {options.tabBarIcon &&
                                options.tabBarIcon({
                                    focused: isFocused,
                                    color: isFocused ? options.tabBarActiveTintColor || '#007AFF' : options.tabBarInactiveTintColor || '#8E8E93',
                                    size: 24,
                                })}
                            <Text
                                style={[
                                    styles.label,
                                    {
                                        color: isFocused
                                            ? options.tabBarActiveTintColor || '#007AFF'
                                            : options.tabBarInactiveTintColor || '#8E8E93',
                                    },
                                ]}
                            >
                                {typeof label === 'string' ? label : ''}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e5e5e5',
    },
    scrollContent: {
        flexDirection: 'row',
        paddingHorizontal: 8,
    },
    tab: {
        flex: 1,
        minWidth: 100,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabFocused: {
        borderBottomWidth: 2,
        borderBottomColor: '#007AFF',
    },
    label: {
        fontSize: 12,
        marginTop: 4,
    },
});
