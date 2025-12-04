import { ApiResponse } from '../types/api.types';
import { apiClient } from './api.client';

export interface ServiceModel {
  id?: string;
  name: string;
  price: number;
  bid: string; // business._id
  description?: string;
  features?: string[];
  short_description?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

class ServicesService {
  private baseUrl = '/services';

  async list(params?: { skip?: number; limit?: number; bid?: string }): Promise<ApiResponse<ServiceModel[]>> {
    const qs = new URLSearchParams();
    if (params?.skip !== undefined) qs.append('skip', String(params.skip));
    if (params?.limit !== undefined) qs.append('limit', String(params.limit));
    if (params?.bid) qs.append('bid', params.bid);
    const url = `${this.baseUrl}/${qs.toString() ? `?${qs.toString()}` : ''}`;
    return apiClient.get<ServiceModel[]>(url);
  }

  async create(data: Omit<ServiceModel, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<ServiceModel>> {
    return apiClient.post<ServiceModel>(this.baseUrl, data);
  }

  async get(id: string): Promise<ApiResponse<ServiceModel>> {
    return apiClient.get<ServiceModel>(`${this.baseUrl}/${id}`);
  }

  async update(id: string, data: Partial<Omit<ServiceModel, 'id'>>): Promise<ApiResponse<ServiceModel>> {
    return apiClient.put<ServiceModel>(`${this.baseUrl}/${id}`, data);
  }

  async remove(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.baseUrl}/${id}`);
  }
}

export const servicesService = new ServicesService();
export default servicesService;
