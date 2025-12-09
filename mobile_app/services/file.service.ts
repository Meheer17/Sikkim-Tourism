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

            // Debug logs: print file information and endpoint before uploading
            try {
                console.log('📤 [FileService] Uploading file:', {
                    fileName: request.fileName,
                    fileType: request.fileType,
                    fileSize: (request.file as any)?.size,
                    fileObj: request.file,
                    uploadEndpoint: `/upload`,
                    allowedImageFormats: config.upload.allowedImageFormats,
                });

                // Inspect FormData entries where possible (React Native FormData isn't iterable in all environments)
                if ((formData as any)._parts) {
                    // React Native FormData exposes `_parts` array
                    console.log('📤 [FileService] FormData _parts:', (formData as any)._parts.map((p: any) => ({ key: p[0], value: p[1] })));
                }
            } catch (logErr) {
                console.warn('📤 [FileService] Failed to log formData details', logErr);
            }

            const resp = await apiClient.uploadFile<FileUploadResponse>(`/upload`, formData);

            // Debug: log server response
            try {
                console.log('📥 [FileService] Upload response:', resp);
            } catch (logErr) {
                console.warn('📥 [FileService] Failed to log upload response', logErr);
            }

            return resp;
        } catch (error) {
            console.error('File upload error:', error);
            // Provide more context in the log for debugging
            try {
                console.error('File upload debug:', {
                    fileName: (error as any)?.fileName || (error as any)?.request?.fileName || null,
                    message: (error as any)?.message || error,
                    stack: (error as any)?.stack,
                });
            } catch (e) {
                // ignore
            }
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
     * Upload scanned document from file path (for document scanner)
     */
    async uploadDocument(
        filePath: string,
        category: string = 'document',
        businessId?: string,
        locationId?: string
    ): Promise<ApiResponse<FileUploadResponse>> {
        try {
            // Extract filename from path
            const fileName = filePath.split('/').pop() || `document_${Date.now()}.jpg`;
            
            // Create file object from URI
            const response = await fetch(filePath);
            const blob = await response.blob();
            
            // Determine file type - support PDF
            let fileType = blob.type || 'image/jpeg';
            if (fileName.toLowerCase().endsWith('.pdf')) {
                fileType = 'application/pdf';
            }
            
            const formData = new FormData();
            formData.append('file', {
                uri: filePath,
                type: fileType,
                name: fileName,
            } as any);
            formData.append('fileName', fileName);
            formData.append('fileType', fileType);
            formData.append('category', category);
            if (businessId) {
                formData.append('business_id', businessId);
            }
            if (locationId) {
                formData.append('location_id', locationId);
            }

            return await apiClient.uploadFile<FileUploadResponse>(`/upload/document`, formData);
        } catch (error) {
            console.error('Document upload error:', error);
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

    /**
     * Get heritage documents by category
     */
    async getHeritageDocuments(params?: {
        category?: string;
        businessId?: string;
        locationId?: string;
    }): Promise<ApiResponse<{ documents: any[] }>> {
        try {
            const queryParams = new URLSearchParams();
            if (params?.category) queryParams.append('category', params.category);
            if (params?.businessId) queryParams.append('business_id', params.businessId);
            if (params?.locationId) queryParams.append('location_id', params.locationId);

            const url = `/upload/documents?${queryParams.toString()}`;
            console.log('[FileService] Fetching documents:', url);
            
            const response = await apiClient.get<{ documents: any[] }>(url);
            console.log('[FileService] Documents response:', response);
            
            return response;
        } catch (error) {
            console.error('Get documents error:', error);
            throw error;
        }
    }

    /**
     * Delete a heritage document
     */
    async deleteHeritageDocument(fileId: string): Promise<ApiResponse<{ message: string }>> {
        try {
            console.log('[FileService] Deleting document:', fileId);
            const response = await apiClient.delete<{ message: string }>(`/upload/documents/${fileId}`);
            console.log('[FileService] Delete response:', response);
            
            return response;
        } catch (error) {
            console.error('Delete document error:', error);
            throw error;
        }
    }

    /**
     * Stitch multiple images into 360° panorama
     */
    async stitchPanorama(request: {
        files: Array<{ uri: string; type: string; name: string }>;
        mode?: 'auto' | 'cylindrical' | 'spherical';
        locationId?: string;
    }): Promise<ApiResponse<FileUploadResponse>> {
        try {
            // Validate inputs
            if (request.files.length < 2) {
                throw new Error('Need at least 2 images to stitch a panorama');
            }

            if (request.files.length > 20) {
                throw new Error('Maximum 20 images allowed per panorama');
            }

            // Create FormData
            const formData = new FormData();
            
            request.files.forEach((file, index) => {
                formData.append('files', {
                    uri: file.uri,
                    type: file.type,
                    name: file.name,
                } as any);
            });

            formData.append('mode', request.mode || 'auto');
            
            if (request.locationId) {
                formData.append('location_id', request.locationId);
            }

            console.log('📤 [FileService] Stitching panorama:', {
                imageCount: request.files.length,
                mode: request.mode || 'auto',
                locationId: request.locationId,
            });

            // Use extended timeout for panorama stitching (2 minutes)
            const resp = await apiClient.uploadFile<FileUploadResponse>(
                `/upload/stitch-panorama`, 
                formData,
                { timeout: 120000 } // 2 minutes timeout
            );

            console.log('📥 [FileService] Stitch response:', resp);

            return resp;
        } catch (error) {
            console.error('Panorama stitching error:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const fileService = new FileService();
export default fileService;