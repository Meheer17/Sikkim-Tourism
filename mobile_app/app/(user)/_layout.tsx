import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useRouter, useSegments } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

// Import your page components
import HomeScreen from './index';
import ExploreScreen from './explore';
import ProfileScreen from './profile';

export default function UserLayout() {
    const [selectedPage, setSelectedPage] = useState(0);
    const pagerRef = useRef<PagerView>(null);

    const tabs = [
        { name: 'Home', icon: 'house.fill', component: HomeScreen },
        { name: 'Explore', icon: 'paperplane.fill', component: ExploreScreen },
        { name: 'Profile', icon: 'person.crop.circle', component: ProfileScreen },
    ];

    const handleTabPress = (index: number) => {
        pagerRef.current?.setPage(index);
        setSelectedPage(index);
    };

    return (
        <View style={styles.container}>
            <PagerView
                style={styles.pager}
                initialPage={0}
                ref={pagerRef}
                onPageSelected={(e) => setSelectedPage(e.nativeEvent.position)}
            >
                {tabs.map((tab, index) => (
                    <View key={index} style={styles.page}>
                        <tab.component />
                    </View>
                ))}
            </PagerView>

            <View style={[styles.tabBar, { backgroundColor: '#fff' }]}>
                {tabs.map((tab, index) => {
                    const isActive = selectedPage === index;
                    return (
                        <TouchableOpacity
                            key={index}
                            style={styles.tab}
                            onPress={() => handleTabPress(index)}
                        >
                            <IconSymbol
                                size={28}
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    pager: {
        flex: 1,
    },
    page: {
        flex: 1,
    },
    tabBar: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#e5e5e5',
        paddingBottom: 20,
        paddingTop: 8,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabLabel: {
        fontSize: 12,
        marginTop: 4,
    },
});
