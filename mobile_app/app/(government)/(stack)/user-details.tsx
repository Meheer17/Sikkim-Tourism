import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { userService } from '@/services/user.service';

interface UserProfile {
    _id: string;
    name: string;
    email: string;
    role: string;
    address?: string;
    phone?: string;
    created_at?: string;
    updated_at?: string;
}

export default function AdminUserDetailsScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    useEffect(() => {
        if (!id) {
            Alert.alert('Error', 'User ID is required');
            router.back();
            return;
        }
        loadUserProfile();
    }, [id]);

    const loadUserProfile = async () => {
        setLoading(true);
        try {
            const resp = await userService.get(id!);
            if (resp.success && resp.data) {
                // Map response to UserProfile type
                const u = resp.data as any;
                setUser({
                    _id: u._id || u.id || '',
                    name: u.name || '',
                    email: u.email || '',
                    role: u.role || '',
                    address: u.address || '',
                    phone: u.phone || '',
                    created_at: u.created_at || '',
                    updated_at: u.updated_at || '',
                });
            } else {
                Alert.alert('Error', 'User not found');
                router.back();
            }
        } catch (error) {
            console.error('Failed to load user:', error);
            Alert.alert('Error', 'Failed to load user');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: background }]}>
                <ActivityIndicator size="large" color={tint} />
            </View>
        );
    }

    if (!user) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: background }]}>
                <IconSymbol name="exclamationmark.triangle" size={48} color={muted} />
                <Text style={[styles.errorText, { color: text }]}>User not found</Text>
                <TouchableOpacity style={[styles.button, { backgroundColor: tint }]} onPress={() => router.back()}>
                    <Text style={styles.buttonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: background }]}>
            <View style={[styles.header, { backgroundColor: card }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={24} color={text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: text }]}>User Details</Text>
                <View style={styles.placeholder} />
            </View>
            <View style={[styles.card, { backgroundColor: card }]}>
                <Text style={[styles.label, { color: text }]}>Name</Text>
                <Text style={[styles.value, { color: text }]}>{user.name}</Text>
                <Text style={[styles.label, { color: text }]}>Email</Text>
                <Text style={[styles.value, { color: text }]}>{user.email}</Text>
                <Text style={[styles.label, { color: text }]}>Role</Text>
                <Text style={[styles.value, { color: tint }]}>{user.role}</Text>
                {user.address && (
                    <>
                        <Text style={[styles.label, { color: text }]}>Address</Text>
                        <Text style={[styles.value, { color: muted }]}>{user.address}</Text>
                    </>
                )}
                {user.phone && (
                    <>
                        <Text style={[styles.label, { color: text }]}>Phone</Text>
                        <Text style={[styles.value, { color: muted }]}>{user.phone}</Text>
                    </>
                )}
                <Text style={[styles.label, { color: text }]}>Created At</Text>
                <Text style={[styles.value, { color: muted }]}>{user.created_at ? new Date(user.created_at).toLocaleString() : '-'}</Text>
                <Text style={[styles.label, { color: text }]}>Updated At</Text>
                <Text style={[styles.value, { color: muted }]}>{user.updated_at ? new Date(user.updated_at).toLocaleString() : '-'}</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 8,
    },
    placeholder: {
        width: 40,
    },
    card: {
        margin: 16,
        borderRadius: 16,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
        marginBottom: 8,
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 24,
    },
    button: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
