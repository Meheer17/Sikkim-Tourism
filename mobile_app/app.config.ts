import { ExpoConfig, ConfigContext } from 'expo/config';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Debug: Log the loaded API_BASE_URL
console.log('🔧 [app.config.ts] Loading configuration...');
console.log('📍 API_BASE_URL from .env:', process.env.API_BASE_URL);

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: 'Tourist Mobile App',
    slug: 'tourist-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/favicon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
        supportsTablet: true,
        bundleIdentifier: 'com.yourdomain.tourist',
        infoPlist: {
            NSMotionUsageDescription: 'This app uses device motion to provide an immersive 360-degree experience.',
        },
    },
    android: {
        icon: './assets/images/favicon.png',
        adaptiveIcon: {
            foregroundImage: './assets/images/favicon.png',
            backgroundColor: '#ffffff',
        },
        package: 'com.yourdomain.tourist',
    },
    web: {
        bundler: 'metro',
        output: 'static',
        favicon: './assets/images/favicon.png',
    },
    plugins: [
        'expo-router',
        'expo-secure-store',
        'expo-audio',
        [
            'expo-document-picker',
            {
                iCloudContainerEnvironment: 'Production',
            },
        ],
        [
            'expo-image-picker',
            {
                photosPermission: 'The app accesses your photos to let you share them with the community.',
                cameraPermission: 'The app accesses your camera to let you take photos and share them with the community.',
            },
        ],
    ],
    experiments: {
        typedRoutes: true,
    },
    extra: {
        // Environment variables accessible in the app
        API_BASE_URL: process.env.API_BASE_URL || 'http://10.135.160.71:8000/api/v1',
        API_TIMEOUT: process.env.API_TIMEOUT || '30000',
        DEBUG_API_LOGS: process.env.DEBUG_API_LOGS || 'true',
        MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || '10485760',
        ALLOWED_IMAGE_FORMATS: process.env.ALLOWED_IMAGE_FORMATS || 'jpg,jpeg,png,gif,webp',
        ALLOWED_DOCUMENT_FORMATS: process.env.ALLOWED_DOCUMENT_FORMATS || 'pdf,doc,docx,txt',
        ENABLE_BIOMETRIC_AUTH: process.env.ENABLE_BIOMETRIC_AUTH || 'true',
        ENABLE_PUSH_NOTIFICATIONS: process.env.ENABLE_PUSH_NOTIFICATIONS || 'true',
        eas: {
            projectId: 'your-project-id-here',
        },
    },
});