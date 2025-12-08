import { ApiResponse } from '../types/api.types';
import { apiClient } from './api.client';

/**
 * Order Model and Types
 */
export interface OrderModel {
    id: string;
    service_id: string;
    business_id: string;
    user_id: string;
    payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
    order_status: 'created' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
    amount: number;
    metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface CreateOrderRequest {
    service_id: string;
    business_id: string;
    amount: number;
    metadata?: {
        from_time?: string;
        to_time?: string;
        quantity?: number;
        notes?: string;
        [key: string]: any;
    };
}

export interface UpdateOrderRequest {
    payment_status?: 'pending' | 'completed' | 'failed' | 'refunded';
    order_status?: 'created' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
    amount?: number;
    metadata?: Record<string, any>;
}

/**
 * Orders Service
 * Handles order creation, retrieval, updates, and business-specific operations
 */
class OrdersService {
    private baseUrl = '/orders';

    /**
     * Create a new order
     * @param data - Order creation data
     * @returns Promise<ApiResponse<OrderModel>> - Created order
     */
    async create(data: CreateOrderRequest): Promise<ApiResponse<OrderModel>> {
        return apiClient.post<OrderModel>(`${this.baseUrl}/`, data);
    }

    /**
     * List all orders with pagination and filters
     * @param skip - Pagination offset
     * @param limit - Number of records
     * @param serviceId - Filter by service ID (optional)
     * @param businessId - Filter by business ID (optional)
     * @param userId - Filter by user ID (optional)
     * @param paymentStatus - Filter by payment status (optional)
     * @param orderStatus - Filter by order status (optional)
     * @returns Promise<ApiResponse<OrderModel[]>> - List of orders
     */
    async list(params?: {
        skip?: number;
        limit?: number;
        service_id?: string;
        business_id?: string;
        user_id?: string;
        payment_status?: string;
        order_status?: string;
    }): Promise<ApiResponse<OrderModel[]>> {
        const qs = new URLSearchParams();
        if (params?.skip !== undefined) qs.append('skip', String(params.skip));
        if (params?.limit !== undefined) qs.append('limit', String(params.limit));
        if (params?.service_id) qs.append('service_id', params.service_id);
        if (params?.business_id) qs.append('business_id', params.business_id);
        if (params?.user_id) qs.append('user_id', params.user_id);
        if (params?.payment_status) qs.append('payment_status', params.payment_status);
        if (params?.order_status) qs.append('order_status', params.order_status);

        return apiClient.get<OrderModel[]>(`${this.baseUrl}/?${qs.toString()}`);
    }

    /**
     * Get my orders (current user)
     * @param skip - Pagination offset
     * @param limit - Number of records
     * @returns Promise<ApiResponse<OrderModel[]>> - User's orders
     */
    async getMyOrders(skip: number = 0, limit: number = 10): Promise<ApiResponse<OrderModel[]>> {
        const params = new URLSearchParams();
        params.append('skip', String(skip));
        params.append('limit', String(limit));
        return apiClient.get<OrderModel[]>(`${this.baseUrl}/me?${params.toString()}`);
    }

    /**
     * Get specific order by ID
     * @param orderId - Order ID
     * @returns Promise<ApiResponse<OrderModel>> - Order details
     */
    async getById(orderId: string): Promise<ApiResponse<OrderModel>> {
        return apiClient.get<OrderModel>(`${this.baseUrl}/${orderId}`);
    }

    /**
     * Update order
     * @param orderId - Order ID
     * @param data - Update data
     * @returns Promise<ApiResponse<OrderModel>> - Updated order
     */
    async update(orderId: string, data: UpdateOrderRequest): Promise<ApiResponse<OrderModel>> {
        return apiClient.put<OrderModel>(`${this.baseUrl}/${orderId}`, data);
    }

    /**
     * Delete order
     * @param orderId - Order ID
     * @returns Promise<ApiResponse<{ message: string }>> - Confirmation message
     */
    async delete(orderId: string): Promise<ApiResponse<{ message: string }>> {
        return apiClient.delete<{ message: string }>(`${this.baseUrl}/${orderId}`);
    }

    /**
     * Get all orders for a specific business
     * @param businessId - Business ID
     * @param skip - Pagination offset
     * @param limit - Number of records
     * @returns Promise<ApiResponse<OrderModel[]>> - Business's orders
     */
    async getByBusiness(businessId: string, skip: number = 0, limit: number = 10): Promise<ApiResponse<OrderModel[]>> {
        const params = new URLSearchParams();
        params.append('skip', String(skip));
        params.append('limit', String(limit));
        return apiClient.get<OrderModel[]>(`${this.baseUrl}/business/${businessId}?${params.toString()}`);
    }
}

export const ordersService = new OrdersService();
export default ordersService;
