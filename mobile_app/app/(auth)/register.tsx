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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import Toast from 'react-native-toast-message';

export default function RegisterScreen() {
    const [formData, setFormData] = React.useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [isLoading, setIsLoading] = React.useState(false);
    const router = useRouter();
    const { register } = useAuth();

    const handleRegister = async () => {
        const { firstName, lastName, email, password, confirmPassword } = formData;

        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            Toast.show({
                type: 'error',
                text1: 'Missing Fields',
                text2: 'Please fill in all required fields',
            });
            return;
        }

        if (password !== confirmPassword) {
            Toast.show({
                type: 'error',
                text1: 'Password Mismatch',
                text2: 'Passwords do not match',
            });
            return;
        }

        setIsLoading(true);
        try {
            const success = await register(formData);
            if (success) {
                router.replace('/' as any);
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Registration Failed',
                text2: error.message || 'Please try again',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Sign up to get started</Text>

                    <View style={styles.form}>
                        <View style={styles.row}>
                            <View style={[styles.inputContainer, styles.halfWidth]}>
                                <Text style={styles.label}>First Name*</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="John"
                                    value={formData.firstName}
                                    onChangeText={(value) => updateField('firstName', value)}
                                    autoCapitalize="words"
                                    editable={!isLoading}
                                />
                            </View>

                            <View style={[styles.inputContainer, styles.halfWidth]}>
                                <Text style={styles.label}>Last Name*</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Doe"
                                    value={formData.lastName}
                                    onChangeText={(value) => updateField('lastName', value)}
                                    autoCapitalize="words"
                                    editable={!isLoading}
                                />
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email*</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="john.doe@example.com"
                                value={formData.email}
                                onChangeText={(value) => updateField('email', value)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                                editable={!isLoading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Phone (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="+1 234 567 8900"
                                value={formData.phone}
                                onChangeText={(value) => updateField('phone', value)}
                                keyboardType="phone-pad"
                                editable={!isLoading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Password*</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter password"
                                value={formData.password}
                                onChangeText={(value) => updateField('password', value)}
                                secureTextEntry
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                            <Text style={styles.hint}>
                                Min 8 characters, 1 uppercase, 1 number, 1 special character
                            </Text>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Confirm Password*</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Re-enter password"
                                value={formData.confirmPassword}
                                onChangeText={(value) => updateField('confirmPassword', value)}
                                secureTextEntry
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={isLoading}>
                            <Text style={styles.buttonText}>
                                {isLoading ? 'Creating Account...' : 'Sign Up'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.back()}
                            disabled={isLoading}>
                            <Text style={styles.linkText}>
                                Already have an account? <Text style={styles.linkBold}>Sign In</Text>
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
        paddingTop: 60,
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
        marginBottom: 32,
    },
    form: {
        width: '100%',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfWidth: {
        flex: 1,
    },
    inputContainer: {
        marginBottom: 16,
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
    hint: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
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
