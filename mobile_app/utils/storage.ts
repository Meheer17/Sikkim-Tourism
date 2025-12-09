import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { config } from '../config/api.config';

// Secure storage for sensitive data (tokens, credentials)
export class SecureStorage {
    private static isWeb = Platform.OS === 'web';
    private static useSecureStore = false; // Disabled due to keystore issues - use AsyncStorage instead

    static async setItem(key: string, value: string): Promise<void> {
        try {
            if (this.isWeb) {
                // Fallback to localStorage for web
                localStorage.setItem(key, value);
            } else {
                // Use AsyncStorage directly (SecureStore has keystore issues on some devices)
                await AsyncStorage.setItem(key, value);
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
                // Use AsyncStorage directly
                return await AsyncStorage.getItem(key);
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
                // Use AsyncStorage directly
                await AsyncStorage.removeItem(key);
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

    static async saveToken(accessToken: string, refreshToken?: string): Promise<void> {
        try {
            await SecureStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
            
            if (refreshToken) {
                await SecureStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
            }
            
            // Wait for AsyncStorage to persist (important for immediate reads)
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Verify token was saved
            let savedToken = await SecureStorage.getItem(this.ACCESS_TOKEN_KEY);
            
            // Retry if not found (AsyncStorage can be slow)
            if (!savedToken) {
                await new Promise(resolve => setTimeout(resolve, 300));
                savedToken = await SecureStorage.getItem(this.ACCESS_TOKEN_KEY);
            }
            
            if (__DEV__) {
                if (savedToken === accessToken) {
                    console.log('✅ Token saved and verified:', accessToken.substring(0, 20) + '...');
                } else {
                    console.warn('⚠️ Token saved but verification mismatch. Expected:', 
                        accessToken.substring(0, 20) + '...', 
                        'Got:', savedToken?.substring(0, 20) + '...');
                }
            }
        } catch (error) {
            console.error('❌ TokenManager saveToken error:', error);
            throw error;
        }
    }

    static async getAccessToken(): Promise<string | null> {
        try {
            let token = await SecureStorage.getItem(this.ACCESS_TOKEN_KEY);
            
            // Retry once if token not found (AsyncStorage can be slow)
            if (!token) {
                await new Promise(resolve => setTimeout(resolve, 100));
                token = await SecureStorage.getItem(this.ACCESS_TOKEN_KEY);
            }
            
            if (__DEV__ && !token) {
                console.warn('⚠️ No token found in storage');
            }
            return token;
        } catch (error) {
            console.error('❌ TokenManager getAccessToken error:', error);
            return null;
        }
    }

    static async getRefreshToken(): Promise<string | null> {
        try {
            return await SecureStorage.getItem(this.REFRESH_TOKEN_KEY);
        } catch (error) {
            console.error('❌ TokenManager getRefreshToken error:', error);
            return null;
        }
    }

    static async removeToken(): Promise<void> {
        try {
            await SecureStorage.removeItem(this.ACCESS_TOKEN_KEY);
            await SecureStorage.removeItem(this.REFRESH_TOKEN_KEY);
        } catch (error) {
            console.error('TokenManager removeToken error:', error);
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

// Regular storage for non-sensitive data (using AsyncStorage for persistence)
export class AppStorage {
    private static isWeb = Platform.OS === 'web';

    static async setItem(key: string, value: any): Promise<void> {
        try {
            const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
            if (this.isWeb) {
                // Use localStorage instead of sessionStorage for persistence across sessions
                localStorage.setItem(key, serializedValue);
            } else {
                // Use AsyncStorage for non-sensitive data (avoids SecureStore encryption issues)
                await AsyncStorage.setItem(key, serializedValue);
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
                // Use localStorage instead of sessionStorage for persistence across sessions
                value = localStorage.getItem(key);
            } else {
                // Use AsyncStorage for non-sensitive data
                value = await AsyncStorage.getItem(key);
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
                // Use localStorage instead of sessionStorage for persistence across sessions
                localStorage.removeItem(key);
            } else {
                // Use AsyncStorage for non-sensitive data
                await AsyncStorage.removeItem(key);
            }
        } catch (error) {
            console.error('AppStorage removeItem error:', error);
            throw error;
        }
    }

    static async clear(): Promise<void> {
        try {
            if (this.isWeb) {
                // Use localStorage instead of sessionStorage for persistence across sessions
                localStorage.clear();
            } else {
                // Clear all AsyncStorage
                await AsyncStorage.clear();
            }
        } catch (error) {
            console.error('AppStorage clear error:', error);
            throw error;
        }
    }

    static async getAllKeys(): Promise<string[]> {
        try {
            if (this.isWeb) {
                // Use localStorage instead of sessionStorage for persistence across sessions
                return Object.keys(localStorage);
            } else {
                // Get all keys from AsyncStorage
                return await AsyncStorage.getAllKeys() as string[];
            }
        } catch (error) {
            console.error('AppStorage getAllKeys error:', error);
            return [];
        }
    }
}