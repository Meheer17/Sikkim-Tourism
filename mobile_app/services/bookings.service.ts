import { ApiResponse } from '../types/api.types';
import { OrderModel } from './orders.service';
import { apiClient } from './api.client';

/**
 * Bookings Count Response
 */
export interface BookingsCountResponse {
  created?: number;
  confirmed?: number;
  completed?: number;
  cancelled?: number;
  pending?: number;
  total?: number;
}

/**
 * Bookings Service
 * Handles user and business booking operations with specialized queries
 */
class BookingsService {
  private baseUrl = '/bookings';

  // ==================== USER BOOKINGS ====================

  /**
   * Get all user's bookings
   * @param skip - Pagination offset
   * @param limit - Number of records
   * @param orderStatus - Filter by order status (optional)
   * @param paymentStatus - Filter by payment status (optional)
   * @returns Promise<ApiResponse<OrderModel[]>> - User's bookings
   */
  async getMyBookings(params?: {
    skip?: number;
    limit?: number;
    order_status?: string;
    payment_status?: string;
  }): Promise<ApiResponse<OrderModel[]>> {
    const qs = new URLSearchParams();
    if (params?.skip !== undefined) qs.append('skip', String(params.skip));
    if (params?.limit !== undefined) qs.append('limit', String(params.limit));
    if (params?.order_status) qs.append('order_status', params.order_status);
    if (params?.payment_status) qs.append('payment_status', params.payment_status);

    return apiClient.get<OrderModel[]>(`${this.baseUrl}/user/my-bookings?${qs.toString()}`);
  }

  /**
   * Get count of user's bookings by status
   * @returns Promise<ApiResponse<BookingsCountResponse>> - Bookings count by status
   */
  async getMyBookingsCount(): Promise<ApiResponse<BookingsCountResponse>> {
    return apiClient.get<BookingsCountResponse>(`${this.baseUrl}/user/my-bookings/count`);
  }

  /**
   * Get upcoming bookings (not yet completed)
   * @param skip - Pagination offset
   * @param limit - Number of records
   * @returns Promise<ApiResponse<OrderModel[]>> - Upcoming bookings
   */
  async getUpcomingBookings(skip: number = 0, limit: number = 10): Promise<ApiResponse<OrderModel[]>> {
    const params = new URLSearchParams();
    params.append('skip', String(skip));
    params.append('limit', String(limit));
    return apiClient.get<OrderModel[]>(`${this.baseUrl}/user/my-bookings/upcoming?${params.toString()}`);
  }

  /**
   * Get completed bookings
   * @param skip - Pagination offset
   * @param limit - Number of records
   * @returns Promise<ApiResponse<OrderModel[]>> - Completed bookings
   */
  async getCompletedBookings(skip: number = 0, limit: number = 10): Promise<ApiResponse<OrderModel[]>> {
    const params = new URLSearchParams();
    params.append('skip', String(skip));
    params.append('limit', String(limit));
    return apiClient.get<OrderModel[]>(`${this.baseUrl}/user/my-bookings/completed?${params.toString()}`);
  }

  // ==================== BUSINESS BOOKINGS (Multi-Store Dashboard) ====================

  /**
   * Get today's bookings across all user-owned businesses
   * @returns Promise<ApiResponse<OrderModel[]>> - Today's bookings
   */
  async getTodaysBookings(): Promise<ApiResponse<OrderModel[]>> {
    return apiClient.get<OrderModel[]>(`${this.baseUrl}/business/today`);
  }

  /**
   * Get count of today's bookings across all user-owned businesses
   * @returns Promise<ApiResponse<BookingsCountResponse>> - Today's bookings count
   */
  async getTodaysBookingsCount(): Promise<ApiResponse<BookingsCountResponse>> {
    return apiClient.get<BookingsCountResponse>(`${this.baseUrl}/business/today/count`);
  }

  /**
   * Get upcoming bookings across all user-owned businesses
   * @param skip - Pagination offset
   * @param limit - Number of records
   * @returns Promise<ApiResponse<OrderModel[]>> - Upcoming business bookings
   */
  async getBusinessUpcomingBookings(skip: number = 0, limit: number = 10): Promise<ApiResponse<OrderModel[]>> {
    const params = new URLSearchParams();
    params.append('skip', String(skip));
    params.append('limit', String(limit));
    return apiClient.get<OrderModel[]>(`${this.baseUrl}/business/upcoming?${params.toString()}`);
  }

  /**
   * Get bookings with pending payment across all user-owned businesses
   * @param skip - Pagination offset
   * @param limit - Number of records
   * @returns Promise<ApiResponse<OrderModel[]>> - Pending payment bookings
   */
  async getPendingPaymentBookings(skip: number = 0, limit: number = 10): Promise<ApiResponse<OrderModel[]>> {
    const params = new URLSearchParams();
    params.append('skip', String(skip));
    params.append('limit', String(limit));
    return apiClient.get<OrderModel[]>(`${this.baseUrl}/business/pending-payment?${params.toString()}`);
  }

  // ==================== BUSINESS BOOKINGS (Single Store Management) ====================

  /**
   * Get all bookings for a specific business
   * @param businessId - Business ID
   * @param skip - Pagination offset
   * @param limit - Number of records
   * @param orderStatus - Filter by order status (optional)
   * @param paymentStatus - Filter by payment status (optional)
   * @returns Promise<ApiResponse<OrderModel[]>> - Business bookings
   */
  async getBusinessBookings(
    businessId: string,
    params?: {
      skip?: number;
      limit?: number;
      order_status?: string;
      payment_status?: string;
    }
  ): Promise<ApiResponse<OrderModel[]>> {
    const qs = new URLSearchParams();
    if (params?.skip !== undefined) qs.append('skip', String(params.skip));
    if (params?.limit !== undefined) qs.append('limit', String(params.limit));
    if (params?.order_status) qs.append('order_status', params.order_status);
    if (params?.payment_status) qs.append('payment_status', params.payment_status);

    return apiClient.get<OrderModel[]>(`${this.baseUrl}/business/${businessId}/bookings?${qs.toString()}`);
  }

  /**
   * Get today's bookings for a specific business
   * @param businessId - Business ID
   * @returns Promise<ApiResponse<OrderModel[]>> - Today's bookings for business
   */
  async getBusinessTodaysBookings(businessId: string): Promise<ApiResponse<OrderModel[]>> {
    return apiClient.get<OrderModel[]>(`${this.baseUrl}/business/${businessId}/today`);
  }

  /**
   * Get bookings count for a specific business
   * @param businessId - Business ID
   * @returns Promise<ApiResponse<BookingsCountResponse>> - Business bookings count
   */
  async getBusinessBookingsCount(businessId: string): Promise<ApiResponse<BookingsCountResponse>> {
    return apiClient.get<BookingsCountResponse>(`${this.baseUrl}/business/${businessId}/bookings/count`);
  }

  /**
   * Confirm a booking (business owner only)
   * @param businessId - Business ID
   * @param orderId - Order ID (booking)
   * @returns Promise<ApiResponse<OrderModel>> - Confirmed booking
   */
  async confirmBooking(businessId: string, orderId: string): Promise<ApiResponse<OrderModel>> {
    return apiClient.put<OrderModel>(`${this.baseUrl}/business/${businessId}/booking/${orderId}/confirm`);
  }

  /**
   * Mark booking as completed (business owner only)
   * @param businessId - Business ID
   * @param orderId - Order ID (booking)
   * @returns Promise<ApiResponse<OrderModel>> - Completed booking
   */
  async markCompleted(businessId: string, orderId: string): Promise<ApiResponse<OrderModel>> {
    return apiClient.put<OrderModel>(`${this.baseUrl}/business/${businessId}/booking/${orderId}/mark-completed`);
  }

  /**
   * Cancel a booking (business owner only)
   * @param businessId - Business ID
   * @param orderId - Order ID (booking)
   * @returns Promise<ApiResponse<OrderModel>> - Cancelled booking
   */
  async cancelBooking(businessId: string, orderId: string): Promise<ApiResponse<OrderModel>> {
    return apiClient.put<OrderModel>(`${this.baseUrl}/business/${businessId}/booking/${orderId}/cancel`);
  }
}

export const bookingsService = new BookingsService();
export default bookingsService;
