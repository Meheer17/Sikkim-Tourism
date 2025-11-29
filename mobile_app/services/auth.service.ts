import { ApiResponse, LoginRequest, RegisterRequest, AuthResponse, User } from '../types/api.types';
import { apiClient } from './api.client';
import { SecureStorage, TokenManager } from '../utils/storage';
import { AuthUtils } from '../utils/auth';
import { config } from '../config/api.config';

export class AuthService {
    /**
     * Login user with email and password
     */
    async login(request: LoginRequest): Promise<ApiResponse<AuthResponse>> {
        try {
            // Validate password using AuthUtils
            const passwordValidation = AuthUtils.validatePassword(request.password);
            if (!passwordValidation.isValid) {
                return {
                    success: false,
                    message: 'Password validation failed',
                    errors: passwordValidation.errors,
                };
            }

            const response = await apiClient.post<AuthResponse>(config.routes.auth.login, request);

            if (response.success && response.data) {
                const { user, tokens } = response.data;

                // Save user data and tokens
                await AuthUtils.saveUser(user);
                await TokenManager.saveTokens(tokens.accessToken, tokens.refreshToken);
            }

            return response;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Register new user
     */
    async register(request: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
        try {
            // Validate password using AuthUtils
            const passwordValidation = AuthUtils.validatePassword(request.password);
            if (!passwordValidation.isValid) {
                return {
                    success: false,
                    message: 'Password validation failed',
                    errors: passwordValidation.errors,
                };
            }

            // Check if passwords match
            if (request.password !== request.confirmPassword) {
                return {
                    success: false,
                    message: 'Passwords do not match',
                    errors: ['Password and confirm password must match'],
                };
            }

            const response = await apiClient.post<AuthResponse>(config.routes.auth.register, request);

            if (response.success && response.data) {
                const { user, tokens } = response.data;

                // Save user data and tokens
                await AuthUtils.saveUser(user);
                await TokenManager.saveTokens(tokens.accessToken, tokens.refreshToken);
            }

            return response;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    /**
     * Logout user
     */
    async logout(): Promise<ApiResponse<void>> {
        try {
            // Skip API call if backend is not available (development mode)
            if (!__DEV__) {
                // Call logout endpoint
                await apiClient.post(config.routes.auth.logout);
            }

            // Clear local storage
            await AuthUtils.clearAuthData();

            return {
                success: true,
                message: 'Logged out successfully',
            };
        } catch (error) {
            console.error('Logout error:', error);
            // Even if API call fails, clear local data
            await AuthUtils.clearAuthData();
            throw error;
        }
    }

    /**
     * Get current user profile
     */
    async getProfile(): Promise<ApiResponse<User>> {
        try {
            const response = await apiClient.get<User>(config.routes.auth.profile);

            if (response.success && response.data) {
                await AuthUtils.saveUser(response.data);
            }

            return response;
        } catch (error) {
            console.error('Get profile error:', error);
            throw error;
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
        try {
            const response = await apiClient.put<User>(config.routes.auth.profile, data);

            if (response.success && response.data) {
                await AuthUtils.saveUser(response.data);
            }

            return response;
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }

    /**
     * Change password
     */
    async changePassword(data: {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
    }): Promise<ApiResponse<void>> {
        return apiClient.post(config.routes.auth.changePassword, data);
    }

    /**
     * Request password reset
     */
    async requestPasswordReset(email: string): Promise<ApiResponse<void>> {
        return apiClient.post(config.routes.auth.forgotPassword, { email });
    }

    /**
     * Reset password with token
     */
    async resetPassword(data: {
        token: string;
        newPassword: string;
        confirmPassword: string;
    }): Promise<ApiResponse<void>> {
        return apiClient.post(config.routes.auth.resetPassword, data);
    }

    /**
     * Verify email address
     */
    async verifyEmail(token: string): Promise<ApiResponse<void>> {
        return apiClient.post(config.routes.auth.verifyEmail, { token });
    }

    /**
     * Resend email verification
     */
    async resendEmailVerification(): Promise<ApiResponse<void>> {
        return apiClient.post(config.routes.auth.resendVerification);
    }

    /**
     * Check if user is authenticated locally
     */
    async isAuthenticated(): Promise<boolean> {
        return await AuthUtils.isAuthenticated();
    }

    /**
     * Get current user from local storage
     */
    async getCurrentUser(): Promise<User | null> {
        return await AuthUtils.getUser();
    }

    /**
     * Delete user account
     */
    async deleteAccount(password: string): Promise<ApiResponse<void>> {
        try {
            const response = await apiClient.delete('/auth/account', {
                data: { password },
            });

            // Clear local data after successful account deletion
            if (response.success) {
                await AuthUtils.clearAuthData();
            }

            return response;
        } catch (error) {
            console.error('Delete account error:', error);
            throw error;
        }
    }

    /**
     * Enable two-factor authentication
     */
    async enableTwoFactor(): Promise<ApiResponse<{ qrCode: string; backupCodes: string[] }>> {
        return apiClient.post(config.routes.auth.twoFactor.enable);
    }

    /**
     * Verify two-factor authentication
     */
    async verifyTwoFactor(code: string): Promise<ApiResponse<void>> {
        return apiClient.post(config.routes.auth.twoFactor.verify, { code });
    }

    /**
     * Disable two-factor authentication
     */
    async disableTwoFactor(code: string): Promise<ApiResponse<void>> {
        return apiClient.post(config.routes.auth.twoFactor.disable, { code });
    }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;