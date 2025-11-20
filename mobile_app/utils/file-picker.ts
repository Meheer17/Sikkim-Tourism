import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import { config } from '../config/api.config';
import { fileService } from '../services/file.service';

export interface PickedFile {
    uri: string;
    name: string;
    type: string;
    size: number;
}

export interface ImagePickerOptions {
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
    allowsMultipleSelection?: boolean;
}

export interface DocumentPickerOptions {
    type?: string | string[];
    copyToCacheDirectory?: boolean;
    multiple?: boolean;
}

export class FilePicker {
    /**
     * Pick image from camera or gallery
     */
    static async pickImage(options: ImagePickerOptions = {}): Promise<PickedFile[]> {
        try {
            // Request permissions
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (permissionResult.granted === false) {
                Alert.alert(
                    'Permission Required',
                    'Please allow access to your photo library to select images.',
                    [{ text: 'OK' }]
                );
                return [];
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: options.allowsEditing ?? true,
                aspect: options.aspect ?? [4, 3],
                quality: options.quality ?? 0.8,
                allowsMultipleSelection: options.allowsMultipleSelection ?? false,
            });

            if (!result.canceled) {
                return result.assets.map(asset => ({
                    uri: asset.uri,
                    name: asset.fileName || `image_${Date.now()}.jpg`,
                    type: asset.type || 'image/jpeg',
                    size: asset.fileSize || 0,
                }));
            }

            return [];
        } catch (error) {
            console.error('Image picker error:', error);
            Alert.alert('Error', 'Failed to pick image. Please try again.');
            return [];
        }
    }

    /**
     * Take photo with camera
     */
    static async takePhoto(options: ImagePickerOptions = {}): Promise<PickedFile | null> {
        try {
            // Request camera permissions
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

            if (permissionResult.granted === false) {
                Alert.alert(
                    'Permission Required',
                    'Please allow access to your camera to take photos.',
                    [{ text: 'OK' }]
                );
                return null;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: options.allowsEditing ?? true,
                aspect: options.aspect ?? [4, 3],
                quality: options.quality ?? 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                return {
                    uri: asset.uri,
                    name: asset.fileName || `photo_${Date.now()}.jpg`,
                    type: asset.type || 'image/jpeg',
                    size: asset.fileSize || 0,
                };
            }

            return null;
        } catch (error) {
            console.error('Camera error:', error);
            Alert.alert('Error', 'Failed to take photo. Please try again.');
            return null;
        }
    }

    /**
     * Pick documents
     */
    static async pickDocument(options: DocumentPickerOptions = {}): Promise<PickedFile[]> {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: options.type || '*/*',
                copyToCacheDirectory: options.copyToCacheDirectory ?? true,
                multiple: options.multiple ?? false,
            });

            if (!result.canceled) {
                if ('assets' in result && Array.isArray(result.assets)) {
                    // Multiple files
                    return result.assets.map(asset => ({
                        uri: asset.uri,
                        name: asset.name,
                        type: asset.mimeType || 'application/octet-stream',
                        size: asset.size || 0,
                    }));
                } else if ('uri' in result && typeof result.uri === 'string') {
                    // Single file (legacy format)
                    return [{
                        uri: result.uri,
                        name: (result as any).name,
                        type: (result as any).mimeType || 'application/octet-stream',
                        size: (result as any).size || 0,
                    }];
                }
            }

            return [];
        } catch (error) {
            console.error('Document picker error:', error);
            Alert.alert('Error', 'Failed to pick document. Please try again.');
            return [];
        }
    }

    /**
     * Show image picker options (camera or gallery)
     */
    static async showImagePickerOptions(options: ImagePickerOptions = {}): Promise<PickedFile[]> {
        return new Promise((resolve) => {
            Alert.alert(
                'Select Image',
                'Choose an option',
                [
                    {
                        text: 'Camera',
                        onPress: async () => {
                            const photo = await this.takePhoto(options);
                            resolve(photo ? [photo] : []);
                        },
                    },
                    {
                        text: 'Photo Library',
                        onPress: async () => {
                            const images = await this.pickImage(options);
                            resolve(images);
                        },
                    },
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => resolve([]),
                    },
                ],
                { cancelable: false }
            );
        });
    }

    /**
     * Pick files with validation
     */
    static async pickFilesWithValidation(
        type: 'image' | 'document' | 'any' = 'any',
        multiple = false
    ): Promise<PickedFile[]> {
        let files: PickedFile[] = [];

        try {
            switch (type) {
                case 'image':
                    if (Platform.OS === 'web') {
                        files = await this.pickDocument({
                            type: config.upload.allowedImageFormats.map(ext => `image/${ext}`),
                            multiple,
                        });
                    } else {
                        files = await this.pickImage({ allowsMultipleSelection: multiple });
                    }
                    break;
                case 'document':
                    files = await this.pickDocument({
                        type: config.upload.allowedDocumentFormats.map(ext => `application/${ext}`),
                        multiple,
                    });
                    break;
                case 'any':
                default:
                    files = await this.pickDocument({ multiple });
                    break;
            }

            // Validate picked files
            const validFiles: PickedFile[] = [];
            const invalidFiles: { file: PickedFile; errors: string[] }[] = [];

            for (const file of files) {
                const validation = fileService.validateFile(
                    { size: file.size } as File,
                    file.name
                );

                if (validation.isValid) {
                    validFiles.push(file);
                } else {
                    invalidFiles.push({ file, errors: validation.errors });
                }
            }

            // Show validation errors
            if (invalidFiles.length > 0) {
                const errorMessage = invalidFiles
                    .map(({ file, errors }) => `${file.name}: ${errors.join(', ')}`)
                    .join('\n');

                Alert.alert('Validation Error', errorMessage);
            }

            return validFiles;
        } catch (error) {
            console.error('File picker with validation error:', error);
            Alert.alert('Error', 'Failed to pick files. Please try again.');
            return [];
        }
    }

    /**
     * Convert PickedFile to FormData compatible format
     */
    static createFileFromPicked(pickedFile: PickedFile): File {
        if (Platform.OS === 'web') {
            // For web, assume the uri is already a File object or blob URL
            return pickedFile.uri as any;
        }

        // For mobile, create a file-like object
        return {
            uri: pickedFile.uri,
            name: pickedFile.name,
            type: pickedFile.type,
            size: pickedFile.size,
        } as any;
    }

    /**
     * Get file extension from filename
     */
    static getFileExtension(filename: string): string {
        return filename.split('.').pop()?.toLowerCase() || '';
    }

    /**
     * Check if file is an image
     */
    static isImageFile(filename: string): boolean {
        const extension = this.getFileExtension(filename);
        return config.upload.allowedImageFormats.includes(extension);
    }

    /**
     * Check if file is a document
     */
    static isDocumentFile(filename: string): boolean {
        const extension = this.getFileExtension(filename);
        return config.upload.allowedDocumentFormats.includes(extension);
    }

    /**
     * Format file size for display
     */
    static formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}