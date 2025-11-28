import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiResponse, ApiError } from '../types/api.types';
import { AuthUtils } from '../utils/auth';
import { config as appConfig } from '../config/api.config';
import Toast from 'react-native-toast-message';

class ApiClient {
    private client: AxiosInstance;
    private isRefreshing: boolean = false;
    private failedQueue: Array<{
        resolve: (value?: any) => void;
        reject: (reason?: any) => void;
    }> = [];

    constructor() {
        this.client = axios.create({
            baseURL: appConfig.api.baseURL,
            timeout: appConfig.api.timeout,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    private setupInterceptors(): void {
        // Request interceptor
        this.client.interceptors.request.use(
            async (config: any) => {
                // Add access token to headers
                const { TokenManager } = await import('../utils/storage');
                const accessToken = await TokenManager.getAccessToken();
                if (accessToken) {
                    config.headers.Authorization = `Bearer ${accessToken}`;
                }

                // Log requests in development
                if (__DEV__ && appConfig.api.enableLogs) {
                    console.log('🚀 API Request:', {
                        method: config.method?.toUpperCase(),
                        url: config.url,
                        data: config.data,
                        headers: config.headers,
                    });
                }

                return config;
            },
            (error: AxiosError) => {
                console.error('❌ Request Error:', error);
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.client.interceptors.response.use(
            (response: AxiosResponse) => {
                // Log responses in development
                if (__DEV__ && appConfig.api.enableLogs) {
                    console.log('✅ API Response:', {
                        status: response.status,
                        url: response.config.url,
                        data: response.data,
                    });
                }

                return response;
            },
            async (error: AxiosError) => {
                const originalRequest: any = error.config;

                // Handle 401 errors with refresh token retry
                if (error.response?.status === 401 && !originalRequest._retry) {
                    if (this.isRefreshing) {
                        // Wait for the refresh to complete
                        return new Promise((resolve, reject) => {
                            this.failedQueue.push({ resolve, reject });
                        })
                            .then(() => {
                                return this.client(originalRequest);
                            })
                            .catch((err) => {
                                return Promise.reject(err);
                            });
                    }

                    originalRequest._retry = true;
                    this.isRefreshing = true;

                    try {
                        const { TokenManager } = await import('../utils/storage');
                        const refreshToken = await TokenManager.getRefreshToken();

                        if (!refreshToken) {
                            throw new Error('No refresh token available');
                        }

                        // Try to refresh the token
                        const response = await this.client.post(appConfig.routes.auth.refresh, {
                            refreshToken,
                        });

                        if (response.data.success && response.data.data) {
                            const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;

                            // Save new tokens
                            await TokenManager.saveTokens(accessToken, newRefreshToken);

                            // Process failed queue
                            this.processQueue(null);

                            // Retry the original request with new token
                            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                            return this.client(originalRequest);
                        } else {
                            throw new Error('Token refresh failed');
                        }
                    } catch (refreshError) {
                        // Refresh failed, clear auth data and logout
                        this.processQueue(refreshError);
                        await AuthUtils.clearAuthData();
                        this.handleLogout();
                        return Promise.reject(refreshError);
                    } finally {
                        this.isRefreshing = false;
                    }
                }

                // Handle other errors
                this.handleError(error);
                return Promise.reject(error);
            }
        );
    }

    private handleError(error: AxiosError): void {
        const apiError: ApiError = {
            code: error.code || 'UNKNOWN_ERROR',
            message: error.message || 'An unexpected error occurred',
            details: (error.response?.data && typeof error.response.data === 'object' && !Array.isArray(error.response.data))
                ? error.response.data as Record<string, any>
                : undefined,
            timestamp: new Date().toISOString(),
            path: error.config?.url || '',
        };

        // Don't log network errors in development mode (backend not running)
        if (__DEV__ && (error.code === 'ERR_NETWORK' || error.message === 'Network Error')) {
            console.warn('⚠️ Network error detected - Backend API may not be running');
            return;
        }

        // Log other errors
        console.error('❌ API Error:', apiError);

        // Don't show toast for network errors in development mode
        if (__DEV__ && (error.code === 'ERR_NETWORK' || error.message === 'Network Error')) {
            console.warn('⚠️ Network error detected - Backend API may not be running');
            return;
        }

        // Show user-friendly error messages
        if (error.response?.status === 404) {
            Toast.show({
                type: 'error',
                text1: 'Not Found',
                text2: 'The requested resource was not found.',
            });
        } else if (error.response?.status === 500) {
            Toast.show({
                type: 'error',
                text1: 'Server Error',
                text2: 'Something went wrong on our end. Please try again later.',
            });
        } else if (error.code === 'ECONNABORTED') {
            Toast.show({
                type: 'error',
                text1: 'Request Timeout',
                text2: 'The request took too long. Please check your connection.',
            });
        } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
            Toast.show({
                type: 'error',
                text1: 'Connection Error',
                text2: 'Unable to connect to the server. Please check your internet connection.',
            });
        }
    }

    private handleLogout(): void {
        // Emit logout event or navigate to login screen
        // You can implement your navigation logic here
        console.log('User logged out due to authentication error');
    }

    private processQueue(error: any): void {
        this.failedQueue.forEach((promise) => {
            if (error) {
                promise.reject(error);
            } else {
                promise.resolve();
            }
        });
        this.failedQueue = [];
    }

    // HTTP Methods
    async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const response = await this.client.get(url, config);
        return response.data;
    }

    async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const response = await this.client.post(url, data, config);
        return response.data;
    }

    async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const response = await this.client.put(url, data, config);
        return response.data;
    }

    async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const response = await this.client.patch(url, data, config);
        return response.data;
    }

    async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const response = await this.client.delete(url, config);
        return response.data;
    }

    // File upload method
    async uploadFile<T = any>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const uploadConfig: AxiosRequestConfig = {
            ...config,
            headers: {
                ...config?.headers,
                'Content-Type': 'multipart/form-data',
            },
        };

        const response = await this.client.post(url, formData, uploadConfig);
        return response.data;
    }

    // Get raw axios instance for custom requests
    getAxiosInstance(): AxiosInstance {
        return this.client;
    }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;