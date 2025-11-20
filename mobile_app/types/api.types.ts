// Base API Response Types
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    errors?: string[];
    meta?: {
        pagination?: PaginationMeta;
        total?: number;
        page?: number;
        limit?: number;
    };
}

export interface PaginationMeta {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

// Authentication Types
export interface LoginRequest {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface RegisterRequest {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    phone?: string;
}

export interface AuthResponse {
    user: User;
    tokens: {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    };
}

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    role: UserRole;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

export enum UserRole {
    ADMIN = 'admin',
    USER = 'user',
    ORGANIZER = 'organizer',
    BUSINESS = 'business',
}

// File Upload Types
export interface FileUploadRequest {
    file: File | Blob;
    fileName: string;
    fileType: string;
    category?: 'image' | 'document' | 'video' | 'other';
}

export interface FileUploadResponse {
    id: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    thumbnailUrl?: string;
    category: string;
    uploadedAt: string;
}

// Error Types
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    path: string;
}

export interface ValidationError {
    field: string;
    message: string;
    code: string;
}

// Request/Response Interceptor Types
export interface RequestConfig {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    data?: any;
    params?: any;
    timeout?: number;
    retryAttempts?: number;
}

export interface ResponseConfig {
    data: any;
    status: number;
    statusText: string;
    headers: any;
    config: RequestConfig;
}

// Generic List Response
export interface ListResponse<T> {
    items: T[];
    pagination: PaginationMeta;
}

// Common CRUD operations
export interface CreateRequest<T> {
    data: Partial<T>;
}

export interface UpdateRequest<T> {
    id: string;
    data: Partial<T>;
}

export interface DeleteRequest {
    id: string;
}

export interface GetListRequest {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    search?: string;
    filters?: Record<string, any>;
}