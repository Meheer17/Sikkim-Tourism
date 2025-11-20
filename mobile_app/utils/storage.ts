import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { config } from '../config/api.config';

// Secure storage for sensitive data (tokens, credentials)
export class SecureStorage {
    private static isWeb = Platform.OS === 'web';

    static async setItem(key: string, value: string): Promise<void> {
        try {
            if (this.isWeb) {
                // Fallback to localStorage for web
                localStorage.setItem(key, value);
            } else {
                await SecureStore.setItemAsync(key, value);
            }
        } catch (error) {
            console.error('SecureStorage setItem error:', error);
            throw error;
        }
    }

    static async getItem(key: string): Promise<string | null> {
        try {
            if (this.isWeb) {
                return localStorage.getItem(key);
            } else {
                return await SecureStore.getItemAsync(key);
            }
        } catch (error) {
            console.error('SecureStorage getItem error:', error);
            return null;
        }
    }

    static async removeItem(key: string): Promise<void> {
        try {
            if (this.isWeb) {
                localStorage.removeItem(key);
            } else {
                await SecureStore.deleteItemAsync(key);
            }
        } catch (error) {
            console.error('SecureStorage removeItem error:', error);
            throw error;
        }
    }

    static async clear(): Promise<void> {
        try {
            await SecureStorage.removeItem(config.auth.userKey);
        } catch (error) {
            console.error('SecureStorage clear error:', error);
            throw error;
        }
    }
}

// Token Manager for handling JWT tokens
export class TokenManager {
    private static readonly ACCESS_TOKEN_KEY = 'access_token';
    private static readonly REFRESH_TOKEN_KEY = 'refresh_token';

    static async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
        try {
            await SecureStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
            await SecureStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
        } catch (error) {
            console.error('TokenManager saveTokens error:', error);
            throw error;
        }
    }

    static async getAccessToken(): Promise<string | null> {
        try {
            return await SecureStorage.getItem(this.ACCESS_TOKEN_KEY);
        } catch (error) {
            console.error('TokenManager getAccessToken error:', error);
            return null;
        }
    }

    static async getRefreshToken(): Promise<string | null> {
        try {
            return await SecureStorage.getItem(this.REFRESH_TOKEN_KEY);
        } catch (error) {
            console.error('TokenManager getRefreshToken error:', error);
            return null;
        }
    }

    static async removeTokens(): Promise<void> {
        try {
            await SecureStorage.removeItem(this.ACCESS_TOKEN_KEY);
            await SecureStorage.removeItem(this.REFRESH_TOKEN_KEY);
        } catch (error) {
            console.error('TokenManager removeTokens error:', error);
            throw error;
        }
    }

    static async hasValidAccessToken(): Promise<boolean> {
        try {
            const token = await this.getAccessToken();
            if (!token) return false;

            // Import AuthUtils for token validation
            const { AuthUtils } = await import('./auth');
            return !AuthUtils.isTokenExpired(token);
        } catch (error) {
            return false;
        }
    }
}

// Regular storage for non-sensitive data (also using SecureStore for better security)
export class AppStorage {
    private static isWeb = Platform.OS === 'web';

    static async setItem(key: string, value: any): Promise<void> {
        try {
            const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
            if (this.isWeb) {
                sessionStorage.setItem(key, serializedValue);
            } else {
                await SecureStore.setItemAsync(key, serializedValue);
            }
        } catch (error) {
            console.error('AppStorage setItem error:', error);
            throw error;
        }
    }

    static async getItem<T = string>(key: string, defaultValue?: T): Promise<T | null> {
        try {
            let value: string | null;
            if (this.isWeb) {
                value = sessionStorage.getItem(key);
            } else {
                value = await SecureStore.getItemAsync(key);
            }

            if (value === null || value === undefined) {
                return defaultValue || null;
            }

            // Try to parse as JSON, fallback to string
            try {
                return JSON.parse(value);
            } catch {
                return value as T;
            }
        } catch (error) {
            console.error('AppStorage getItem error:', error);
            return defaultValue || null;
        }
    }

    static async removeItem(key: string): Promise<void> {
        try {
            if (this.isWeb) {
                sessionStorage.removeItem(key);
            } else {
                await SecureStore.deleteItemAsync(key);
            }
        } catch (error) {
            console.error('AppStorage removeItem error:', error);
            throw error;
        }
    }

    static async clear(): Promise<void> {
        try {
            if (this.isWeb) {
                sessionStorage.clear();
            } else {
                // For mobile, we need to track keys separately or clear specific known keys
                console.warn('Clear all not supported on native. Clear specific keys instead.');
            }
        } catch (error) {
            console.error('AppStorage clear error:', error);
            throw error;
        }
    }

    static async getAllKeys(): Promise<string[]> {
        try {
            if (this.isWeb) {
                return Object.keys(sessionStorage);
            } else {
                // SecureStore doesn't provide a way to list all keys
                console.warn('getAllKeys not supported on native SecureStore');
                return [];
            }
        } catch (error) {
            console.error('AppStorage getAllKeys error:', error);
            return [];
        }
    }
}