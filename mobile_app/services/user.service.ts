import { ApiResponse, User } from '../types/api.types';
import { apiClient } from './api.client';

class UserService {
  private profileMe = '/profile/me';
  private profileById = '/profile';
  private usersBase = '/users';

  async me(): Promise<ApiResponse<User>> {
    return apiClient.get<User>(this.profileMe);
  }

  async get(uid: string): Promise<ApiResponse<User>> {
    return apiClient.get<User>(`${this.profileById}/${uid}`);
  }

  async updateMe(data: Partial<User>): Promise<ApiResponse<User>> {
    return apiClient.put<User>(this.profileMe, data);
  }

  async deleteMe(): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.usersBase}/me`);
  }

  async approve(userId: string): Promise<ApiResponse<{ approved: boolean }>> {
    // Admin-only: PUT /users/{user_id}/approve
    return apiClient.put<{ approved: boolean }>(`/users/${userId}/approve`);
  }

  async list(params?: { skip?: number; limit?: number }): Promise<ApiResponse<User[]>> {
    const qs = new URLSearchParams();
    if (params?.skip !== undefined) qs.append('skip', String(params.skip));
    if (params?.limit !== undefined) qs.append('limit', String(params.limit));
    const url = `${this.usersBase}${qs.toString() ? `?${qs.toString()}` : ''}`;
    return apiClient.get<User[]>(url);
  }

  async updateRole(userId: string, role: string): Promise<ApiResponse<User>> {
    return apiClient.put<User>(`/users/${userId}/role`, { role });
  }
}

export const userService = new UserService();
export default userService;
