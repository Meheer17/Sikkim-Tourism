import { Image } from 'expo-image';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useRouter } from 'expo-router';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/useAuth';

export default function AdminHomeScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login' as any);
    };

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
            headerImage={
                <Image
                    source={require('@/assets/images/partial-react-logo.png')}
                    style={styles.reactLogo}
                />
            }>
            <ThemedView style={styles.titleContainer}>
                <ThemedText type="title">Admin Dashboard</ThemedText>
                <HelloWave />
            </ThemedView>

            <ThemedView style={styles.userInfoContainer}>
                <ThemedText type="subtitle">Welcome, {user?.firstName}! 👑</ThemedText>
                <View style={styles.infoRow}>
                    <ThemedText style={styles.label}>Role:</ThemedText>
                    <ThemedText style={styles.adminBadge}>ADMIN</ThemedText>
                </View>
                <View style={styles.infoRow}>
                    <ThemedText style={styles.label}>Email:</ThemedText>
                    <ThemedText>{user?.email}</ThemedText>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
            </ThemedView>

            <ThemedView style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <ThemedText style={styles.statNumber}>1,234</ThemedText>
                    <ThemedText style={styles.statLabel}>Total Users</ThemedText>
                </View>
                <View style={styles.statCard}>
                    <ThemedText style={styles.statNumber}>567</ThemedText>
                    <ThemedText style={styles.statLabel}>Active Today</ThemedText>
                </View>
            </ThemedView>

            <ThemedView style={styles.section}>
                <ThemedText type="subtitle">Admin Features</ThemedText>
                <ThemedText>
                    • User Management{'\n'}
                    • System Settings{'\n'}
                    • Analytics & Reports{'\n'}
                    • Content Moderation
                </ThemedText>
            </ThemedView>
        </ParallaxScrollView>
    );
}

const styles = StyleSheet.create({
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    reactLogo: {
        height: 178,
        width: 290,
        bottom: 0,
        left: 0,
        position: 'absolute',
    },
    userInfoContainer: {
        gap: 12,
        marginBottom: 16,
        padding: 16,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontWeight: '600',
    },
    adminBadge: {
        backgroundColor: '#FF3B30',
        color: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        fontSize: 12,
        fontWeight: '600',
        overflow: 'hidden',
    },
    logoutButton: {
        backgroundColor: '#FF3B30',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    statLabel: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.9,
    },
    section: {
        gap: 8,
        marginBottom: 16,
    },
});
