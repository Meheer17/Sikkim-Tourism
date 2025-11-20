import { useState, useEffect, useCallback } from 'react';
import { User, LoginRequest, RegisterRequest } from '../types/api.types';
import { authService } from '../services/auth.service';
import { AuthUtils } from '../utils/auth';
import Toast from 'react-native-toast-message';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;
}

interface AuthActions {
    login: (credentials: LoginRequest) => Promise<boolean>;
    register: (userData: RegisterRequest) => Promise<boolean>;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<boolean>;
    changePassword: (data: {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
    }) => Promise<boolean>;
    clearError: () => void;
}

export const useAuth = (): AuthState & AuthActions => {
    const [state, setState] = useState<AuthState>({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        error: null,
    });

    // Initialize auth state
    useEffect(() => {
        initializeAuth();
    }, []);

    const initializeAuth = useCallback(async () => {
        try {
            setState(prev => ({ ...prev, isLoading: true }));

            const isAuthenticated = await authService.isAuthenticated();

            if (isAuthenticated) {
                const user = await authService.getCurrentUser();
                setState({
                    user,
                    isLoading: false,
                    isAuthenticated: true,
                    error: null,
                });

                // Optionally refresh profile from server
                try {
                    await refreshProfile();
                } catch (error) {
                    // Silently fail - we already have cached user data
                    console.warn('Failed to refresh profile:', error);
                }
            } else {
                setState({
                    user: null,
                    isLoading: false,
                    isAuthenticated: false,
                    error: null,
                });
            }
        } catch (error) {
            console.error('Auth initialization error:', error);
            setState({
                user: null,
                isLoading: false,
                isAuthenticated: false,
                error: 'Failed to initialize authentication',
            });
        }
    }, []);

    const login = useCallback(async (credentials: LoginRequest): Promise<boolean> => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));

            const response = await authService.login(credentials);

            if (response.success && response.data) {
                const { user } = response.data;
                setState({
                    user,
                    isLoading: false,
                    isAuthenticated: true,
                    error: null,
                });

                Toast.show({
                    type: 'success',
                    text1: 'Welcome back!',
                    text2: `Hello ${user.firstName}, you're now logged in.`,
                });

                return true;
            } else {
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: response.message || 'Login failed',
                }));

                Toast.show({
                    type: 'error',
                    text1: 'Login Failed',
                    text2: response.message || 'Please check your credentials and try again.',
                });

                return false;
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Login failed';
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));

            Toast.show({
                type: 'error',
                text1: 'Login Error',
                text2: errorMessage,
            });

            return false;
        }
    }, []);

    const register = useCallback(async (userData: RegisterRequest): Promise<boolean> => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));

            const response = await authService.register(userData);

            if (response.success && response.data) {
                const { user } = response.data;
                setState({
                    user,
                    isLoading: false,
                    isAuthenticated: true,
                    error: null,
                });

                Toast.show({
                    type: 'success',
                    text1: 'Account Created',
                    text2: `Welcome ${user.firstName}! Your account has been created successfully.`,
                });

                return true;
            } else {
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: response.message || 'Registration failed',
                }));

                Toast.show({
                    type: 'error',
                    text1: 'Registration Failed',
                    text2: response.message || 'Please try again.',
                });

                return false;
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));

            Toast.show({
                type: 'error',
                text1: 'Registration Error',
                text2: errorMessage,
            });

            return false;
        }
    }, []);

    const logout = useCallback(async (): Promise<void> => {
        try {
            setState(prev => ({ ...prev, isLoading: true }));

            await authService.logout();

            setState({
                user: null,
                isLoading: false,
                isAuthenticated: false,
                error: null,
            });

            Toast.show({
                type: 'success',
                text1: 'Logged Out',
                text2: 'You have been successfully logged out.',
            });
        } catch (error: any) {
            console.error('Logout error:', error);
            // Even if logout fails on server, clear local state
            setState({
                user: null,
                isLoading: false,
                isAuthenticated: false,
                error: null,
            });
        }
    }, []);

    const refreshProfile = useCallback(async (): Promise<void> => {
        try {
            const response = await authService.getProfile();

            if (response.success && response.data) {
                setState(prev => ({
                    ...prev,
                    user: response.data!,
                    error: null,
                }));
            }
        } catch (error: any) {
            console.error('Refresh profile error:', error);
            // Don't update state on error to keep existing user data
        }
    }, []);

    const updateProfile = useCallback(async (data: Partial<User>): Promise<boolean> => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));

            const response = await authService.updateProfile(data);

            if (response.success && response.data) {
                setState(prev => ({
                    ...prev,
                    user: response.data!,
                    isLoading: false,
                    error: null,
                }));

                Toast.show({
                    type: 'success',
                    text1: 'Profile Updated',
                    text2: 'Your profile has been updated successfully.',
                });

                return true;
            } else {
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: response.message || 'Profile update failed',
                }));

                Toast.show({
                    type: 'error',
                    text1: 'Update Failed',
                    text2: response.message || 'Failed to update profile.',
                });

                return false;
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Profile update failed';
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));

            Toast.show({
                type: 'error',
                text1: 'Update Error',
                text2: errorMessage,
            });

            return false;
        }
    }, []);

    const changePassword = useCallback(async (data: {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
    }): Promise<boolean> => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));

            const response = await authService.changePassword(data);

            if (response.success) {
                setState(prev => ({ ...prev, isLoading: false, error: null }));

                Toast.show({
                    type: 'success',
                    text1: 'Password Changed',
                    text2: 'Your password has been updated successfully.',
                });

                return true;
            } else {
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: response.message || 'Password change failed',
                }));

                Toast.show({
                    type: 'error',
                    text1: 'Change Failed',
                    text2: response.message || 'Failed to change password.',
                });

                return false;
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Password change failed';
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));

            Toast.show({
                type: 'error',
                text1: 'Change Error',
                text2: errorMessage,
            });

            return false;
        }
    }, []);

    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    return {
        ...state,
        login,
        register,
        logout,
        refreshProfile,
        updateProfile,
        changePassword,
        clearError,
    };
};