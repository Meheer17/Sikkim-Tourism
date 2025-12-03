import { apiClient } from './api.client';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface ChatResponse {
  session_id: string;
  message: string;
  requires_input: boolean;
  is_complete: boolean;
  extracted_preferences?: Record<string, any>;
}

export interface TravelPlan {
  id: string;
  title: string;
  duration: string;
  budget: string;
  description: string;
  highlights: string[];
  activities: string[];
  accommodation: string;
  best_for: string;
  rating: number;
  image_color: string;
  detailed_itinerary: DayItinerary[];
  locations_included: string[];
  estimated_costs: Record<string, string | number>;
}

export interface DayItinerary {
  day: number;
  title: string;
  activities: ActivityDetail[];
}

export interface ActivityDetail {
  name: string;
  description: string;
  duration: string;
  time?: string;
}

export interface TravelPlanResponse {
  plans: TravelPlan[];
  generated_at: string;
  based_on_preferences: Record<string, any>;
  conversation_history?: ChatMessage[];
}

class AIChatService {
  /**
   * Start a new conversational AI travel planning session
   * @param initialMessage - User's opening message like "I need a 3-day adventure trip"
   * @returns Chat response with session_id and AI's reply
   */
  async startChatSession(initialMessage: string): Promise<ChatResponse> {
    const response = await apiClient.post<ChatResponse>('/ai-planner/chat/start', {
      initial_message: initialMessage,
    });
    return response.data!;
  }

  /**
   * Send a message in an existing chat conversation
   * @param sessionId - Session ID from startChatSession
   * @param message - User's response to AI's questions
   * @returns Chat response with AI's reply and conversation state
   */
  async sendMessage(sessionId: string, message: string): Promise<ChatResponse> {
    const response = await apiClient.post<ChatResponse>('/ai-planner/chat/message', {
      session_id: sessionId,
      message,
    });
    return response.data!;
  }

  /**
   * Generate travel plans from a completed chat conversation
   * @param sessionId - Session ID with is_complete=true
   * @returns 3 personalized travel plans
   */
  async generatePlansFromChat(sessionId: string): Promise<TravelPlanResponse> {
    const response = await apiClient.post<TravelPlanResponse>(
      `/ai-planner/chat/${sessionId}/generate`,
      {} // Empty body for POST request
    );
    return response.data!;
  }
}

export const aiChatService = new AIChatService();
