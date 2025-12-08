import { BaseService } from './base.service';
import { ApiResponse } from '../types/api.types';
import { apiClient } from './api.client';

export interface EventOpenHours {
  start: string;
  end: string;
}

export interface Position {
  x: string;
  y: string;
}

export interface Event {
  _id: string;
  id?: string;
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
  uid?: string; // Owner user ID
}

export interface EventListParams {
  page?: number;
  limit?: number;
  search?: string;
  filters?: {
    approved?: boolean;
  };
}

export interface EventCreateData {
  name: string;
  description: string;
  short_description: string;
  open_hours: EventOpenHours;
  type_id: string;
  position: Position;
  scheduled_at: string;
}

export interface EventUpdateData {
  name?: string;
  description?: string;
  short_description?: string;
  open_hours?: EventOpenHours;
  scheduled_at?: string;
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

  /**
   * Create a new event
   */
  async createEvent(data: EventCreateData): Promise<ApiResponse<Event>> {
    try {
      console.log('EventService - Creating event with data:', JSON.stringify(data, null, 2));
      const response = await apiClient.post<Event>(this.baseUrl, data);
      return response;
    } catch (error: any) {
      console.error('Error creating event:', error);
      console.error('Error response:', error?.response?.data);
      console.error('Error status:', error?.response?.status);
      throw error;
    }
  }

  /**
   * Update an event
   */
  async updateEvent(eventId: string, data: EventUpdateData): Promise<ApiResponse<Event>> {
    try {
      console.log('EventService - Updating event with data:', JSON.stringify(data, null, 2));
      const response = await apiClient.put<Event>(`${this.baseUrl}/${eventId}`, data);
      return response;
    } catch (error: any) {
      console.error('Error updating event:', error);
      console.error('Error response:', error?.response?.data);
      console.error('Error status:', error?.response?.status);
      throw error;
    }
  }
}

export const eventService = new EventService();
export { EventService };
