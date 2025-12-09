import { BaseService } from './base.service';
import { apiClient } from './api.client';

export interface CommentModel {
    id: string;
    user_id: string;
    service_id: string;
    text: string;
    rating?: number;
    created_at: string;
    updated_at: string;
    user_name?: string;
    user_avatar?: string;
}

export interface CommentCreate {
    service_id: string;
    text: string;
    rating?: number;
}

class CommentsService extends BaseService<CommentModel> {
    constructor() {
        super('/comments');
    }

    async getByService(serviceId: string, skip = 0, limit = 50) {
        return apiClient.get<CommentModel[]>(
            `${this.baseUrl}/service/${serviceId}?skip=${skip}&limit=${limit}`
        );
    }

    async createComment(data: CommentCreate) {
        return apiClient.post<CommentModel>(this.baseUrl, data);
    }
}

export const commentsService = new CommentsService();
