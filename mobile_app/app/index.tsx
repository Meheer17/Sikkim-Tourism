import { useEffect } from 'react';
import { useRouter, useRootNavigationState } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/api.types';

export default function Index() {
    const { isAuthenticated, isLoading, user } = useAuth();
    const router = useRouter();
    const navigationState = useRootNavigationState();

    useEffect(() => {
        if (!navigationState?.key || isLoading) return;

        if (isAuthenticated && user) {
            // Route to role-specific section
            switch (user.role) {
                case UserRole.GOVERNMENT:
                    router.replace('/(government)' as any);
                    break;
                case UserRole.BUSINESS:
                    router.replace('/(business)' as any);
                    break;
                case UserRole.MONASTERY:
                    router.replace('/(monastery)' as any);
                    break;
                case UserRole.USER:
                default:
                    router.replace('/(user)' as any);
                    break;
            }
        } else {
            router.replace('/(auth)/login' as any);
        }
    }, [isAuthenticated, isLoading, user, navigationState?.key]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#007AFF" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});
