import { useState, useCallback } from 'react';
import { ApiResponse } from '../types/api.types';
import { apiClient } from '../services/api.client';
import Toast from 'react-native-toast-message';

interface ApiState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

interface ApiOptions {
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
    successMessage?: string;
    errorMessage?: string;
}

export const useApi = <T = any>(initialData: T | null = null) => {
    const [state, setState] = useState<ApiState<T>>({
        data: initialData,
        loading: false,
        error: null,
    });

    const execute = useCallback(
        async (
            apiCall: () => Promise<ApiResponse<T>>,
            options: ApiOptions = {}
        ): Promise<T | null> => {
            try {
                setState(prev => ({ ...prev, loading: true, error: null }));

                const response = await apiCall();

                if (response.success) {
                    setState({
                        data: response.data || null,
                        loading: false,
                        error: null,
                    });

                    if (options.showSuccessToast) {
                        Toast.show({
                            type: 'success',
                            text1: 'Success',
                            text2: options.successMessage || response.message || 'Operation completed successfully',
                        });
                    }

                    return response.data || null;
                } else {
                    const errorMsg = response.message || 'Operation failed';
                    setState(prev => ({
                        ...prev,
                        loading: false,
                        error: errorMsg,
                    }));

                    if (options.showErrorToast !== false) {
                        Toast.show({
                            type: 'error',
                            text1: 'Error',
                            text2: options.errorMessage || errorMsg,
                        });
                    }

                    return null;
                }
            } catch (error: any) {
                const errorMsg = error.response?.data?.message || error.message || 'An unexpected error occurred';
                setState(prev => ({
                    ...prev,
                    loading: false,
                    error: errorMsg,
                }));

                // Don't show error toast for network errors in development mode
                const isNetworkError = error.code === 'ERR_NETWORK' || error.message === 'Network Error';
                if (__DEV__ && isNetworkError) {
                    // Silently handle network errors in development (backend not running)
                    return null;
                }

                if (options.showErrorToast !== false) {
                    Toast.show({
                        type: 'error',
                        text1: 'Error',
                        text2: options.errorMessage || errorMsg,
                    });
                }

                return null;
            }
        },
        []
    );

    const get = useCallback(
        async (url: string, options: ApiOptions = {}): Promise<T | null> => {
            return execute(() => apiClient.get<T>(url), options);
        },
        [execute]
    );

    const post = useCallback(
        async (url: string, data?: any, options: ApiOptions = {}): Promise<T | null> => {
            return execute(() => apiClient.post<T>(url, data), options);
        },
        [execute]
    );

    const put = useCallback(
        async (url: string, data?: any, options: ApiOptions = {}): Promise<T | null> => {
            return execute(() => apiClient.put<T>(url, data), options);
        },
        [execute]
    );

    const patch = useCallback(
        async (url: string, data?: any, options: ApiOptions = {}): Promise<T | null> => {
            return execute(() => apiClient.patch<T>(url, data), options);
        },
        [execute]
    );

    const del = useCallback(
        async (url: string, options: ApiOptions = {}): Promise<T | null> => {
            return execute(() => apiClient.delete<T>(url), options);
        },
        [execute]
    );

    const upload = useCallback(
        async (url: string, formData: FormData, options: ApiOptions = {}): Promise<T | null> => {
            return execute(() => apiClient.uploadFile<T>(url, formData), options);
        },
        [execute]
    );

    const reset = useCallback(() => {
        setState({
            data: initialData,
            loading: false,
            error: null,
        });
    }, [initialData]);

    const setData = useCallback((data: T | null) => {
        setState(prev => ({ ...prev, data }));
    }, []);

    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    return {
        data: state.data,
        loading: state.loading,
        error: state.error,
        execute,
        get,
        post,
        put,
        patch,
        delete: del,
        upload,
        reset,
        setData,
        clearError,
    };
};

// Specialized hook for list operations with pagination
export const useApiList = <T = any>(initialData: T[] = []) => {
    const [state, setState] = useState({
        items: initialData,
        loading: false,
        error: null as string | null,
        pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: 20,
            hasNextPage: false,
            hasPreviousPage: false,
        },
    });

    const fetchList = useCallback(
        async (
            url: string,
            params?: {
                page?: number;
                limit?: number;
                search?: string;
                filters?: Record<string, any>;
            }
        ): Promise<T[] | null> => {
            try {
                setState(prev => ({ ...prev, loading: true, error: null }));

                const queryParams = new URLSearchParams();
                if (params?.page) queryParams.append('page', params.page.toString());
                if (params?.limit) queryParams.append('limit', params.limit.toString());
                if (params?.search) queryParams.append('search', params.search);

                if (params?.filters) {
                    Object.entries(params.filters).forEach(([key, value]) => {
                        if (value !== undefined && value !== null) {
                            queryParams.append(`filter[${key}]`, value.toString());
                        }
                    });
                }

                const finalUrl = `${url}?${queryParams.toString()}`;
                const response = await apiClient.get<{
                    items: T[];
                    pagination: {
                        currentPage: number;
                        totalPages: number;
                        totalItems: number;
                        itemsPerPage: number;
                        hasNextPage: boolean;
                        hasPreviousPage: boolean;
                    };
                }>(finalUrl);

                if (response.success && response.data) {
                    setState({
                        items: response.data.items,
                        loading: false,
                        error: null,
                        pagination: response.data.pagination,
                    });

                    return response.data.items;
                } else {
                    const errorMsg = response.message || 'Failed to fetch data';
                    setState(prev => ({
                        ...prev,
                        loading: false,
                        error: errorMsg,
                    }));

                    return null;
                }
            } catch (error: any) {
                const errorMsg = error.response?.data?.message || error.message || 'An unexpected error occurred';
                setState(prev => ({
                    ...prev,
                    loading: false,
                    error: errorMsg,
                }));

                return null;
            }
        },
        []
    );

    const addItem = useCallback((item: T) => {
        setState(prev => ({
            ...prev,
            items: [item, ...prev.items],
        }));
    }, []);

    const updateItem = useCallback((index: number, item: T) => {
        setState(prev => ({
            ...prev,
            items: prev.items.map((existingItem, i) => (i === index ? item : existingItem)),
        }));
    }, []);

    const removeItem = useCallback((index: number) => {
        setState(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }));
    }, []);

    const reset = useCallback(() => {
        setState({
            items: initialData,
            loading: false,
            error: null,
            pagination: {
                currentPage: 1,
                totalPages: 1,
                totalItems: 0,
                itemsPerPage: 20,
                hasNextPage: false,
                hasPreviousPage: false,
            },
        });
    }, [initialData]);

    return {
        items: state.items,
        loading: state.loading,
        error: state.error,
        pagination: state.pagination,
        fetchList,
        addItem,
        updateItem,
        removeItem,
        reset,
    };
};