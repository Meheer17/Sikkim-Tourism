import React from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { AuthUtils } from '@/utils/auth';
import { TokenManager } from '@/utils/storage';
import { UserRole } from '@/types/api.types';
import Toast from 'react-native-toast-message';

export default function LoginScreen() {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const router = useRouter();
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Toast.show({
                type: 'error',
                text1: 'Missing Fields',
                text2: 'Please enter email and password',
            });
            return;
        }

        setIsLoading(true);
        try {
            const success = await login({ email, password });
            if (success) {
                router.replace('/' as any);
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Login Failed',
                text2: error.message || 'Please check your credentials',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleMockLogin = async () => {
        Alert.alert(
            'Mock Login',
            'This will bypass authentication for testing. Choose a role:',
            [
                {
                    text: 'Admin',
                    onPress: () => injectMockAuth(UserRole.ADMIN),
                },
                {
                    text: 'User',
                    onPress: () => injectMockAuth(UserRole.USER),
                },
                {
                    text: 'Orizer',
                    onPress: () => injectMockAuth(UserRole.BUSINESS),
                },
                {
                    text: 'Busss',
                    onPress: () => injectMockAuth(UserRole.BUSINESS),
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
            ]
        );
    };

    const injectMockAuth = async (role: UserRole) => {
        try {
            setIsLoading(true);

            // Create mock user
            const mockUser = {
                id: 'mock-user-123',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                phone: '+1234567890',
                avatar: 'https://via.placeholder.com/150',
                role,
                isEmailVerified: true,
                isPhoneVerified: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            // Create mock tokens
            const mockAccessToken = 'mock-access-token-' + Date.now();
            const mockRefreshToken = 'mock-refresh-token-' + Date.now();

            // Save mock data
            await AuthUtils.saveUser(mockUser);
            await TokenManager.saveTokens(mockAccessToken, mockRefreshToken);

            Toast.show({
                type: 'success',
                text1: 'Mock Login Successful',
                text2: `Logged in as ${role}`,
            });

            // Navigate to index which will route based on role
            setTimeout(() => {
                router.replace('/' as any);
            }, 500);
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Mock Login Failed',
                text2: 'Could not inject auth data',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to continue</Text>

                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                                editable={!isLoading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleLogin}
                            disabled={isLoading}>
                            <Text style={styles.buttonText}>
                                {isLoading ? 'Signing In...' : 'Sign In'}
                            </Text>
                        </TouchableOpacity>

                        {/* Debug Mock Login Button */}
                        <TouchableOpacity
                            style={[styles.mockButton, isLoading && styles.buttonDisabled]}
                            onPress={handleMockLogin}
                            disabled={isLoading}>
                            <Text style={styles.mockButtonText}>
                                🔓 Mock Login (Debug)
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.push('/register' as any)}
                            disabled={isLoading}>
                            <Text style={styles.linkText}>
                                Don't have an account? <Text style={styles.linkBold}>Sign Up</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 40,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    button: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    mockButton: {
        backgroundColor: '#FF9500',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 16,
        borderWidth: 2,
        borderColor: '#FF6B00',
    },
    mockButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    linkText: {
        textAlign: 'center',
        color: '#666',
        marginTop: 24,
        fontSize: 14,
    },
    linkBold: {
        color: '#007AFF',
        fontWeight: '600',
    },
});
