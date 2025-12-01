import { ApiResponse } from '../types/api.types';
import { apiClient } from './api.client';

export interface LocationPosition { x: number; y: number }
export type LocationType = 'emergency' | 'localhelp' | 'business' | 'event' | 'tourism' | 'other';

export interface LocationModel {
    _id: string;
    name: string;
    description: string;
    short_description: string;
    position: LocationPosition;
    metadata: Record<string, any>;
    type: LocationType;
    created_at?: string;
    updated_at?: string;
}

export interface LocationListResponse {
    items: LocationModel[];
}

class LocationService {
    private baseUrl = '/location';

    async list(params?: { skip?: number; limit?: number }): Promise<ApiResponse<LocationModel[]>> {
        const qs = new URLSearchParams();
        if (params?.skip !== undefined) qs.append('skip', String(params.skip));
        if (params?.limit !== undefined) qs.append('limit', String(params.limit));
        const url = `${this.baseUrl}${qs.toString() ? `?${qs.toString()}` : ''}`;
        const resp = await apiClient.get<LocationModel[]>(url);
        return resp;
    }

    async create(data: Omit<LocationModel, '_id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<LocationModel>> {
        return apiClient.post<LocationModel>(this.baseUrl, data);
    }

    async get(id: string): Promise<ApiResponse<LocationModel>> {
        return apiClient.get<LocationModel>(`${this.baseUrl}/${id}`);
    }

    async update(id: string, data: Partial<Omit<LocationModel, '_id'>>): Promise<ApiResponse<LocationModel>> {
        return apiClient.put<LocationModel>(`${this.baseUrl}/${id}`, data);
    }

    async remove(id: string): Promise<ApiResponse<void>> {
        return apiClient.delete<void>(`${this.baseUrl}/${id}`);
    }
}

export const locationService = new LocationService();
export default locationService;
