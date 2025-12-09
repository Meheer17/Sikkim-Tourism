import axiosInstance from './axios';
import Cookies from 'js-cookie';

export interface SigninData {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  approved: boolean;
}

export const authService = {
  async signin(data: SigninData): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>('/api/v1/auth/signin', data);
    return response.data;
  },

  async getMe(): Promise<UserData> {
    const response = await axiosInstance.get<UserData>('/api/v1/users/me');
    return response.data;
  },

  async refreshToken(): Promise<AuthResponse | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;
    
    try {
      const response = await axiosInstance.post<AuthResponse>('/api/v1/auth/refresh', {
        refresh_token: refreshToken,
      });
      return response.data;
    } catch {
      return null;
    }
  },

  setToken(token: string): void {
    Cookies.set('admin_token', token, { expires: 7 }); // 7 days
  },

  setRefreshToken(token: string): void {
    Cookies.set('admin_refresh_token', token, { expires: 7 }); // 7 days
  },

  setUser(user: UserData): void {
    Cookies.set('admin_user', JSON.stringify(user), { expires: 7 });
  },

  getToken(): string | undefined {
    return Cookies.get('admin_token');
  },

  getRefreshToken(): string | undefined {
    return Cookies.get('admin_refresh_token');
  },

  getUser(): UserData | null {
    const user = Cookies.get('admin_user');
    return user ? JSON.parse(user) : null;
  },

  logout(): void {
    Cookies.remove('admin_token');
    Cookies.remove('admin_refresh_token');
    Cookies.remove('admin_user');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
