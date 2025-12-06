import { BaseService } from './base.service';
import { ApiResponse } from '../types/api.types';
import { apiClient } from './api.client';

export interface EventOpenHours {
  start: string;
  end: string;
}

export interface Event {
  _id: string;
  name: string;
  description: string;
  short_description: string;
  open_hours: EventOpenHours;
  type_id: string;
  l_id: string;
  scheduled_at: string;
  approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventListParams {
  page?: number;
  limit?: number;
  search?: string;
  filters?: {
    approved?: boolean;
  };
}

class EventService extends BaseService<Event> {
  constructor() {
    super('/event');
  }

  /**
   * Get list of events with filtering
   * Backend API params: skip, limit, approved, q (search)
   */
  async list(params?: EventListParams): Promise<ApiResponse<Event[]>> {
    const queryParams = new URLSearchParams();

    // Calculate skip from page
    const skip = params?.page ? (params.page - 1) * (params?.limit || 10) : 0;
    queryParams.append('skip', skip.toString());
    queryParams.append('limit', (params?.limit || 10).toString());

    // Search parameter
    if (params?.search) {
      queryParams.append('q', params.search);
    }

    // Approved filter
    if (params?.filters?.approved !== undefined) {
      queryParams.append('approved', params.filters.approved.toString());
    }

    const url = `${this.baseUrl}?${queryParams.toString()}`;
    return apiClient.get<Event[]>(url);
  }

  /**
   * Get all events (no date filtering)
   */
  async getAll(limit: number = 100): Promise<ApiResponse<Event[]>> {
    try {
      const response = await this.list({
        limit,
        filters: {
          approved: true,
        },
      });

      if (response.data && Array.isArray(response.data)) {
        // Sort by scheduled_at ascending (oldest to newest)
        const sorted = response.data.sort((a, b) => 
          new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
        );

        return { ...response, data: sorted };
      }

      return response;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }
}

export const eventService = new EventService();
export { EventService };
