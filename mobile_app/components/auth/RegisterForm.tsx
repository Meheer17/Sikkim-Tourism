import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../hooks/useAuth';
import { registerSchema, RegisterFormData } from '../../utils/validation';

interface RegisterFormProps {
    onSuccess: () => void;
    onNavigateToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
    onSuccess,
    onNavigateToLogin,
}) => {
    const { register } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState<string>('');

    const {
        control,
        handleSubmit,
        formState: { errors },
        setError,
        watch,
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            email: '',
            password: '',
            confirmPassword: '',
            firstName: '',
            lastName: '',
            phone: '',
        },
    });

    const password = watch('password');

    // Calculate password strength
    React.useEffect(() => {
        if (!password) {
            setPasswordStrength('');
            return;
        }

        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;

        if (strength <= 2) setPasswordStrength('Weak');
        else if (strength <= 3) setPasswordStrength('Fair');
        else if (strength <= 4) setPasswordStrength('Good');
        else setPasswordStrength('Strong');
    }, [password]);

    const onSubmit = async (data: RegisterFormData) => {
        try {
            setIsSubmitting(true);
            const payload = {
                name: `${data.firstName} ${data.lastName}`.trim(),
                address: '',
                gender: undefined,
                email: data.email,
                password: data.password,
                confirmPassword: data.confirmPassword,
            };
            const success = await register(payload);

            if (success) {
                onSuccess();
            } else {
                setError('root', {
                    message: 'Registration failed. Please try again.',
                });
            }
        } catch (error: any) {
            setError('root', {
                message: error.message || 'An unexpected error occurred',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getPasswordStrengthColor = () => {
        switch (passwordStrength) {
            case 'Weak':
                return '#FF3B30';
            case 'Fair':
                return '#FF9500';
            case 'Good':
                return '#34C759';
            case 'Strong':
                return '#007AFF';
            default:
                return '#E0E0E0';
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled">
                <View style={styles.content}>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Sign up to get started</Text>

                    <View style={styles.form}>
                        {/* Name Row */}
                        <View style={styles.row}>
                            <View style={[styles.inputContainer, styles.halfWidth]}>
                                <Text style={styles.label}>First Name*</Text>
                                <Controller
                                    control={control}
                                    name="firstName"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput
                                            style={[styles.input, errors.firstName && styles.inputError]}
                                            placeholder="John"
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            autoCapitalize="words"
                                            editable={!isSubmitting}
                                        />
                                    )}
                                />
                                {errors.firstName && (
                                    <Text style={styles.errorText}>{errors.firstName.message}</Text>
                                )}
                            </View>

                            <View style={[styles.inputContainer, styles.halfWidth]}>
                                <Text style={styles.label}>Last Name*</Text>
                                <Controller
                                    control={control}
                                    name="lastName"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput
                                            style={[styles.input, errors.lastName && styles.inputError]}
                                            placeholder="Doe"
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            autoCapitalize="words"
                                            editable={!isSubmitting}
                                        />
                                    )}
                                />
                                {errors.lastName && (
                                    <Text style={styles.errorText}>{errors.lastName.message}</Text>
                                )}
                            </View>
                        </View>

                        {/* Email */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email*</Text>
                            <Controller
                                control={control}
                                name="email"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput
                                        style={[styles.input, errors.email && styles.inputError]}
                                        placeholder="john.doe@example.com"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                        editable={!isSubmitting}
                                    />
                                )}
                            />
                            {errors.email && (
                                <Text style={styles.errorText}>{errors.email.message}</Text>
                            )}
                        </View>

                        {/* Phone */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Phone (Optional)</Text>
                            <Controller
                                control={control}
                                name="phone"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput
                                        style={styles.input}
                                        placeholder="+1 234 567 8900"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        keyboardType="phone-pad"
                                        editable={!isSubmitting}
                                    />
                                )}
                            />
                        </View>

                        {/* Password */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Password*</Text>
                            <Controller
                                control={control}
                                name="password"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput
                                        style={[styles.input, errors.password && styles.inputError]}
                                        placeholder="Enter password"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        secureTextEntry
                                        autoCapitalize="none"
                                        editable={!isSubmitting}
                                    />
                                )}
                            />
                            {passwordStrength && (
                                <View style={styles.strengthContainer}>
                                    <View style={styles.strengthBar}>
                                        <View
                                            style={[
                                                styles.strengthFill,
                                                {
                                                    width:
                                                        passwordStrength === 'Weak'
                                                            ? '25%'
                                                            : passwordStrength === 'Fair'
                                                                ? '50%'
                                                                : passwordStrength === 'Good'
                                                                    ? '75%'
                                                                    : '100%',
                                                    backgroundColor: getPasswordStrengthColor(),
                                                },
                                            ]}
                                        />
                                    </View>
                                    <Text
                                        style={[
                                            styles.strengthText,
                                            { color: getPasswordStrengthColor() },
                                        ]}>
                                        {passwordStrength}
                                    </Text>
                                </View>
                            )}
                            {errors.password && (
                                <Text style={styles.errorText}>{errors.password.message}</Text>
                            )}
                        </View>

                        {/* Confirm Password */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Confirm Password*</Text>
                            <Controller
                                control={control}
                                name="confirmPassword"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput
                                        style={[styles.input, errors.confirmPassword && styles.inputError]}
                                        placeholder="Re-enter password"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        secureTextEntry
                                        autoCapitalize="none"
                                        editable={!isSubmitting}
                                    />
                                )}
                            />
                            {errors.confirmPassword && (
                                <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
                            )}
                        </View>

                        {/* Root Error */}
                        {errors.root && (
                            <Text style={styles.errorText}>{errors.root.message}</Text>
                        )}

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.button, isSubmitting && styles.buttonDisabled]}
                            onPress={handleSubmit(onSubmit)}
                            disabled={isSubmitting}>
                            {isSubmitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Create Account</Text>
                            )}
                        </TouchableOpacity>

                        {/* Navigate to Login */}
                        <TouchableOpacity
                            onPress={onNavigateToLogin}
                            disabled={isSubmitting}
                            style={styles.linkContainer}>
                            <Text style={styles.linkText}>
                                Already have an account?{' '}
                                <Text style={styles.linkBold}>Sign In</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

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
    inputError: {
        borderColor: '#FF3B30',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: 4,
    },
    strengthContainer: {
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    strengthBar: {
        flex: 1,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        overflow: 'hidden',
    },
    strengthFill: {
        height: '100%',
        borderRadius: 2,
    },
    strengthText: {
        fontSize: 12,
        fontWeight: '600',
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
    linkContainer: {
        marginTop: 24,
    },
    linkText: {
        textAlign: 'center',
        color: '#666',
        fontSize: 14,
    },
    linkBold: {
        color: '#007AFF',
        fontWeight: '600',
    },
});
