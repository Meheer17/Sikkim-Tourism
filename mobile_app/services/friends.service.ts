import { apiClient } from './api.client';

export interface CreateGroupResponse {
  group_id: string;
  code: string;
}

export interface JoinGroupRequest {
  code: string;
}

export interface JoinGroupResponse {
  group_id: string;
  code: string;
}

export interface LocationUpdateRequest {
  lat: number;
  lng: number;
}

export interface MemberLocation {
  user_id: string;
  name?: string;
  initials?: string;
  lat?: number;
  lng?: number;
  last_seen_at?: string;
}

export interface MembersResponse {
  group_id: string;
  members: MemberLocation[];
}

export interface GroupInfoResponse {
  group_id: string;
  code: string;
  owner_id: string;
  member_count: number;
  created_at: string;
}

export const FriendsAPI = {
  async createGroup() {
    return apiClient.post<CreateGroupResponse>(`/friends/groups`);
  },

  async joinGroup(code: string) {
    return apiClient.post<JoinGroupResponse>(`/friends/groups/join`, { code } satisfies JoinGroupRequest);
  },

  async updateLocation(groupId: string, lat: number, lng: number) {
    return apiClient.post<void>(`/friends/groups/${groupId}/location`, { lat, lng } satisfies LocationUpdateRequest);
  },

  async listMembers(groupId: string) {
    return apiClient.get<MembersResponse>(`/friends/groups/${groupId}/members`);
  },

  async getGroupInfo(groupId: string) {
    return apiClient.get<GroupInfoResponse>(`/friends/groups/${groupId}`);
  },

  async disbandGroup(groupId: string) {
    return apiClient.delete<{ message: string }>(`/friends/groups/${groupId}`);
  },

  async validateGroup(groupId: string) {
    return apiClient.get<{ exists: boolean }>(`/friends/groups/${groupId}/validate`);
  },
};
