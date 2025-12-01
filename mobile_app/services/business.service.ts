import { ApiResponse } from '../types/api.types';
import { apiClient } from './api.client';

export interface OpenHours { start: string; end: string }

export interface Position {
  x: string;
  y: string;
}

export interface BusinessModel {
  id: string;
  name: string;
  description: string;
  short_description: string;
  open_hours: OpenHours;
  type_id: string;
  position?: Position;
  l_id?: string; // optional - can reference location or use position
  scheduled_at: string; // ISO 8601
  approved?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BusinessType {
  id: string;
  type: string;
  category: string;
}

class BusinessService {
  private baseUrl = '/business';

  async list(params?: { skip?: number; limit?: number; position_lat?: number; position_lng?: number; radius_m?: number; type_id?: string }): Promise<ApiResponse<BusinessModel[]>> {
    const qs = new URLSearchParams();
    if (params?.skip !== undefined) qs.append('skip', String(params.skip));
    if (params?.limit !== undefined) qs.append('limit', String(params.limit));
    if (params?.position_lat !== undefined) qs.append('position_lat', String(params.position_lat));
    if (params?.position_lng !== undefined) qs.append('position_lng', String(params.position_lng));
    if (params?.radius_m !== undefined) qs.append('radius_m', String(params.radius_m));
    if (params?.type_id) qs.append('type_id', params.type_id);
    const url = `${this.baseUrl}${qs.toString() ? `?${qs.toString()}` : ''}`;
    return apiClient.get<BusinessModel[]>(url);
  }

  async create(data: Omit<BusinessModel, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<BusinessModel>> {
    return apiClient.post<BusinessModel>(this.baseUrl, data);
  }

  async get(id: string): Promise<ApiResponse<BusinessModel>> {
    return apiClient.get<BusinessModel>(`${this.baseUrl}/${id}`);
  }

  async update(id: string, data: Partial<Omit<BusinessModel, 'id'>>): Promise<ApiResponse<BusinessModel>> {
    return apiClient.put<BusinessModel>(`${this.baseUrl}/${id}`, data);
  }

  async remove(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.baseUrl}/${id}`);
  }

  async mine(params?: { skip?: number; limit?: number }): Promise<ApiResponse<BusinessModel[]>> {
    const qs = new URLSearchParams();
    if (params?.skip !== undefined) qs.append('skip', String(params.skip));
    if (params?.limit !== undefined) qs.append('limit', String(params.limit));
    const url = `${this.baseUrl}/me${qs.toString() ? `?${qs.toString()}` : ''}`;
    return apiClient.get<BusinessModel[]>(url);
  }

  async getTypes(): Promise<ApiResponse<BusinessType[]>> {
    return apiClient.get<BusinessType[]>(`${this.baseUrl}/types`);
  }

  async approve(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.put<{ message: string }>(`${this.baseUrl}/${id}/approve`);
  }
}

export const businessService = new BusinessService();
export default businessService;
