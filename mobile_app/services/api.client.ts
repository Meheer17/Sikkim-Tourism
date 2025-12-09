import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiResponse } from '../types/api.types';
import { AuthUtils } from '../utils/auth';
import { config as appConfig } from '../config/api.config';
import Toast from 'react-native-toast-message';
import { networkService } from './network.service';

class ApiClient {
    private client: AxiosInstance;

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
                if (__DEV__ && appConfig.api.enableLogs) {
                    console.warn('❌ Request Error:', error.message || error);
                }
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.client.interceptors.response.use(
            (response: AxiosResponse) => {
                // Connection is fine
                networkService.setOffline(false);
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

                // Handle 401 errors - for now just clear auth and redirect
                // TODO: Implement refresh token logic when backend supports it
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    // Clear auth data and logout
                    await AuthUtils.clearAuthData();
                    this.handleLogout();

                    return Promise.reject(error);
                }

                // Handle other errors
                this.handleError(error);
                // If it's a network error, mark offline
                if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
                    networkService.setOffline(true);
                }
                return Promise.reject(error);
            }
        );
    }

    private handleError(error: AxiosError): void {
        // Don't log network errors in development mode (backend not running)
        if (
            __DEV__ &&
            (error.code === 'ERR_NETWORK' || error.message === 'Network Error') &&
            appConfig.api.enableLogs
        ) {
            console.warn('⚠️ Network error detected - Backend API may not be running');
            return;
        }

        // Extract user-friendly error message
        let errorMessage = 'An unexpected error occurred';
        let errorTitle = 'Error';
        const respData: any = error.response?.data ?? {};

        // Handle FastAPI validation errors (422)
        if (error.response?.status === 422) {
            const detail = respData?.detail;
            if (Array.isArray(detail) && detail.length > 0) {
                // FastAPI returns validation errors as array of objects
                const firstError = detail[0];
                const field = firstError.loc?.[1] || firstError.loc?.[0] || 'field';
                errorMessage = `${field}: ${firstError.msg || 'Invalid value'}`;
                errorTitle = 'Validation Error';
            } else if (typeof detail === 'string') {
                errorMessage = detail;
                errorTitle = 'Validation Error';
            }

            if (__DEV__ && appConfig.api.enableLogs) {
                console.warn('⚠️ Validation Error:', respData);
            }
        }
        // Handle 401 Unauthorized
        else if (error.response?.status === 401) {
            const detail = respData?.detail || '';
            // Check if it's a "user not found" or "not registered" error
            if (detail.toLowerCase().includes('user not found') || 
                detail.toLowerCase().includes('not registered') ||
                detail.toLowerCase().includes('no user found') ||
                detail.toLowerCase().includes('does not exist')) {
                errorMessage = 'This account is not registered. Please sign up first.';
                errorTitle = 'Account Not Found';
            } else if (detail.toLowerCase().includes('incorrect') || 
                       detail.toLowerCase().includes('invalid credentials') ||
                       detail.toLowerCase().includes('wrong password')) {
                errorMessage = 'Incorrect email or password. Please try again.';
                errorTitle = 'Invalid Credentials';
            } else {
                errorMessage = detail || 'Authentication failed. Please check your credentials.';
                errorTitle = 'Authentication Error';
            }
        }
        // Handle 403 Forbidden
        else if (error.response?.status === 403) {
            // Check if it's an approval-related error
            const detail = respData?.detail || '';
            if (detail.toLowerCase().includes('approval') || detail.toLowerCase().includes('pending')) {
                errorMessage = detail;
                errorTitle = 'Account Pending Approval';
            } else {
                errorMessage = respData?.detail || 'You do not have permission to access this resource.';
                errorTitle = 'Access Denied';
            }
            if (__DEV__ && appConfig.api.enableLogs) {
                console.warn('⚠️ 403 Forbidden:', detail);
            }
        }
        // Handle 404 Not Found
        else if (error.response?.status === 404) {
            errorMessage = 'The requested resource was not found.';
            errorTitle = 'Not Found';
        }
        // Handle 500 Server Error
        else if (error.response?.status === 500) {
            errorMessage = 'Something went wrong on our end. Please try again later.';
            errorTitle = 'Server Error';
        }
        // Handle timeout
        else if (error.code === 'ECONNABORTED') {
            errorMessage = 'The request took too long. Please check your connection.';
            errorTitle = 'Request Timeout';
        }
        // Handle network errors
        else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
            errorMessage = 'Unable to connect to the server. Please check your internet connection.';
            errorTitle = 'Connection Error';
        }
        // Generic error
        else if (respData?.detail) {
            errorMessage = typeof respData.detail === 'string'
                ? respData.detail
                : 'An error occurred';
            errorTitle = 'Error';
        }

        // Show toast notification
        Toast.show({
            type: 'error',
            text1: errorTitle,
            text2: errorMessage,
        });

        // Log error in development only when API logs enabled
        if (__DEV__ && appConfig.api.enableLogs) {
            console.warn('❌ API Error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                message: errorMessage,
                url: error.config?.url,
                responseData: error.response?.data,
                headers: error.response?.headers,
            });
        }
    }

    private handleLogout(): void {
        // Emit logout event or navigate to login screen
        // You can implement your navigation logic here
        console.log('User logged out due to authentication error');
    }

    // Helper to wrap FastAPI responses in ApiResponse format
    private wrapResponse<T>(response: AxiosResponse): ApiResponse<T> {
        return {
            success: true,
            message: 'Success',
            data: response.data as T,
        };
    }

    // HTTP Methods
    async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const response = await this.client.get(url, config);
        return this.wrapResponse<T>(response);
    }

    async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const response = await this.client.post(url, data, config);
        return this.wrapResponse<T>(response);
    }

    async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const response = await this.client.put(url, data, config);
        return this.wrapResponse<T>(response);
    }

    async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const response = await this.client.patch(url, data, config);
        return this.wrapResponse<T>(response);
    }

    async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const response = await this.client.delete(url, config);
        return this.wrapResponse<T>(response);
    }

    // File upload method
    async uploadFile<T = any>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const uploadConfig: AxiosRequestConfig = {
            ...config,
            headers: {
                ...config?.headers,
                'Content-Type': 'multipart/form-data',
            },
            timeout: 120000, // 2 minutes for file uploads
        };

        const response = await this.client.post(url, formData, uploadConfig);
        return this.wrapResponse<T>(response);
    }

    // Get raw axios instance for custom requests
    getAxiosInstance(): AxiosInstance {
        return this.client;
    }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;