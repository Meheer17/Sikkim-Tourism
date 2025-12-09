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
    Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import Toast from 'react-native-toast-message';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageTranslations } from '@/constants/translations';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function LoginScreen() {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [showLanguageModal, setShowLanguageModal] = React.useState(false);
    const router = useRouter();
    const { login } = useAuth();
    const { language, setLanguage } = useLanguage();
    const t = getLanguageTranslations(language);

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    const handleLogin = async () => {
        if (!email || !password) {
            Toast.show({
                type: 'error',
                text1: t.missingFields || 'Missing Fields',
                text2: t.enterEmailPassword || 'Please enter email and password',
            });
            return;
        }

        setIsLoading(true);
        try {
            const result = await login({ email, password });

            // Check if result contains monastery information
            if (typeof result === 'object' && result.success) {
                if (result.isMonastery) {
                    // Navigate to monastery dashboard
                    router.replace('/(monastery)/dashboard' as any);
                } else {
                    // Navigate to regular user home
                    router.replace('/' as any);
                }
            } else if (result === true) {
                // Fallback for boolean return (backward compatibility)
                router.replace('/' as any);
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: t.loginFailed || 'Login Failed',
                text2: error.message || (t.checkCredentials || 'Please check your credentials'),
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
                    {/* Language Selector Button */}
                    <TouchableOpacity
                        style={styles.languageButton}
                        onPress={() => setShowLanguageModal(true)}
                    >
                        <IconSymbol name="globe" size={20} color={tint as string} />
                        <Text style={[styles.languageButtonText, { color: tint }]}>
                            {SUPPORTED_LANGUAGES.find(l => l.code === language)?.nativeName || 'English'}
                        </Text>
                        <IconSymbol name="chevron.down" size={16} color={muted as string} />
                    </TouchableOpacity>

                    <Text style={[styles.title, { color: text }]}>{t.welcomeBack || 'Welcome Back'}</Text>
                    <Text style={[styles.subtitle, { color: muted }]}>{t.signInToContinue || 'Sign in to continue'}</Text>

                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: text }]}>{t.email || 'Email'}</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                placeholder={t.enterEmail || 'Enter your email'}
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
                            <Text style={[styles.label, { color: text }]}>{t.password || 'Password'}</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                placeholder={t.enterPassword || 'Enter your password'}
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
                                {isLoading ? (t.signingIn || 'Signing In...') : (t.signIn || 'Sign In')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.push('/register' as any)}
                            disabled={isLoading}>
                            <Text style={[styles.linkText, { color: muted }]}>
                                {t.noAccount || "Don't have an account?"} <Text style={[styles.linkBold, { color: tint }]}>{t.signUp || 'Sign Up'}</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Language Selection Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={showLanguageModal}
                    onRequestClose={() => setShowLanguageModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: card }]}>
                            <View style={[styles.modalHeader, { borderBottomColor: muted + '40' }]}>
                                <TouchableOpacity onPress={() => setShowLanguageModal(false)} style={{ marginRight: 12 }}>
                                    <IconSymbol name="chevron.left" size={24} color={muted as string} />
                                </TouchableOpacity>
                                <Text style={[styles.modalTitle, { color: text }]}>{t.selectLanguage || 'Select Language'}</Text>
                                <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                                    <IconSymbol name="xmark" size={24} color={muted as string} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={styles.languageList}>
                                {SUPPORTED_LANGUAGES.map((lang) => (
                                    <TouchableOpacity
                                        key={lang.code}
                                        style={[
                                            styles.languageItem,
                                            { borderBottomColor: muted + '20' },
                                            language === lang.code && [styles.languageItemSelected, { backgroundColor: tint + '15' }]
                                        ]}
                                        onPress={() => {
                                            setLanguage(lang.code);
                                            setShowLanguageModal(false);
                                        }}
                                    >
                                        <View>
                                            <Text style={[styles.languageNativeName, { color: text }]}>{lang.nativeName}</Text>
                                            <Text style={[styles.languageEnglishName, { color: muted }]}>{lang.name}</Text>
                                        </View>
                                        {language === lang.code && (
                                            <IconSymbol name="checkmark" size={24} color={tint as string} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
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
    linkText: {
        textAlign: 'center',
        marginTop: 24,
        fontSize: 14,
    },
    linkBold: {
        fontWeight: '600',
    },
    languageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    languageButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    languageList: {
        maxHeight: 400,
    },
    languageItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    languageItemSelected: {
        borderLeftWidth: 3,
    },
    languageNativeName: {
        fontSize: 16,
        fontWeight: '600',
    },
    languageEnglishName: {
        fontSize: 13,
        marginTop: 2,
    },
});
