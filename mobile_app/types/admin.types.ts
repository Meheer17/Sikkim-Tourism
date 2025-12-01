// Admin Dashboard Types
export interface DashboardStats {
    totalUsers: number;
    totalBusinesses: number;
    totalPlaces: number;
    totalBookings: number;
    revenue: number;
    activeUsers: number;
    pendingApprovals: number;
}

export interface RecentActivity {
    id: string;
    type: 'user_registered' | 'business_created' | 'place_added' | 'booking_made' | 'review_posted';
    title: string;
    description: string;
    timestamp: string;
    userId?: string;
    userName?: string;
}

// Business Management Types
export interface Business {
    id: string;
    name: string;
    description: string;
    category: string;
    price: number;
    imageUrl?: string;
    icon?: string;
    ownerId: string;
    ownerName: string;
    ownerEmail: string;
    status: 'active' | 'pending' | 'suspended' | 'rejected';
    rating?: number;
    reviewCount?: number;
    bookingCount?: number;
    revenue?: number;
    contactPhone?: string;
    contactEmail?: string;
    address?: string;
    location?: Location;
    amenities?: string[];
    openingHours?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateBusinessRequest {
    name: string;
    description: string;
    category: string;
    price: number;
    imageUrl?: string;
    icon?: string;
    ownerId?: string;
    contactPhone?: string;
    contactEmail?: string;
    address?: string;
    location?: Location;
    amenities?: string[];
    openingHours?: string;
}

// Place Management Types
export interface Place {
    id: string;
    name: string;
    description: string;
    category: string;
    imageUrl?: string;
    images?: string[];
    location: Location;
    address: string;
    rating?: number;
    reviewCount?: number;
    visitCount?: number;
    entryFee?: number;
    openingHours?: string;
    bestTimeToVisit?: string;
    highlights?: string[];
    facilities?: string[];
    status: 'active' | 'draft' | 'archived';
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface Location {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
}

export interface CreatePlaceRequest {
    name: string;
    description: string;
    category: string;
    imageUrl?: string;
    images?: string[];
    location: Location;
    address: string;
    entryFee?: number;
    openingHours?: string;
    bestTimeToVisit?: string;
    highlights?: string[];
    facilities?: string[];
}

// User Management Types
export interface AdminUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    role: UserRole;
    status: 'active' | 'suspended' | 'deleted' | 'pending';
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    totalBookings?: number;
    totalSpent?: number;
    joinedDate: string;
    lastLoginDate?: string;
    businessIds?: string[];

}

export enum UserRole {
    ADMIN = 'admin',
    USER = 'user',
    BUSINESS = 'business',
}

// Role Assignment Types
export interface RoleAssignment {
    userId: string;
    userName: string;
    userEmail: string;
    currentRole: UserRole;
    newRole: UserRole;
    reason?: string;
    permissions?: string[];
}

export interface Permission {
    id: string;
    name: string;
    description: string;
    category: string;
}

export interface RolePermissions {
    role: UserRole;
    permissions: string[];
}

// Filter and Search Types
export interface BusinessFilter {
    status?: 'active' | 'pending' | 'suspended' | 'rejected';
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    ownerId?: string;
    search?: string;
}

export interface PlaceFilter {
    status?: 'active' | 'draft' | 'archived';
    category?: string;
    hasEntryFee?: boolean;
    minRating?: number;
    search?: string;
}

export interface UserFilter {
    role?: UserRole;
    status?: 'active' | 'suspended' | 'deleted';
    isVerified?: boolean;
    search?: string;
}

// Analytics Types
export interface BusinessAnalytics {
    businessId: string;
    views: number;
    bookings: number;
    revenue: number;
    averageRating: number;
    reviewCount: number;
    conversionRate: number;
    period: string;
}

export interface PlaceAnalytics {
    placeId: string;
    views: number;
    visits: number;
    saves: number;
    shares: number;
    averageRating: number;
    reviewCount: number;
    period: string;
}

// Approval Types
export interface ApprovalRequest {
    id: string;
    type: 'business' | 'place' | 'user_verification';
    itemId: string;
    itemName: string;
    requestedBy: string;
    requestedByName: string;
    requestedDate: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewedBy?: string;
    reviewedDate?: string;
    notes?: string;
}
