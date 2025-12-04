import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function BusinessDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: card, borderBottomColor: muted + '40' }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <IconSymbol name="chevron.left" size={24} color={text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: text }]}>Business Details</Text>
                <TouchableOpacity style={styles.editButton}>
                    <IconSymbol name="pencil" size={20} color={tint} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.placeholderContainer}>
                    <IconSymbol name="building.2.fill" size={64} color={tint} />
                    <Text style={[styles.placeholderTitle, { color: text }]}>Business Details</Text>
                    <Text style={[styles.placeholderText, { color: muted }]}>
                        Detailed view with business information, analytics, and management options
                    </Text>
                    <Text style={[styles.placeholderId, { color: muted }]}>Business ID: {params.id}</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    editButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    placeholderContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    placeholderTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginTop: 20,
        marginBottom: 12,
    },
    placeholderText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 40,
    },
    placeholderId: {
        fontSize: 12,
        fontFamily: 'monospace',
    },
});
