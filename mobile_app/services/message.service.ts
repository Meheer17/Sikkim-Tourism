import { ApiResponse } from '../types/api.types';
import { apiClient } from './api.client';

export interface MessageModel {
  id: string;
  uid: string; // user id
  cid: string; // community id
  text: string;
  status?: 'active' | 'flagged' | 'hidden' | 'deleted';
  flagged_count?: number;
  created_at?: string;
}

export interface MessageWithUser extends MessageModel {
  user_name: string;
  user_avatar: string;
}

class MessageService {
  private baseUrl = '/message';

  async list(params?: { skip?: number; limit?: number; uid?: string; cid?: string }): Promise<ApiResponse<MessageModel[]>> {
    const qs = new URLSearchParams();
    if (params?.skip !== undefined) qs.append('skip', String(params.skip));
    if (params?.limit !== undefined) qs.append('limit', String(params.limit));
    if (params?.uid) qs.append('uid', params.uid);
    if (params?.cid) qs.append('cid', params.cid);
    const url = `${this.baseUrl}/${qs.toString() ? `?${qs.toString()}` : ''}`;
    return apiClient.get<MessageModel[]>(url);
  }

  async getChatMessages(cid: string, params?: { skip?: number; limit?: number }): Promise<ApiResponse<MessageWithUser[]>> {
    const qs = new URLSearchParams();
    if (params?.skip !== undefined) qs.append('skip', String(params.skip));
    if (params?.limit !== undefined) qs.append('limit', String(params.limit));
    const url = `${this.baseUrl}/chat/${cid}${qs.toString() ? `?${qs.toString()}` : ''}`;
    return apiClient.get<MessageWithUser[]>(url);
  }

  async getOnlineCount(cid: string): Promise<ApiResponse<{ online_count: number }>> {
    return apiClient.get<{ online_count: number }>(`${this.baseUrl}/online/${cid}`);
  }

  async create(data: { cid: string; text: string }): Promise<ApiResponse<MessageWithUser>> {
    // Add trailing slash to avoid 307 redirect
    return apiClient.post<MessageWithUser>(`${this.baseUrl}/`, data);
  }

  async flagMessage(messageId: string): Promise<ApiResponse<MessageModel>> {
    return apiClient.post<MessageModel>(`${this.baseUrl}/${messageId}/flag`, {});
  }

  async getFlaggedMessages(params?: { skip?: number; limit?: number }): Promise<ApiResponse<MessageWithUser[]>> {
    const qs = new URLSearchParams();
    if (params?.skip !== undefined) qs.append('skip', String(params.skip));
    if (params?.limit !== undefined) qs.append('limit', String(params.limit));
    const url = `${this.baseUrl}/flagged${qs.toString() ? `?${qs.toString()}` : ''}`;
    return apiClient.get<MessageWithUser[]>(url);
  }

  async moderateMessage(messageId: string, action: 'hide' | 'restore' | 'delete'): Promise<ApiResponse<MessageModel>> {
    return apiClient.post<MessageModel>(`${this.baseUrl}/${messageId}/moderate?action=${action}`, {});
  }

  async deleteMessage(messageId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.baseUrl}/${messageId}`);
  }
}

export const messageService = new MessageService();
export default messageService;
