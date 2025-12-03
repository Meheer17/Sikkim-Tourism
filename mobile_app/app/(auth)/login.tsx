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
    Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { AuthUtils } from '@/utils/auth';
import { TokenManager } from '@/utils/storage';
import { UserRole } from '@/types/api.types';
import Toast from 'react-native-toast-message';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function LoginScreen() {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [showRoleModal, setShowRoleModal] = React.useState(false);
    const router = useRouter();
    const { login } = useAuth();

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

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
        if (Platform.OS === 'android') {
            setShowRoleModal(true);
        } else {
            Alert.alert(
                'Mock Login',
                'Choose a role:',
                [
                    {
                        text: 'User',
                        onPress: () => { setEmail('user@a.c'); setPassword('meheer17'); },
                    },
                    {
                        text: 'Business',
                        onPress: () => { setEmail('mahi@a.com'); setPassword('Meheer17'); },
                    },
                    {
                        text: 'Admin',
                        onPress: () => { setEmail('admin@sikkimtourism.com'); setPassword('Admin@ST25'); },
                    },
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                ],
                { cancelable: true }
            );
        }
    };

    const handleRoleSelect = (role: UserRole) => {
        setShowRoleModal(false);
        injectMockAuth(role);
    };

    const injectMockAuth = async (role: UserRole) => {
        try {
            setIsLoading(true);

            // Create mock user
            const mockUser = {
                id: 'mock-user-123',
                name: 'Test User',
                address: '123 Mock Street, City',
                gender: 'other',
                email: 'test@example.com',
                role,
                approved: true,
                last_synced_at: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            // Create mock token
            const mockAccessToken = 'mock-access-token-' + Date.now();

            // Save mock data
            await AuthUtils.saveUser(mockUser);
            await TokenManager.saveToken(mockAccessToken);

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
            style={[styles.container, { backgroundColor: background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <Text style={[styles.title, { color: text }]}>Welcome Back</Text>
                    <Text style={[styles.subtitle, { color: muted }]}>Sign in to continue</Text>

                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: text }]}>Email</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                placeholder="Enter your email"
                                placeholderTextColor={muted}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                                editable={!isLoading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: text }]}>Password</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                placeholder="Enter your password"
                                placeholderTextColor={muted}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: tint }, isLoading && styles.buttonDisabled]}
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
                            <Text style={[styles.linkText, { color: muted }]}>
                                Don't have an account? <Text style={[styles.linkBold, { color: tint }]}>Sign Up</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Role Selection Modal for Android */}
            <Modal
                visible={showRoleModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowRoleModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: card }]}>
                        <Text style={[styles.modalTitle, { color: text }]}>Choose Mock Login Role</Text>
                        <Text style={[styles.modalSubtitle, { color: muted }]}>Select a role for testing</Text>

                        <ScrollView style={styles.roleScrollView}>
                            <TouchableOpacity
                                style={[styles.roleButton, { backgroundColor: background, borderColor: muted + '40' }]}
                                onPress={() => { setEmail('user@a.c'); setPassword('meheer17'); setShowRoleModal(false); }}
                            >
                                <Text style={[styles.roleButtonText, { color: text }]}>👤 User</Text>
                                <Text style={[styles.roleButtonDesc, { color: muted }]}>Regular tourist user</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.roleButton, { backgroundColor: background, borderColor: muted + '40' }]}
                                onPress={() => { setEmail('mahi@a.com'); setPassword('Meheer17'); setShowRoleModal(false); }}
                            >
                                <Text style={[styles.roleButtonText, { color: text }]}>💼 Business</Text>
                                <Text style={[styles.roleButtonDesc, { color: muted }]}>Service provider</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.roleButton, { backgroundColor: background, borderColor: muted + '40' }]}
                                onPress={() => { setEmail('admin@sikkimtourism.com'); setPassword('Admin@ST25'); setShowRoleModal(false); }}
                            >
                                <Text style={[styles.roleButtonText, { color: text }]}>⚙️ Admin</Text>
                                <Text style={[styles.roleButtonDesc, { color: muted }]}>System administrator</Text>
                            </TouchableOpacity>
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.modalCancelButton, { backgroundColor: background }]}
                            onPress={() => setShowRoleModal(false)}
                        >
                            <Text style={[styles.modalCancelText, { color: muted }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
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
        marginBottom: 8,
    },
    input: {
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
    },
    button: {
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
        marginTop: 24,
        fontSize: 14,
    },
    linkBold: {
        fontWeight: '600',
    },
    // Modal styles for Android role selection
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        paddingHorizontal: 20,
    },
    modalSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    roleScrollView: {
        paddingHorizontal: 20,
        maxHeight: 400,
    },
    roleButton: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    roleButtonText: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    roleButtonDesc: {
        fontSize: 13,
    },
    modalCancelButton: {
        marginTop: 20,
        marginHorizontal: 20,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
