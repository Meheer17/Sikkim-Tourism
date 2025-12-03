import { apiClient } from './api.client';

export interface Question {
    id: string;
    question: string;
    type: 'single' | 'multiple';
    options: string[];
}

export interface Answer {
    question_id: string;
    answer: string | string[];
}

export interface ActivityDetail {
    name: string;
    description: string;
    duration: string;
    time?: string;
}

export interface DayItinerary {
    day: number;
    title: string;
    activities: ActivityDetail[];
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
    estimated_costs: {
        accommodation: number;
        food: number;
        transport: number;
        activities: number;
        miscellaneous: number;
    };
}

export interface TravelPlanResponse {
    plans: TravelPlan[];
    generated_at: string;
    based_on_preferences: Record<string, any>;
}

class AIPlannerService {
    /**
     * Get the questionnaire for AI travel planning
     */
    async getQuestions(): Promise<Question[]> {
        const response = await apiClient.get<Question[]>('/ai-planner/questions');
        return response.data || [];
    }

    /**
     * Generate personalized travel plans based on user answers
     */
    async generateTravelPlans(answers: Answer[]): Promise<TravelPlanResponse> {
        const response = await apiClient.post<TravelPlanResponse>('/ai-planner/generate', {
            answers: answers
        });
        return response.data!;
    }
}

export const aiPlannerService = new AIPlannerService();
