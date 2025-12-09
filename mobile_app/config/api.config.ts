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
    const fromExtra = Constants.expoConfig?.extra?.[key];
    const fromProcessEnv = process.env[key];
    
    console.log(`🔍 [api.config] Getting ${key}:`, {
        fromExtra,
        fromProcessEnv,
        fallback,
        willUse: fromExtra || fromProcessEnv || fallback
    });
    
    return fromExtra || fromProcessEnv || fallback;
};

// Get the correct base URL for different platforms
const getBaseURL = (): string => {

    const url = getEnvVar('API_BASE_URL', Platform.OS === 'android' ? 'http://10.233.208.103:8000/api/v1' : 'http://localhost:8000/api/v1');
    console.log('🌐 [api.config] Final baseURL:', url);
    return url;
};

export const config: AppConfig = {
    api: {
        baseURL: getBaseURL(),
        timeout: parseInt(getEnvVar('API_TIMEOUT', '10000'), 10),
        enableLogs: getEnvVar('DEBUG_API_LOGS', isDevelopment.toString()) === 'true',
        retryAttempts: 3,
        retryDelay: 1000,
    },
    routes: {
        auth: {
            login: '/auth/signin',
            register: '/auth/signup',
            logout: '/auth/logout',
            refresh: '/auth/refresh',
            profile: '/profile/me',
            changePassword: '/auth/change-password',
            forgotPassword: '/auth/forgetpassword',
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

export const platformConfig = {
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
    isWeb: Platform.OS === 'web',
    hasNotch: Platform.OS === 'ios' && (Platform as any).isPad === false,
};

// Debug: Log the final configuration
console.log('📦 [api.config] Final API configuration loaded:', {
    baseURL: config.api.baseURL,
    timeout: config.api.timeout,
    enableLogs: config.api.enableLogs,
    platform: Platform.OS,
});

if (isDevelopment) {
    console.log('🌐 API Base URL:', config.api.baseURL);
    console.log('📱 Platform:', Platform.OS);
    if (Platform.OS === 'android') {
        console.log('💡 Android Emulator: Using 10.135.160.71 to access host machine');
        console.log('💡 Physical Device: Set API_BASE_URL env to your machine\'s IP (e.g., http://192.168.1.x:8000/api/v1)');
    }
}

export default config;