import { Platform } from 'react-native';
import Constants from 'expo-constants';

interface ApiConfig {
    baseURL: string;
    timeout: number;
    enableLogs: boolean;
    retryAttempts: number;
    retryDelay: number;
}

interface ApiRoutes {
    auth: {
        login: string;
        register: string;
        logout: string;
        refresh: string;
        profile: string;
        changePassword: string;
        forgotPassword: string;
        resetPassword: string;
        verifyEmail: string;
        resendVerification: string;
        twoFactor: {
            enable: string;
            verify: string;
            disable: string;
        };
    };
    files: {
        upload: string;
        uploadMultiple: string;
        get: string;
        list: string;
        delete: string;
        batchDelete: string;
        updateMetadata: string;
        downloadUrl: string;
        thumbnail: string;
    };
}

interface AppConfig {
    api: ApiConfig;
    routes: ApiRoutes;
    auth: {
        userKey: string;
        biometricEnabled: boolean;
    };
    upload: {
        maxFileSize: number;
        allowedImageFormats: string[];
        allowedDocumentFormats: string[];
    };
}

const isDevelopment = __DEV__;

// Get environment variables with fallbacks
const getEnvVar = (key: string, fallback: string): string => {
    return Constants.expoConfig?.extra?.[key] || process.env[key] || fallback;
};

export const config: AppConfig = {
    api: {
        baseURL: getEnvVar('API_BASE_URL', isDevelopment ? 'http://localhost:3000/v1' : 'https://api.yourdomain.com/v1'),
        timeout: parseInt(getEnvVar('API_TIMEOUT', '10000'), 10),
        enableLogs: getEnvVar('DEBUG_API_LOGS', isDevelopment.toString()) === 'true',
        retryAttempts: 3,
        retryDelay: 1000,
    },
    routes: {
        auth: {
            login: '/auth/login',
            register: '/auth/register',
            logout: '/auth/logout',
            refresh: '/auth/refresh',
            profile: '/auth/profile',
            changePassword: '/auth/change-password',
            forgotPassword: '/auth/forgot-password',
            resetPassword: '/auth/reset-password',
            verifyEmail: '/auth/verify-email',
            resendVerification: '/auth/resend-verification',
            twoFactor: {
                enable: '/auth/2fa/enable',
                verify: '/auth/2fa/verify',
                disable: '/auth/2fa/disable',
            },
        },
        files: {
            upload: '/files/upload',
            uploadMultiple: '/files/upload/multiple',
            get: '/files',
            list: '/files',
            delete: '/files',
            batchDelete: '/files/batch',
            updateMetadata: '/files',
            downloadUrl: '/files/:id/download-url',
            thumbnail: '/files/:id/thumbnail',
        },
    },
    auth: {
        userKey: 'user_data',
        biometricEnabled: getEnvVar('ENABLE_BIOMETRIC_AUTH', 'true') === 'true',
    },
    upload: {
        maxFileSize: parseInt(getEnvVar('MAX_FILE_SIZE', '10485760'), 10), // 10MB
        allowedImageFormats: getEnvVar('ALLOWED_IMAGE_FORMATS', 'jpg,jpeg,png,gif,webp').split(','),
        allowedDocumentFormats: getEnvVar('ALLOWED_DOCUMENT_FORMATS', 'pdf,doc,docx,txt').split(','),
    },
};

// Platform-specific configurations
export const platformConfig = {
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
    isWeb: Platform.OS === 'web',
    hasNotch: Platform.OS === 'ios' && (Platform as any).isPad === false,
};

export default config;