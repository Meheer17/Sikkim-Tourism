import { BaseService } from './base.service';

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
        return this.request<CommentModel[]>({
            method: 'GET',
            endpoint: `${this.baseEndpoint}/service/${serviceId}?skip=${skip}&limit=${limit}`,
        });
    }

    async createComment(data: CommentCreate) {
        return this.request<CommentModel>({
            method: 'POST',
            endpoint: this.baseEndpoint,
            data,
        });
    }
}

export const commentsService = new CommentsService();
