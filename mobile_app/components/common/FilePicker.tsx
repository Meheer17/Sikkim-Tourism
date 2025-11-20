import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { FilePicker as FilePickerUtil, PickedFile } from '../../utils/file-picker';
import { fileService } from '../../services/file.service';
import { FileUploadResponse } from '../../types/api.types';
import Toast from 'react-native-toast-message';

interface FilePickerProps {
    onFilesSelected?: (files: FileUploadResponse[]) => void;
    onError?: (error: string) => void;
    maxFiles?: number;
    allowedTypes?: 'image' | 'document' | 'any';
    showPreview?: boolean;
    uploadImmediately?: boolean;
}

export const FilePicker: React.FC<FilePickerProps> = ({
    onFilesSelected,
    onError,
    maxFiles = 5,
    allowedTypes = 'any',
    showPreview = true,
    uploadImmediately = true,
}) => {
    const [selectedFiles, setSelectedFiles] = useState<PickedFile[]>([]);
    const [uploadedFiles, setUploadedFiles] = useState<FileUploadResponse[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

    const handleFilePick = async () => {
        try {
            const files = await FilePickerUtil.pickFilesWithValidation(
                allowedTypes,
                maxFiles > 1
            );

            if (files.length === 0) return;

            // Check if adding these files exceeds the limit
            const totalFiles = selectedFiles.length + files.length;
            if (totalFiles > maxFiles) {
                Alert.alert(
                    'Too Many Files',
                    `You can only select up to ${maxFiles} files. Please remove some files first.`
                );
                return;
            }

            setSelectedFiles(prev => [...prev, ...files]);

            if (uploadImmediately) {
                await uploadFiles(files);
            }
        } catch (error: any) {
            const errorMessage = error.message || 'Failed to pick files';
            onError?.(errorMessage);
            Toast.show({
                type: 'error',
                text1: 'File Selection Error',
                text2: errorMessage,
            });
        }
    };

    const handleImagePick = async () => {
        try {
            const files = await FilePickerUtil.showImagePickerOptions({
                allowsMultipleSelection: maxFiles > 1,
                quality: 0.8,
                allowsEditing: true,
            });

            if (files.length === 0) return;

            const totalFiles = selectedFiles.length + files.length;
            if (totalFiles > maxFiles) {
                Alert.alert(
                    'Too Many Files',
                    `You can only select up to ${maxFiles} files. Please remove some files first.`
                );
                return;
            }

            setSelectedFiles(prev => [...prev, ...files]);

            if (uploadImmediately) {
                await uploadFiles(files);
            }
        } catch (error: any) {
            const errorMessage = error.message || 'Failed to pick images';
            onError?.(errorMessage);
            Toast.show({
                type: 'error',
                text1: 'Image Selection Error',
                text2: errorMessage,
            });
        }
    };

    const uploadFiles = async (files: PickedFile[]) => {
        try {
            setUploading(true);
            const uploadedResults: FileUploadResponse[] = [];

            for (const file of files) {
                setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

                try {
                    const fileForUpload = FilePickerUtil.createFileFromPicked(file);
                    const category = FilePickerUtil.isImageFile(file.name)
                        ? 'image'
                        : FilePickerUtil.isDocumentFile(file.name)
                            ? 'document'
                            : 'other';

                    const response = await fileService.uploadFile({
                        file: fileForUpload,
                        fileName: file.name,
                        fileType: file.type,
                        category,
                    });

                    if (response.success && response.data) {
                        uploadedResults.push(response.data);
                        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
                    }
                } catch (uploadError: any) {
                    console.error('File upload error:', uploadError);
                    const errorMsg = uploadError.response?.data?.message || uploadError.message || 'Upload failed';

                    Toast.show({
                        type: 'error',
                        text1: 'Upload Failed',
                        text2: `Failed to upload ${file.name}: ${errorMsg}`,
                    });
                }
            }

            setUploadedFiles(prev => [...prev, ...uploadedResults]);
            onFilesSelected?.(uploadedResults);

            if (uploadedResults.length > 0) {
                Toast.show({
                    type: 'success',
                    text1: 'Upload Complete',
                    text2: `Successfully uploaded ${uploadedResults.length} file(s)`,
                });
            }
        } catch (error: any) {
            const errorMessage = error.message || 'Upload failed';
            onError?.(errorMessage);
            Toast.show({
                type: 'error',
                text1: 'Upload Error',
                text2: errorMessage,
            });
        } finally {
            setUploading(false);
            setUploadProgress({});
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeUploadedFile = async (index: number) => {
        const file = uploadedFiles[index];
        if (file) {
            try {
                await fileService.deleteFile(file.id);
                setUploadedFiles(prev => prev.filter((_, i) => i !== index));
                Toast.show({
                    type: 'success',
                    text1: 'File Deleted',
                    text2: 'File has been removed successfully',
                });
            } catch (error: any) {
                Toast.show({
                    type: 'error',
                    text1: 'Delete Failed',
                    text2: 'Failed to delete file',
                });
            }
        }
    };

    const renderFileItem = ({ item, index }: { item: PickedFile; index: number }) => {
        const isImage = FilePickerUtil.isImageFile(item.name);
        const progress = uploadProgress[item.name];

        return (
            <View style={styles.fileItem}>
                {isImage && showPreview ? (
                    <Image source={{ uri: item.uri }} style={styles.filePreview} />
                ) : (
                    <View style={styles.fileIcon}>
                        <Text style={styles.fileIconText}>📄</Text>
                    </View>
                )}

                <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text style={styles.fileSize}>
                        {FilePickerUtil.formatFileSize(item.size)}
                    </Text>

                    {progress !== undefined && (
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBar}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        { width: `${progress}%` },
                                    ]}
                                />
                            </View>
                            <Text style={styles.progressText}>{progress}%</Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFile(index)}
                >
                    <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderUploadedFile = ({ item, index }: { item: FileUploadResponse; index: number }) => {
        const isImage = item.category === 'image';

        return (
            <View style={styles.fileItem}>
                {isImage && showPreview ? (
                    <Image source={{ uri: item.thumbnailUrl || item.url }} style={styles.filePreview} />
                ) : (
                    <View style={styles.fileIcon}>
                        <Text style={styles.fileIconText}>📄</Text>
                    </View>
                )}

                <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>
                        {item.fileName}
                    </Text>
                    <Text style={styles.fileSize}>
                        {FilePickerUtil.formatFileSize(item.size)}
                    </Text>
                    <Text style={styles.uploadedLabel}>✓ Uploaded</Text>
                </View>

                <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeUploadedFile(index)}
                >
                    <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>File Upload</Text>

            <View style={styles.buttonContainer}>
                {(allowedTypes === 'image' || allowedTypes === 'any') && (
                    <TouchableOpacity style={styles.pickButton} onPress={handleImagePick}>
                        <Text style={styles.buttonText}>📷 Pick Images</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.pickButton} onPress={handleFilePick}>
                    <Text style={styles.buttonText}>📁 Pick Files</Text>
                </TouchableOpacity>
            </View>

            {uploading && (
                <View style={styles.uploadingContainer}>
                    <ActivityIndicator size="small" color="#007bff" />
                    <Text style={styles.uploadingText}>Uploading files...</Text>
                </View>
            )}

            {selectedFiles.length > 0 && (
                <View style={styles.filesContainer}>
                    <Text style={styles.sectionTitle}>Selected Files</Text>
                    <FlatList
                        data={selectedFiles}
                        renderItem={renderFileItem}
                        keyExtractor={(item, index) => `selected-${index}`}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            )}

            {uploadedFiles.length > 0 && (
                <View style={styles.filesContainer}>
                    <Text style={styles.sectionTitle}>Uploaded Files</Text>
                    <FlatList
                        data={uploadedFiles}
                        renderItem={renderUploadedFile}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            )}

            {!uploadImmediately && selectedFiles.length > 0 && (
                <TouchableOpacity
                    style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                    onPress={() => uploadFiles(selectedFiles)}
                    disabled={uploading}
                >
                    <Text style={styles.uploadButtonText}>
                        {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    buttonContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 12,
    },
    pickButton: {
        flex: 1,
        backgroundColor: '#007bff',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    uploadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#f0f8ff',
        borderRadius: 8,
    },
    uploadingText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#007bff',
    },
    filesContainer: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    fileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        marginBottom: 8,
    },
    filePreview: {
        width: 40,
        height: 40,
        borderRadius: 8,
        marginRight: 12,
    },
    fileIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#e0e0e0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    fileIconText: {
        fontSize: 20,
    },
    fileInfo: {
        flex: 1,
    },
    fileName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 2,
    },
    fileSize: {
        fontSize: 12,
        color: '#666666',
    },
    uploadedLabel: {
        fontSize: 12,
        color: '#44aa44',
        fontWeight: '600',
        marginTop: 2,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    progressBar: {
        flex: 1,
        height: 4,
        backgroundColor: '#e0e0e0',
        borderRadius: 2,
        marginRight: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#007bff',
        borderRadius: 2,
    },
    progressText: {
        fontSize: 12,
        color: '#666666',
        minWidth: 35,
    },
    removeButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#ff4444',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    removeButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    uploadButton: {
        backgroundColor: '#28a745',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    uploadButtonDisabled: {
        backgroundColor: '#cccccc',
    },
    uploadButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});