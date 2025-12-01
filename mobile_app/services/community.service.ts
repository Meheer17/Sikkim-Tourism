import { ApiResponse } from '../types/api.types';
import { apiClient } from './api.client';

export interface CommunityModel {
  _id: string;
  name: string;
  decription: string;
  created_at?: string;
  updated_at?: string;
}

class CommunityService {
  private baseUrl = '/communities';

  async list(params?: { skip?: number; limit?: number }): Promise<ApiResponse<CommunityModel[]>> {
    const qs = new URLSearchParams();
    if (params?.skip !== undefined) qs.append('skip', String(params.skip));
    if (params?.limit !== undefined) qs.append('limit', String(params.limit));
    const url = `${this.baseUrl}${qs.toString() ? `?${qs.toString()}` : ''}`;
    return apiClient.get<CommunityModel[]>(url);
  }

  async create(data: { name: string; decription: string }): Promise<ApiResponse<CommunityModel>> {
    return apiClient.post<CommunityModel>(this.baseUrl, data);
  }

  async get(id: string): Promise<ApiResponse<CommunityModel>> {
    return apiClient.get<CommunityModel>(`${this.baseUrl}/${id}`);
  }

  async update(id: string, data: Partial<{ name: string; decription: string }>): Promise<ApiResponse<CommunityModel>> {
    return apiClient.put<CommunityModel>(`${this.baseUrl}/${id}`, data);
  }

  async remove(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.baseUrl}/${id}`);
  }
}

export const communityService = new CommunityService();
export default communityService;
