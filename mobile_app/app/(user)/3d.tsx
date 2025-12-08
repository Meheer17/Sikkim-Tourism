import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ThreeDScreen() {
    const params = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    
    const url = (params.url as string) || 'https://www.google.com';
    const placeName = (params.name as string) || '3D View';

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={24} color="#fff" />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>{placeName}</ThemedText>
            </View>
            <WebView
                source={{ uri: url }}
                style={styles.webview}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#000',
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 12,
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    webview: {
        flex: 1,
    },
});
