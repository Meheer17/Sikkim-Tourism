import { ApiResponse } from '@/types/api.types';
import { apiClient } from './api.client';

export interface Position {
    x: number; // longitude
    y: number; // latitude
}

export interface MonasteryRegistrationRequest {
    name: string;
    email: string;
    password: string;
    address: string;
    description: string;
    short_description: string;
    position: Position;
    open_hours_start: string;
    open_hours_end: string;
    scheduled_at: string;
    metadata?: Record<string, any>;
}

export interface MonasteryArtifact {
    id: string;
    monastery_id: string;
    name: string;
    description: string;
    category: 'manuscript' | 'artifact' | 'image' | 'document' | 'other';
    file_id: string;
    file_url: string;
    thumbnail_url?: string;
    metadata?: {
        age?: string;
        material?: string;
        dimensions?: string;
        historical_period?: string;
        [key: string]: any;
    };
    tags?: string[];
    created_at: string;
    updated_at: string;
}

export interface MonasteryData {
    id: string;
    user_id: string;
    name: string;
    email: string;
    address: string;
    description: string;
    short_description: string;
    position: Position;
    open_hours: {
        start: string;
        end: string;
    };
    verified: boolean;
    approved: boolean;
    artifacts_count: number;
    created_at: string;
    updated_at: string;
}

class MonasteryService {
    private baseUrl = '/monastery';

    /**
     * Register a new monastery
     */
    async registerMonastery(data: MonasteryRegistrationRequest): Promise<ApiResponse<{
        user: any;
        location: any;
        business: any;
        message: string;
    }>> {
        return apiClient.post(`${this.baseUrl}/register`, data);
    }

    /**
     * Get monastery details
     */
    async getMonasteryDetails(): Promise<ApiResponse<MonasteryData>> {
        return apiClient.get(`${this.baseUrl}/me`);
    }

    /**
     * Update monastery information
     */
    async updateMonastery(data: Partial<Omit<MonasteryData, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<ApiResponse<MonasteryData>> {
        return apiClient.put(`${this.baseUrl}/me`, data);
    }

    /**
     * Upload artifact
     */
    async uploadArtifact(
        file: File | Blob,
        fileName: string,
        category: 'manuscript' | 'artifact' | 'image' | 'document' | 'other',
        metadata?: {
            name?: string;
            description?: string;
            age?: string;
            material?: string;
            dimensions?: string;
            historical_period?: string;
            tags?: string[];
        }
    ): Promise<ApiResponse<MonasteryArtifact>> {
        const formData = new FormData();
        formData.append('file', file, fileName);
        formData.append('category', category);

        if (metadata) {
            if (metadata.name) formData.append('name', metadata.name);
            if (metadata.description) formData.append('description', metadata.description);
            if (metadata.age) formData.append('age', metadata.age);
            if (metadata.material) formData.append('material', metadata.material);
            if (metadata.dimensions) formData.append('dimensions', metadata.dimensions);
            if (metadata.historical_period) formData.append('historical_period', metadata.historical_period);
            if (metadata.tags && Array.isArray(metadata.tags)) {
                formData.append('tags', JSON.stringify(metadata.tags));
            }
        }

        return apiClient.uploadFile<MonasteryArtifact>(`${this.baseUrl}/artifacts/upload`, formData);
    }

    /**
     * Get all artifacts for the monastery
     */
    async getArtifacts(params?: {
        category?: string;
        skip?: number;
        limit?: number;
        search?: string;
    }): Promise<ApiResponse<{
        artifacts: MonasteryArtifact[];
        total: number;
    }>> {
        const qs = new URLSearchParams();
        if (params?.category) qs.append('category', params.category);
        if (params?.skip !== undefined) qs.append('skip', String(params.skip));
        if (params?.limit !== undefined) qs.append('limit', String(params.limit));
        if (params?.search) qs.append('search', params.search);

        const url = `${this.baseUrl}/artifacts${qs.toString() ? `?${qs.toString()}` : ''}`;
        return apiClient.get<{ artifacts: MonasteryArtifact[]; total: number }>(url);
    }

    /**
     * Get single artifact
     */
    async getArtifact(artifactId: string): Promise<ApiResponse<MonasteryArtifact>> {
        return apiClient.get(`${this.baseUrl}/artifacts/${artifactId}`);
    }

    /**
     * Update artifact metadata
     */
    async updateArtifact(
        artifactId: string,
        data: Partial<Omit<MonasteryArtifact, 'id' | 'file_id' | 'created_at' | 'updated_at'>>
    ): Promise<ApiResponse<MonasteryArtifact>> {
        return apiClient.put(`${this.baseUrl}/artifacts/${artifactId}`, data);
    }

    /**
     * Delete artifact
     */
    async deleteArtifact(artifactId: string): Promise<ApiResponse<{ message: string }>> {
        return apiClient.delete(`${this.baseUrl}/artifacts/${artifactId}`);
    }

    /**
     * Get artifact statistics
     */
    async getArtifactStats(): Promise<ApiResponse<{
        total: number;
        by_category: Record<string, number>;
        storage_used: number;
        storage_limit: number;
    }>> {
        return apiClient.get(`${this.baseUrl}/artifacts/stats`);
    }

    /**
     * Bulk upload artifacts
     */
    async bulkUploadArtifacts(
        files: Array<{
            file: File | Blob;
            fileName: string;
            category: 'manuscript' | 'artifact' | 'image' | 'document' | 'other';
            metadata?: any;
        }>
    ): Promise<ApiResponse<MonasteryArtifact[]>> {
        const formData = new FormData();

        files.forEach((item, index) => {
            formData.append(`files`, item.file, item.fileName);
            formData.append(`categories[${index}]`, item.category);
            if (item.metadata) {
                formData.append(`metadata[${index}]`, JSON.stringify(item.metadata));
            }
        });

        return apiClient.uploadFile<MonasteryArtifact[]>(`${this.baseUrl}/artifacts/bulk-upload`, formData);
    }
}

export const monasteryService = new MonasteryService();
export default monasteryService;
