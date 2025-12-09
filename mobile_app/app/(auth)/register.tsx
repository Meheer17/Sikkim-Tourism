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
import { useThemeColor } from '@/hooks/use-theme-color';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageTranslations } from '@/constants/translations';

export default function RegisterScreen() {
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    const [formData, setFormData] = React.useState({
        name: '',
        address: '',
        gender: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [isLoading, setIsLoading] = React.useState(false);
    const router = useRouter();
    const { register } = useAuth();

    const handleRegister = async () => {
        const { name, address, email, password, confirmPassword } = formData;

        if (!name || !address || !email || !password || !confirmPassword) {
            Toast.show({
                type: 'error',
                text1: t.missingFields || 'Missing Fields',
                text2: t.fillAllFields || 'Please fill in all required fields',
            });
            return;
        }

        if (password !== confirmPassword) {
            Toast.show({
                type: 'error',
                text1: t.passwordMismatch || 'Password Mismatch',
                text2: t.passwordsNotMatch || 'Passwords do not match',
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
                text1: t.registrationFailed || 'Registration Failed',
                text2: error.message || (t.pleaseTryAgain || 'Please try again'),
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
            style={[styles.container, { backgroundColor: background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <Text style={[styles.title, { color: text }]}>{t.createAccount || 'Create Account'}</Text>
                    <Text style={[styles.subtitle, { color: muted }]}>{t.signUpToGetStarted || 'Sign up to get started'}</Text>

                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: text }]}>{t.fullName || 'Full Name'}*</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                placeholder={t.fullNamePlaceholder || 'John Doe'}
                                placeholderTextColor={muted}
                                value={formData.name}
                                onChangeText={(value) => updateField('name', value)}
                                autoCapitalize="words"
                                editable={!isLoading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: text }]}>{t.address || 'Address'}*</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                placeholder={t.addressPlaceholder || '123 Main St, City, Country'}
                                placeholderTextColor={muted}
                                value={formData.address}
                                onChangeText={(value) => updateField('address', value)}
                                autoCapitalize="sentences"
                                editable={!isLoading}
                                multiline
                                numberOfLines={2}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: text }]}>{t.gender || 'Gender'} ({t.optional || 'Optional'})</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                placeholder={t.genderPlaceholder || 'male, female, or other'}
                                placeholderTextColor={muted}
                                value={formData.gender}
                                onChangeText={(value) => updateField('gender', value)}
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: text }]}>{t.email || 'Email'}*</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                placeholder={t.emailPlaceholder || 'john.doe@example.com'}
                                placeholderTextColor={muted}
                                value={formData.email}
                                onChangeText={(value) => updateField('email', value)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                                editable={!isLoading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: text }]}>{t.password || 'Password'}*</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                placeholder={t.enterPassword || 'Enter password'}
                                placeholderTextColor={muted}
                                value={formData.password}
                                onChangeText={(value) => updateField('password', value)}
                                secureTextEntry
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                            <Text style={[styles.hint, { color: muted }]}>
                                {t.minimumPassword || 'Minimum 8 characters required'}
                            </Text>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: text }]}>{t.confirmPassword || 'Confirm Password'}*</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                placeholder={t.reenterPassword || 'Re-enter password'}
                                placeholderTextColor={muted}
                                value={formData.confirmPassword}
                                onChangeText={(value) => updateField('confirmPassword', value)}
                                secureTextEntry
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: tint }, isLoading && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={isLoading}>
                            <Text style={styles.buttonText}>
                                {isLoading ? (t.creatingAccount || 'Creating Account...') : (t.signUp || 'Sign Up')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.back()}
                            disabled={isLoading}>
                            <Text style={[styles.linkText, { color: muted }]}>
                                {t.haveAccount || 'Already have an account?'} <Text style={[styles.linkBold, { color: tint }]}>{t.signIn || 'Sign In'}</Text>
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.monasteryLink, { borderColor: tint }]}
                            onPress={() => router.push('/(auth)/monastery-register' as any)}
                            disabled={isLoading}>
                            <Text style={[styles.monasteryLinkText, { color: tint }]}>
                                {t.registerMonastery || 'Registering a Monastery?'} <Text style={{ fontWeight: '600' }}>Sign Up Here</Text>
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
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
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
        marginBottom: 8,
    },
    input: {
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
    },
    hint: {
        fontSize: 12,
        marginTop: 4,
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
    linkText: {
        textAlign: 'center',
        marginTop: 24,
        fontSize: 14,
    },
    linkBold: {
        fontWeight: '600',
    },
    monasteryLink: {
        borderTopWidth: 1,
        paddingTop: 20,
        marginTop: 20,
        alignItems: 'center',
    },
    monasteryLinkText: {
        fontSize: 14,
    },
});
