import { ApiResponse } from '../types/api.types';
import { apiClient } from './api.client';

export interface MessageModel {
  _id: string;
  uid: string; // user id
  cid: string; // community id
  text: string;
  created_at?: string;
}

class MessageService {
  private baseUrl = '/message';

  async list(params?: { skip?: number; limit?: number; uid?: string; cid?: string }): Promise<ApiResponse<MessageModel[]>> {
    const qs = new URLSearchParams();
    if (params?.skip !== undefined) qs.append('skip', String(params.skip));
    if (params?.limit !== undefined) qs.append('limit', String(params.limit));
    if (params?.uid) qs.append('uid', params.uid);
    if (params?.cid) qs.append('cid', params.cid);
    const url = `${this.baseUrl}${qs.toString() ? `?${qs.toString()}` : ''}`;
    return apiClient.get<MessageModel[]>(url);
  }

  async create(data: { uid: string; cid: string; text: string }): Promise<ApiResponse<MessageModel>> {
    return apiClient.post<MessageModel>(this.baseUrl, data);
  }
}

export const messageService = new MessageService();
export default messageService;
