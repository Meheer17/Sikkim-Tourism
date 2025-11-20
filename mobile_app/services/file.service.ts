import { ApiResponse, FileUploadRequest, FileUploadResponse } from '../types/api.types';
import { apiClient } from './api.client';
import { config } from '../config/api.config';

export class FileService {
    /**
     * Upload single file
     */
    async uploadFile(request: FileUploadRequest): Promise<ApiResponse<FileUploadResponse>> {
        try {
            // Validate file size
            if (request.file.size > config.upload.maxFileSize) {
                throw new Error(
                    `File size exceeds the maximum limit of ${this.formatFileSize(config.upload.maxFileSize)}`
                );
            }

            // Validate file type
            const fileExtension = this.getFileExtension(request.fileName);
            const allowedFormats = [
                ...config.upload.allowedImageFormats,
                ...config.upload.allowedDocumentFormats,
            ];

            if (!allowedFormats.includes(fileExtension.toLowerCase())) {
                throw new Error(
                    `File type '${fileExtension}' is not allowed. Supported formats: ${allowedFormats.join(', ')}`
                );
            }

            // Create FormData
            const formData = new FormData();
            formData.append('file', request.file as any, request.fileName);
            formData.append('fileName', request.fileName);
            formData.append('fileType', request.fileType);

            if (request.category) {
                formData.append('category', request.category);
            }

            return await apiClient.uploadFile<FileUploadResponse>(config.routes.files.upload, formData);
        } catch (error) {
            console.error('File upload error:', error);
            throw error;
        }
    }

    /**
     * Upload multiple files
     */
    async uploadMultipleFiles(requests: FileUploadRequest[]): Promise<ApiResponse<FileUploadResponse[]>> {
        try {
            const formData = new FormData();

            requests.forEach((request, index) => {
                // Validate each file
                if (request.file.size > config.upload.maxFileSize) {
                    throw new Error(
                        `File '${request.fileName}' exceeds the maximum size limit`
                    );
                }

                formData.append(`files`, request.file as any, request.fileName);
                formData.append(`fileNames[${index}]`, request.fileName);
                formData.append(`fileTypes[${index}]`, request.fileType);

                if (request.category) {
                    formData.append(`categories[${index}]`, request.category);
                }
            });

            return await apiClient.uploadFile<FileUploadResponse[]>(config.routes.files.uploadMultiple, formData);
        } catch (error) {
            console.error('Multiple files upload error:', error);
            throw error;
        }
    }

    /**
     * Get file by ID
     */
    async getFile(fileId: string): Promise<ApiResponse<FileUploadResponse>> {
        return apiClient.get<FileUploadResponse>(`${config.routes.files.get}/${fileId}`);
    }

    /**
     * Get user's files with pagination
     */
    async getUserFiles(params?: {
        page?: number;
        limit?: number;
        category?: string;
        search?: string;
    }): Promise<ApiResponse<{ files: FileUploadResponse[]; total: number }>> {
        const queryParams = new URLSearchParams();

        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.category) queryParams.append('category', params.category);
        if (params?.search) queryParams.append('search', params.search);

        const url = `${config.routes.files.list}?${queryParams.toString()}`;
        return apiClient.get<{ files: FileUploadResponse[]; total: number }>(url);
    }

    /**
     * Delete file
     */
    async deleteFile(fileId: string): Promise<ApiResponse<void>> {
        return apiClient.delete<void>(`${config.routes.files.delete}/${fileId}`);
    }

    /**
     * Delete multiple files
     */
    async deleteMultipleFiles(fileIds: string[]): Promise<ApiResponse<void>> {
        return apiClient.delete<void>(config.routes.files.batchDelete, {
            data: { fileIds },
        });
    }

    /**
     * Update file metadata
     */
    async updateFileMetadata(
        fileId: string,
        metadata: {
            fileName?: string;
            category?: string;
            description?: string;
            tags?: string[];
        }
    ): Promise<ApiResponse<FileUploadResponse>> {
        return apiClient.patch<FileUploadResponse>(`${config.routes.files.updateMetadata}/${fileId}`, metadata);
    }

    /**
     * Get file download URL
     */
    async getDownloadUrl(fileId: string): Promise<ApiResponse<{ downloadUrl: string; expiresAt: string }>> {
        const url = config.routes.files.downloadUrl.replace(':id', fileId);
        return apiClient.get<{ downloadUrl: string; expiresAt: string }>(url);
    }

    /**
     * Get file thumbnail (for images)
     */
    async getThumbnailUrl(
        fileId: string,
        size: 'small' | 'medium' | 'large' = 'medium'
    ): Promise<ApiResponse<{ thumbnailUrl: string }>> {
        const url = config.routes.files.thumbnail.replace(':id', fileId) + `?size=${size}`;
        return apiClient.get<{ thumbnailUrl: string }>(url);
    }

    /**
     * Validate file before upload
     */
    validateFile(file: File | Blob, fileName: string): {
        isValid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        // Check file size
        if (file.size > config.upload.maxFileSize) {
            errors.push(`File size exceeds the maximum limit of ${this.formatFileSize(config.upload.maxFileSize)}`);
        }

        // Check file extension
        const fileExtension = this.getFileExtension(fileName);
        const allowedFormats = [
            ...config.upload.allowedImageFormats,
            ...config.upload.allowedDocumentFormats,
        ];

        if (!allowedFormats.includes(fileExtension.toLowerCase())) {
            errors.push(`File type '${fileExtension}' is not allowed. Supported formats: ${allowedFormats.join(', ')}`);
        }

        // Check if file is empty
        if (file.size === 0) {
            errors.push('File is empty');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Helper method to get file extension
     */
    private getFileExtension(fileName: string): string {
        return fileName.split('.').pop() || '';
    }

    /**
     * Helper method to format file size
     */
    private formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Check if file is an image
     */
    isImageFile(fileName: string): boolean {
        const extension = this.getFileExtension(fileName).toLowerCase();
        return config.upload.allowedImageFormats.includes(extension);
    }

    /**
     * Check if file is a document
     */
    isDocumentFile(fileName: string): boolean {
        const extension = this.getFileExtension(fileName).toLowerCase();
        return config.upload.allowedDocumentFormats.includes(extension);
    }
}

// Export singleton instance
export const fileService = new FileService();
export default fileService;