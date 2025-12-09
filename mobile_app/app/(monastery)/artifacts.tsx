import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageTranslations } from '@/constants/translations';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { monasteryService } from '@/services';
import * as DocumentPicker from 'expo-document-picker';
import Toast from 'react-native-toast-message';

interface MonasteryArtifact {
    id: string;
    name: string;
    description: string;
    category: 'manuscript' | 'artifact' | 'image' | 'document' | 'other';
    file_url?: string;
    tags?: string[];
    metadata?: Record<string, any>;
    created_at: string;
}

type ArtifactCategory = 'manuscript' | 'artifact' | 'image' | 'document' | 'other';

interface UploadFormData {
    name: string;
    description: string;
    category: ArtifactCategory;
    age: string;
    material: string;
    dimensions: string;
    historical_period: string;
    tags: string;
}

export default function ArtifactsScreen() {
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    const [artifacts, setArtifacts] = useState<MonasteryArtifact[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedFileName, setSelectedFileName] = useState('');

    const [formData, setFormData] = useState<UploadFormData>({
        name: '',
        description: '',
        category: 'artifact',
        age: '',
        material: '',
        dimensions: '',
        historical_period: '',
        tags: '',
    });

    useEffect(() => {
        loadArtifacts();
    }, []);

    const loadArtifacts = async () => {
        try {
            setLoading(true);
            const response = await monasteryService.getArtifacts({
                limit: 100,
                skip: 0,
            });

            if (response.success && response.data) {
                setArtifacts(response.data.artifacts);
            }
        } catch (error) {
            console.error('Error loading artifacts:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to load artifacts',
            });
        } finally {
            setLoading(false);
        }
    };

    const pickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf', 'text/plain', 'application/zip'],
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                setSelectedFileName(file.name);
                // Convert to File object format
                setSelectedFile({
                    uri: file.uri,
                    name: file.name,
                    type: file.mimeType || 'application/octet-stream',
                } as any);
                setFormData(prev => ({ ...prev, name: file.name.split('.')[0] }));
            }
        } catch (error: any) {
            if (!error.message?.includes('User cancelled')) {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Failed to pick file',
                });
            }
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !selectedFileName) {
            Toast.show({
                type: 'error',
                text1: 'Missing File',
                text2: 'Please select a file to upload',
            });
            return;
        }

        if (!formData.name || !formData.description) {
            Toast.show({
                type: 'error',
                text1: 'Missing Information',
                text2: 'Please fill in name and description',
            });
            return;
        }

        setUploading(true);
        try {
            const tagsArray = formData.tags
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);

            const response = await monasteryService.uploadArtifact(
                selectedFile,
                selectedFileName,
                formData.category,
                {
                    name: formData.name,
                    description: formData.description,
                    age: formData.age || undefined,
                    material: formData.material || undefined,
                    dimensions: formData.dimensions || undefined,
                    historical_period: formData.historical_period || undefined,
                    tags: tagsArray,
                }
            );

            if (response.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Artifact uploaded successfully',
                });

                // Reset form
                resetForm();
                setShowUploadModal(false);

                // Reload artifacts
                await loadArtifacts();
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Upload Failed',
                    text2: response.message || 'Failed to upload artifact',
                });
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to upload artifact',
            });
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            category: 'artifact',
            age: '',
            material: '',
            dimensions: '',
            historical_period: '',
            tags: '',
        });
        setSelectedFile(null);
        setSelectedFileName('');
    };

    const handleDeleteArtifact = (artifactId: string) => {
        Alert.alert(
            'Delete Artifact',
            'Are you sure you want to delete this artifact? This action cannot be undone.',
            [
                { text: 'Cancel', onPress: () => { }, style: 'cancel' },
                {
                    text: 'Delete',
                    onPress: async () => {
                        try {
                            const response = await monasteryService.deleteArtifact(artifactId);
                            if (response.success) {
                                Toast.show({
                                    type: 'success',
                                    text1: 'Deleted',
                                    text2: 'Artifact deleted successfully',
                                });
                                await loadArtifacts();
                            }
                        } catch (error) {
                            Toast.show({
                                type: 'error',
                                text1: 'Error',
                                text2: 'Failed to delete artifact',
                            });
                        }
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    const ArtifactItem = ({ artifact }: { artifact: MonasteryArtifact }) => (
        <View style={[styles.artifactItem, { backgroundColor: card }]}>
            <View style={styles.artifactHeader}>
                <View style={styles.artifactInfo}>
                    <Text style={[styles.artifactName, { color: text }]} numberOfLines={2}>
                        {artifact.name}
                    </Text>
                    <Text style={[styles.artifactCategory, { color: muted }]}>
                        {artifact.category.charAt(0).toUpperCase() + artifact.category.slice(1)}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => handleDeleteArtifact(artifact.id)}
                    style={[styles.deleteButton, { backgroundColor: '#fee2e2' }]}>
                    <IconSymbol size={18} name="trash.fill" color="#ef4444" />
                </TouchableOpacity>
            </View>

            <Text style={[styles.artifactDescription, { color: muted }]} numberOfLines={2}>
                {artifact.description}
            </Text>

            {artifact.metadata && (
                <View style={styles.metadataSection}>
                    {artifact.metadata.age && (
                        <View style={[styles.metadataItem, { backgroundColor: muted + '10' }]}>
                            <Text style={[styles.metadataLabel, { color: muted }]}>Age</Text>
                            <Text style={[styles.metadataValue, { color: text }]}>{artifact.metadata.age}</Text>
                        </View>
                    )}
                    {artifact.metadata.material && (
                        <View style={[styles.metadataItem, { backgroundColor: muted + '10' }]}>
                            <Text style={[styles.metadataLabel, { color: muted }]}>Material</Text>
                            <Text style={[styles.metadataValue, { color: text }]}>{artifact.metadata.material}</Text>
                        </View>
                    )}
                </View>
            )}

            {artifact.tags && artifact.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                    {artifact.tags.map((tag, index) => (
                        <View key={index} style={[styles.tag, { backgroundColor: tint + '20' }]}>
                            <Text style={[styles.tagText, { color: tint }]}>{tag}</Text>
                        </View>
                    ))}
                </View>
            )}

            <Text style={[styles.uploadDate, { color: muted }]}>
                {new Date(artifact.created_at).toLocaleDateString()}
            </Text>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={tint} />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.headerSection}>
                    <Text style={[styles.sectionTitle, { color: text }]}>
                        Artifacts & Manuscripts
                    </Text>
                    <Text style={[styles.sectionSubtitle, { color: muted }]}>
                        Total: {artifacts.length}
                    </Text>
                </View>

                {artifacts.length === 0 ? (
                    <View style={[styles.emptyState, { backgroundColor: card }]}>
                        <IconSymbol size={48} name="photo.fill" color={muted} />
                        <Text style={[styles.emptyTitle, { color: text }]}>No Artifacts Yet</Text>
                        <Text style={[styles.emptyDescription, { color: muted }]}>
                            Start by uploading images, manuscripts, or artifacts
                        </Text>
                    </View>
                ) : (
                    artifacts.map((artifact) => <ArtifactItem key={artifact.id} artifact={artifact} />)
                )}
            </ScrollView>

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: tint }]}
                onPress={() => setShowUploadModal(true)}>
                <IconSymbol size={24} name="plus.circle.fill" color="#fff" />
            </TouchableOpacity>

            {/* Upload Modal */}
            <Modal
                visible={showUploadModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowUploadModal(false)}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={[styles.modalContainer, { backgroundColor: background + 'E6' }]}>
                    <ScrollView contentContainerStyle={styles.modalContent}>
                        <View style={[styles.modalHeader, { backgroundColor: card }]}>
                            <TouchableOpacity onPress={() => setShowUploadModal(false)}>
                                <IconSymbol size={24} name="xmark.circle.fill" color={muted} />
                            </TouchableOpacity>
                            <Text style={[styles.modalTitle, { color: text }]}>Upload Artifact</Text>
                            <View style={{ width: 24 }} />
                        </View>

                        {/* File Selection */}
                        <TouchableOpacity
                            style={[styles.filePickerButton, { backgroundColor: card, borderColor: tint }]}
                            onPress={pickFile}>
                            <IconSymbol size={24} name="doc.fill" color={tint} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.filePickerTitle, { color: text }]}>
                                    {selectedFileName || 'Choose File'}
                                </Text>
                                <Text style={[styles.filePickerSubtitle, { color: muted }]}>
                                    {selectedFileName ? 'File selected' : 'Tap to select an image or document'}
                                </Text>
                            </View>
                            <IconSymbol size={20} name="chevron.right" color={muted} />
                        </TouchableOpacity>

                        {/* Form Fields */}
                        <View style={styles.formSection}>
                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: text }]}>Name*</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                    placeholder="Artifact name"
                                    placeholderTextColor={muted}
                                    value={formData.name}
                                    onChangeText={(value) => setFormData(prev => ({ ...prev, name: value }))}
                                    editable={!uploading}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: text }]}>Description*</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                    placeholder="Describe the artifact"
                                    placeholderTextColor={muted}
                                    value={formData.description}
                                    onChangeText={(value) => setFormData(prev => ({ ...prev, description: value }))}
                                    editable={!uploading}
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: text }]}>Category*</Text>
                                <View style={styles.categoryButtons}>
                                    {(['manuscript', 'artifact', 'image', 'document', 'other'] as ArtifactCategory[]).map(cat => (
                                        <TouchableOpacity
                                            key={cat}
                                            style={[
                                                styles.categoryButton,
                                                formData.category === cat
                                                    ? { backgroundColor: tint }
                                                    : { backgroundColor: card, borderColor: muted + '40', borderWidth: 1 }
                                            ]}
                                            onPress={() => setFormData(prev => ({ ...prev, category: cat }))}>
                                            <Text style={[
                                                styles.categoryButtonText,
                                                { color: formData.category === cat ? '#fff' : text }
                                            ]}>
                                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: text }]}>Age / Period</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                    placeholder="e.g., 500 years old"
                                    placeholderTextColor={muted}
                                    value={formData.age}
                                    onChangeText={(value) => setFormData(prev => ({ ...prev, age: value }))}
                                    editable={!uploading}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: text }]}>Material</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                    placeholder="e.g., Wood, Stone, Paper"
                                    placeholderTextColor={muted}
                                    value={formData.material}
                                    onChangeText={(value) => setFormData(prev => ({ ...prev, material: value }))}
                                    editable={!uploading}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: text }]}>Dimensions</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                    placeholder="e.g., 30cm x 20cm"
                                    placeholderTextColor={muted}
                                    value={formData.dimensions}
                                    onChangeText={(value) => setFormData(prev => ({ ...prev, dimensions: value }))}
                                    editable={!uploading}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: text }]}>Historical Period</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                    placeholder="e.g., Medieval Period"
                                    placeholderTextColor={muted}
                                    value={formData.historical_period}
                                    onChangeText={(value) => setFormData(prev => ({ ...prev, historical_period: value }))}
                                    editable={!uploading}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: text }]}>Tags (comma-separated)</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: card, borderColor: muted + '40', color: text }]}
                                    placeholder="e.g., religious, ancient, rare"
                                    placeholderTextColor={muted}
                                    value={formData.tags}
                                    onChangeText={(value) => setFormData(prev => ({ ...prev, tags: value }))}
                                    editable={!uploading}
                                />
                            </View>
                        </View>

                        {/* Upload Button */}
                        <TouchableOpacity
                            style={[styles.uploadButton, { backgroundColor: tint, opacity: uploading ? 0.6 : 1 }]}
                            onPress={handleUpload}
                            disabled={uploading}>
                            {uploading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <IconSymbol size={20} name="arrow.up.doc.fill" color="#fff" />
                                    <Text style={styles.uploadButtonText}>Upload Artifact</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 16,
        paddingBottom: 80,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerSection: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
    },
    artifactItem: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    artifactHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    artifactInfo: {
        flex: 1,
    },
    artifactName: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    artifactCategory: {
        fontSize: 12,
        fontWeight: '500',
    },
    deleteButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    artifactDescription: {
        fontSize: 13,
        marginBottom: 12,
        lineHeight: 18,
    },
    metadataSection: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    metadataItem: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
    },
    metadataLabel: {
        fontSize: 11,
        fontWeight: '500',
        marginBottom: 2,
    },
    metadataValue: {
        fontSize: 12,
        fontWeight: '600',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 12,
    },
    tag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    tagText: {
        fontSize: 11,
        fontWeight: '500',
    },
    uploadDate: {
        fontSize: 11,
    },
    emptyState: {
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
        marginTop: 32,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 12,
        marginBottom: 4,
    },
    emptyDescription: {
        fontSize: 13,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        flexGrow: 1,
        paddingTop: 12,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    filePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        margin: 16,
        borderWidth: 2,
        borderRadius: 12,
        borderStyle: 'dashed',
        gap: 12,
    },
    filePickerTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    filePickerSubtitle: {
        fontSize: 12,
    },
    formSection: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 16,
    },
    inputContainer: {
        gap: 6,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
    },
    categoryButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        flex: 1,
        minWidth: '30%',
        alignItems: 'center',
    },
    categoryButtonText: {
        fontSize: 12,
        fontWeight: '500',
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        margin: 16,
        borderRadius: 8,
        gap: 8,
    },
    uploadButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
});
