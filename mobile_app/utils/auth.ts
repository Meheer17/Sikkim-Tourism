import { User } from '../types/api.types';
import { SecureStorage, TokenManager } from './storage';
import { config } from '../config/api.config';

export class AuthUtils {
    /**
     * Save user data to secure storage
     */
    static async saveUser(user: User): Promise<void> {
        try {
            await SecureStorage.setItem(config.auth.userKey, JSON.stringify(user));
        } catch (error) {
            console.error('Error saving user data:', error);
            throw error;
        }
    }

    /**
     * Get user data from secure storage
     */
    static async getUser(): Promise<User | null> {
        try {
            const userData = await SecureStorage.getItem(config.auth.userKey);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }

    /**
     * Clear all authentication data
     */
    static async clearAuthData(): Promise<void> {
        try {
            await SecureStorage.removeItem(config.auth.userKey);
            await TokenManager.removeTokens();
        } catch (error) {
            console.error('Error clearing auth data:', error);
            throw error;
        }
    }

    /**
     * Check if user is authenticated
     */
    static async isAuthenticated(): Promise<boolean> {
        try {
            const user = await this.getUser();
            return !!user;
        } catch (error) {
            console.error('Error checking authentication:', error);
            return false;
        }
    }

    /**
     * Decode JWT token (basic implementation)
     */
    static decodeToken(token: string): any {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Invalid token format');
            }

            const payload = parts[1];
            const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
            return decoded;
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }

    /**
     * Check if token is expired
     */
    static isTokenExpired(token: string): boolean {
        try {
            const decoded = this.decodeToken(token);
            if (!decoded || !decoded.exp) {
                return true;
            }

            const currentTime = Math.floor(Date.now() / 1000);
            return decoded.exp < currentTime;
        } catch (error) {
            console.error('Error checking token expiration:', error);
            return true;
        }
    }

    /**
     * Get token expiration time
     */
    static getTokenExpiration(token: string): Date | null {
        try {
            const decoded = this.decodeToken(token);
            if (!decoded || !decoded.exp) {
                return null;
            }

            return new Date(decoded.exp * 1000);
        } catch (error) {
            console.error('Error getting token expiration:', error);
            return null;
        }
    }

    /**
     * Validate email format
     */
    static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate password strength
     */
    static validatePassword(password: string): {
        isValid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }

        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }

        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }

        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Generate a random string for security purposes
     */
    static generateRandomString(length: number = 32): string {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    /**
     * Hash password using a simple implementation (use proper hashing in production)
     */
    static async hashPassword(password: string): Promise<string> {
        // This is a basic implementation. Use proper crypto libraries in production
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
}