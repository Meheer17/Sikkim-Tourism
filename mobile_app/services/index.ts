// Export all services
export { apiClient } from './api.client';
export { BaseService } from './base.service';
export { authService, AuthService } from './auth.service';
export { fileService, FileService } from './file.service';
export { businessService } from './business.service';
export { servicesService } from './services.service';
export { locationService } from './location.service';
export { userService } from './user.service';
export { communityService } from './community.service';
export { messageService } from './message.service';
export { ttsService } from './tts.service';
export { aiPlannerService } from './ai-planner.service';
export { aiChatService } from './ai-chat.service';
export { eventService, EventService } from './event.service';
export { ordersService } from './orders.service';
export { bookingsService } from './bookings.service';
export { FriendsAPI } from './friends.service';

export type { Event, EventOpenHours, EventListParams, EventCreateData } from './event.service';

// Re-export types for convenience
export type {
  ApiResponse,
  ApiError,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  UserRole,
  FileUploadRequest,
  FileUploadResponse,
  GetListRequest,
  ListResponse,
  CreateRequest,
  UpdateRequest,
  DeleteRequest,
  PaginationMeta,
  ValidationError,
  RequestConfig,
  ResponseConfig,
} from '../types/api.types';

// Import BaseService class to use in factory
import { BaseService as BaseServiceClass } from './base.service';

// Service factory function for creating custom services
// Note: BaseService is abstract, so you'll need to extend it in your own service class
export function createService<T>(baseUrl: string) {
  // Create an anonymous class that extends BaseService
  return new (class extends BaseServiceClass<T> {
    constructor() {
      super(baseUrl);
    }
  })();
}

// Example of how to create specific services
// Uncomment and modify these as needed for your app

/*
// User service
export class UserService extends BaseService<User> {
  constructor() {
    super('/users');
  }

  async getUserProfile(userId: string): Promise<ApiResponse<User>> {
    return this.customGet(`${userId}/profile`);
  }

  async updateUserProfile(userId: string, data: Partial<User>): Promise<ApiResponse<User>> {
    return this.customPut(`${userId}/profile`, data);
  }
}

// Product service (example for e-commerce app)
export class ProductService extends BaseService<Product> {
  constructor() {
    super('/products');
  }

  async searchProducts(query: string): Promise<ApiResponse<ListResponse<Product>>> {
    return this.customGet('search', { q: query });
  }

  async getProductsByCategory(categoryId: string): Promise<ApiResponse<ListResponse<Product>>> {
    return this.customGet('by-category', { categoryId });
  }
}

// Order service (example for e-commerce app)
export class OrderService extends BaseService<Order> {
  constructor() {
    super('/orders');
  }

  async getUserOrders(userId: string): Promise<ApiResponse<ListResponse<Order>>> {
    return this.customGet(`user/${userId}`);
  }

  async cancelOrder(orderId: string): Promise<ApiResponse<void>> {
    return this.customPost(`${orderId}/cancel`);
  }
}

// Notification service
export class NotificationService extends BaseService<Notification> {
  constructor() {
    super('/notifications');
  }

  async markAsRead(notificationId: string): Promise<ApiResponse<void>> {
    return this.customPatch(`${notificationId}/read`);
  }

  async markAllAsRead(): Promise<ApiResponse<void>> {
    return this.customPost('mark-all-read');
  }

  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    return this.customGet('unread-count');
  }
}

// Create service instances
export const userService = new UserService();
export const productService = new ProductService();
export const orderService = new OrderService();
export const notificationService = new NotificationService();
*/