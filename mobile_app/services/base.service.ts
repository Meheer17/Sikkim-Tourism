import { ApiResponse, GetListRequest, ListResponse, CreateRequest, UpdateRequest, DeleteRequest } from '../types/api.types';
import { apiClient } from './api.client';

export abstract class BaseService<T> {
    protected baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    /**
     * Get list of items with pagination and filtering
     */
    async getList(params?: GetListRequest): Promise<ApiResponse<ListResponse<T>>> {
        const queryParams = new URLSearchParams();

        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.sort) queryParams.append('sort', params.sort);
        if (params?.order) queryParams.append('order', params.order);
        if (params?.search) queryParams.append('search', params.search);

        if (params?.filters) {
            Object.entries(params.filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    queryParams.append(`filter[${key}]`, value.toString());
                }
            });
        }

        const url = `${this.baseUrl}?${queryParams.toString()}`;
        return apiClient.get<ListResponse<T>>(url);
    }

    /**
     * Get single item by ID
     */
    async getById(id: string): Promise<ApiResponse<T>> {
        return apiClient.get<T>(`${this.baseUrl}/${id}`);
    }

    /**
     * Create new item
     */
    async create(request: CreateRequest<T>): Promise<ApiResponse<T>> {
        return apiClient.post<T>(this.baseUrl, request.data);
    }

    /**
     * Update existing item
     */
    async update(request: UpdateRequest<T>): Promise<ApiResponse<T>> {
        return apiClient.put<T>(`${this.baseUrl}/${request.id}`, request.data);
    }

    /**
     * Partially update existing item
     */
    async patch(request: UpdateRequest<T>): Promise<ApiResponse<T>> {
        return apiClient.patch<T>(`${this.baseUrl}/${request.id}`, request.data);
    }

    /**
     * Delete item by ID
     */
    async delete(request: DeleteRequest): Promise<ApiResponse<void>> {
        return apiClient.delete<void>(`${this.baseUrl}/${request.id}`);
    }

    /**
     * Batch delete multiple items
     */
    async batchDelete(ids: string[]): Promise<ApiResponse<void>> {
        return apiClient.delete<void>(`${this.baseUrl}/batch`, {
            data: { ids }
        });
    }

    /**
     * Check if item exists
     */
    async exists(id: string): Promise<ApiResponse<{ exists: boolean }>> {
        return apiClient.get<{ exists: boolean }>(`${this.baseUrl}/${id}/exists`);
    }

    /**
     * Get item count
     */
    async count(filters?: Record<string, any>): Promise<ApiResponse<{ count: number }>> {
        const queryParams = new URLSearchParams();

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    queryParams.append(`filter[${key}]`, value.toString());
                }
            });
        }

        const url = `${this.baseUrl}/count?${queryParams.toString()}`;
        return apiClient.get<{ count: number }>(url);
    }

    /**
     * Custom endpoint call
     */
    protected async customGet<R = any>(endpoint: string, params?: any): Promise<ApiResponse<R>> {
        const queryParams = params ? `?${new URLSearchParams(params).toString()}` : '';
        return apiClient.get<R>(`${this.baseUrl}/${endpoint}${queryParams}`);
    }

    protected async customPost<R = any>(endpoint: string, data?: any): Promise<ApiResponse<R>> {
        return apiClient.post<R>(`${this.baseUrl}/${endpoint}`, data);
    }

    protected async customPut<R = any>(endpoint: string, data?: any): Promise<ApiResponse<R>> {
        return apiClient.put<R>(`${this.baseUrl}/${endpoint}`, data);
    }

    protected async customPatch<R = any>(endpoint: string, data?: any): Promise<ApiResponse<R>> {
        return apiClient.patch<R>(`${this.baseUrl}/${endpoint}`, data);
    }

    protected async customDelete<R = any>(endpoint: string): Promise<ApiResponse<R>> {
        return apiClient.delete<R>(`${this.baseUrl}/${endpoint}`);
    }
}