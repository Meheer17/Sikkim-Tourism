import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { DocumentScannerButton, ScannedDocumentPreview } from '@/components/common/DocumentScanner';
import { fileService } from '@/services';

interface HeritageDocument {
    uri: string;
    fileName: string;
}

interface UploadedDocument {
    _id: string;
    file_name: string;
    file_path: string;
    category: string;
    created_at: string;
}

export default function UploadHeritageScreen() {
    const { businessId, businessName } = useLocalSearchParams();
    const [manuscripts, setManuscripts] = useState<HeritageDocument[]>([]);
    const [scriptures, setScriptures] = useState<HeritageDocument[]>([]);
    const [artifacts, setArtifacts] = useState<HeritageDocument[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    
    // Uploaded documents from backend
    const [uploadedManuscripts, setUploadedManuscripts] = useState<UploadedDocument[]>([]);
    const [uploadedScriptures, setUploadedScriptures] = useState<UploadedDocument[]>([]);
    const [uploadedArtifacts, setUploadedArtifacts] = useState<UploadedDocument[]>([]);

    const theme = {
        background: useThemeColor('background'),
        card: useThemeColor('card'),
        text: useThemeColor('text'),
        tint: useThemeColor('tint'),
        border: useThemeColor('border'),
        mutedText: useThemeColor('mutedText'),
    };

    useEffect(() => {
        loadUploadedDocuments();
    }, []);

    const loadUploadedDocuments = async () => {
        setLoading(true);
        try {
            const params = businessId ? { businessId: businessId as string } : {};
            
            // Load manuscripts
            const manuscriptsResp = await fileService.getHeritageDocuments({ 
                category: 'heritage_manuscript',
                ...params
            });
            if (manuscriptsResp.success && manuscriptsResp.data) {
                setUploadedManuscripts(manuscriptsResp.data.documents || []);
            }

            // Load scriptures
            const scripturesResp = await fileService.getHeritageDocuments({ 
                category: 'heritage_scripture',
                ...params
            });
            if (scripturesResp.success && scripturesResp.data) {
                setUploadedScriptures(scripturesResp.data.documents || []);
            }

            // Load artifacts
            const artifactsResp = await fileService.getHeritageDocuments({ 
                category: 'heritage_artifact',
                ...params
            });
            if (artifactsResp.success && artifactsResp.data) {
                setUploadedArtifacts(artifactsResp.data.documents || []);
            }
        } catch (error: any) {
            console.error('Error loading documents:', error);
            Alert.alert('Error', 'Failed to load uploaded documents');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDocument = async (fileId: string, category: string) => {
        Alert.alert(
            'Delete Document',
            'Are you sure you want to delete this document? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const resp = await fileService.deleteHeritageDocument(fileId);
                            if (resp.success) {
                                Alert.alert('Success', 'Document deleted successfully');
                                loadUploadedDocuments(); // Reload documents
                            } else {
                                Alert.alert('Error', 'Failed to delete document');
                            }
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to delete document');
                        }
                    },
                },
            ]
        );
    };

    const removeManuscript = (index: number) => {
        setManuscripts(manuscripts.filter((_, i) => i !== index));
    };

    const removeScripture = (index: number) => {
        setScriptures(scriptures.filter((_, i) => i !== index));
    };

    const removeArtifact = (index: number) => {
        setArtifacts(artifacts.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        const totalDocuments = manuscripts.length + scriptures.length + artifacts.length;
        
        if (totalDocuments === 0) {
            Alert.alert('No Documents', 'Please scan at least one heritage document before uploading.');
            return;
        }

        setUploading(true);
        let successCount = 0;
        let failCount = 0;

        try {
            console.log(`Starting upload of ${totalDocuments} documents...`);
            
            const businessIdStr = businessId as string;
            
            // Upload manuscripts
            for (const doc of manuscripts) {
                try {
                    console.log(`Uploading manuscript: ${doc.fileName}`);
                    const result = await fileService.uploadDocument(doc.uri, 'heritage_manuscript', businessIdStr);
                    if (result.success) {
                        successCount++;
                        console.log(`✓ Uploaded: ${doc.fileName}`);
                    } else {
                        failCount++;
                        console.error(`✗ Failed: ${doc.fileName}`, result.message);
                    }
                } catch (error: any) {
                    failCount++;
                    console.error(`✗ Error uploading ${doc.fileName}:`, error.message);
                }
            }

            // Upload scriptures
            for (const doc of scriptures) {
                try {
                    console.log(`Uploading scripture: ${doc.fileName}`);
                    const result = await fileService.uploadDocument(doc.uri, 'heritage_scripture', businessIdStr);
                    if (result.success) {
                        successCount++;
                        console.log(`✓ Uploaded: ${doc.fileName}`);
                    } else {
                        failCount++;
                        console.error(`✗ Failed: ${doc.fileName}`, result.message);
                    }
                } catch (error: any) {
                    failCount++;
                    console.error(`✗ Error uploading ${doc.fileName}:`, error.message);
                }
            }

            // Upload artifacts
            for (const doc of artifacts) {
                try {
                    console.log(`Uploading artifact: ${doc.fileName}`);
                    const result = await fileService.uploadDocument(doc.uri, 'heritage_artifact', businessIdStr);
                    if (result.success) {
                        successCount++;
                        console.log(`✓ Uploaded: ${doc.fileName}`);
                    } else {
                        failCount++;
                        console.error(`✗ Failed: ${doc.fileName}`, result.message);
                    }
                } catch (error: any) {
                    failCount++;
                    console.error(`✗ Error uploading ${doc.fileName}:`, error.message);
                }
            }

            if (failCount === 0) {
                // Clear scanned documents
                setManuscripts([]);
                setScriptures([]);
                setArtifacts([]);
                
                // Reload uploaded documents
                await loadUploadedDocuments();
                
                Alert.alert(
                    'Upload Successful',
                    `All ${successCount} heritage documents uploaded successfully.`
                );
            } else {
                // Reload uploaded documents even if some failed
                await loadUploadedDocuments();
                
                Alert.alert(
                    'Upload Complete',
                    `${successCount} documents uploaded successfully.\n${failCount} documents failed to upload.`
                );
            }
        } catch (error: any) {
            Alert.alert('Upload Error', error.message || 'Failed to upload heritage documents');
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <IconSymbol name="chevron.left" size={24} color={theme.tint} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Upload Heritage Documents</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.mutedText }]}>
                        {businessName || 'Heritage Site'}
                    </Text>
                </View>
                {loading && <ActivityIndicator size="small" color={theme.tint} />}
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Manuscripts Section */}
                <View style={[styles.section, { backgroundColor: theme.card }]}>
                    <View style={styles.sectionHeader}>
                        <IconSymbol name="book.closed" size={24} color={theme.tint} />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Ancient Manuscripts ({manuscripts.length})
                        </Text>
                    </View>
                    <Text style={[styles.sectionDescription, { color: theme.mutedText }]}>
                        Scan historical manuscripts, ancient texts, and handwritten documents
                    </Text>

                    <DocumentScannerButton 
                        onDocumentsScanned={(images) => {
                            const newDocs = images.map((uri, index) => ({
                                uri,
                                fileName: `manuscript_${Date.now()}_${index + 1}.jpg`,
                            }));
                            setManuscripts([...manuscripts, ...newDocs]);
                        }}
                        buttonText="Scan Manuscripts" 
                    />

                    {manuscripts.length > 0 && (
                        <ScannedDocumentPreview
                            documents={manuscripts.map(doc => doc.uri)}
                            onRemove={removeManuscript}
                        />
                    )}

                    {/* Display uploaded manuscripts */}
                    {uploadedManuscripts.length > 0 && (
                        <View style={styles.uploadedSection}>
                            <Text style={[styles.uploadedTitle, { color: theme.text }]}>
                                Uploaded ({uploadedManuscripts.length})
                            </Text>
                            {uploadedManuscripts.map((doc) => (
                                <View key={doc._id} style={[styles.uploadedItem, { borderColor: theme.border }]}>
                                    <Image source={{ uri: doc.file_path }} style={styles.uploadedThumbnail} />
                                    <View style={styles.uploadedInfo}>
                                        <Text style={[styles.uploadedFileName, { color: theme.text }]} numberOfLines={1}>
                                            {doc.file_name}
                                        </Text>
                                        <Text style={[styles.uploadedDate, { color: theme.mutedText }]}>
                                            {new Date(doc.created_at).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleDeleteDocument(doc._id, doc.category)}
                                        style={styles.deleteButton}
                                    >
                                        <IconSymbol name="trash" size={20} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Scriptures Section */}
                <View style={[styles.section, { backgroundColor: theme.card }]}>
                    <View style={styles.sectionHeader}>
                        <IconSymbol name="book" size={24} color={theme.tint} />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Religious Scriptures ({scriptures.length})
                        </Text>
                    </View>
                    <Text style={[styles.sectionDescription, { color: theme.mutedText }]}>
                        Scan religious texts, sacred scriptures, and spiritual documents
                    </Text>

                    <DocumentScannerButton 
                        onDocumentsScanned={(images) => {
                            const newDocs = images.map((uri, index) => ({
                                uri,
                                fileName: `scripture_${Date.now()}_${index + 1}.jpg`,
                            }));
                            setScriptures([...scriptures, ...newDocs]);
                        }}
                        buttonText="Scan Scriptures" 
                    />

                    {scriptures.length > 0 && (
                        <ScannedDocumentPreview
                            documents={scriptures.map(doc => doc.uri)}
                            onRemove={removeScripture}
                        />
                    )}

                    {/* Display uploaded scriptures */}
                    {uploadedScriptures.length > 0 && (
                        <View style={styles.uploadedSection}>
                            <Text style={[styles.uploadedTitle, { color: theme.text }]}>
                                Uploaded ({uploadedScriptures.length})
                            </Text>
                            {uploadedScriptures.map((doc) => (
                                <View key={doc._id} style={[styles.uploadedItem, { borderColor: theme.border }]}>
                                    <Image source={{ uri: doc.file_path }} style={styles.uploadedThumbnail} />
                                    <View style={styles.uploadedInfo}>
                                        <Text style={[styles.uploadedFileName, { color: theme.text }]} numberOfLines={1}>
                                            {doc.file_name}
                                        </Text>
                                        <Text style={[styles.uploadedDate, { color: theme.mutedText }]}>
                                            {new Date(doc.created_at).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleDeleteDocument(doc._id, doc.category)}
                                        style={styles.deleteButton}
                                    >
                                        <IconSymbol name="trash" size={20} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Artifacts Section */}
                <View style={[styles.section, { backgroundColor: theme.card }]}>
                    <View style={styles.sectionHeader}>
                        <IconSymbol name="photo" size={24} color={theme.tint} />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Cultural Artifacts ({artifacts.length})
                        </Text>
                    </View>
                    <Text style={[styles.sectionDescription, { color: theme.mutedText }]}>
                        Scan photos/records of artifacts, relics, and cultural treasures
                    </Text>

                    <DocumentScannerButton 
                        onDocumentsScanned={(images) => {
                            const newDocs = images.map((uri, index) => ({
                                uri,
                                fileName: `artifact_${Date.now()}_${index + 1}.jpg`,
                            }));
                            setArtifacts([...artifacts, ...newDocs]);
                        }}
                        buttonText="Scan Artifacts" 
                    />

                    {artifacts.length > 0 && (
                        <ScannedDocumentPreview
                            documents={artifacts.map(doc => doc.uri)}
                            onRemove={removeArtifact}
                        />
                    )}

                    {/* Display uploaded artifacts */}
                    {uploadedArtifacts.length > 0 && (
                        <View style={styles.uploadedSection}>
                            <Text style={[styles.uploadedTitle, { color: theme.text }]}>
                                Uploaded ({uploadedArtifacts.length})
                            </Text>
                            {uploadedArtifacts.map((doc) => (
                                <View key={doc._id} style={[styles.uploadedItem, { borderColor: theme.border }]}>
                                    <Image source={{ uri: doc.file_path }} style={styles.uploadedThumbnail} />
                                    <View style={styles.uploadedInfo}>
                                        <Text style={[styles.uploadedFileName, { color: theme.text }]} numberOfLines={1}>
                                            {doc.file_name}
                                        </Text>
                                        <Text style={[styles.uploadedDate, { color: theme.mutedText }]}>
                                            {new Date(doc.created_at).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleDeleteDocument(doc._id, doc.category)}
                                        style={styles.deleteButton}
                                    >
                                        <IconSymbol name="trash" size={20} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Upload Button */}
                <TouchableOpacity
                    style={[
                        styles.uploadButton,
                        { backgroundColor: theme.tint },
                        (manuscripts.length + scriptures.length + artifacts.length === 0 || uploading) && styles.uploadButtonDisabled,
                    ]}
                    onPress={handleUpload}
                    disabled={manuscripts.length + scriptures.length + artifacts.length === 0 || uploading}
                >
                    {uploading ? (
                        <>
                            <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} />
                            <Text style={styles.uploadButtonText}>Uploading...</Text>
                        </>
                    ) : (
                        <>
                            <IconSymbol name="icloud.and.arrow.up" size={20} color="#FFFFFF" />
                            <Text style={styles.uploadButtonText}>
                                Upload {manuscripts.length + scriptures.length + artifacts.length} Documents
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        marginRight: 12,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 12,
    },
    sectionDescription: {
        fontSize: 14,
        marginBottom: 16,
        lineHeight: 20,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 32,
    },
    uploadButtonDisabled: {
        opacity: 0.5,
    },
    uploadButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    uploadedSection: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    uploadedTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    uploadedItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 8,
    },
    uploadedThumbnail: {
        width: 60,
        height: 60,
        borderRadius: 6,
        backgroundColor: '#f3f4f6',
    },
    uploadedInfo: {
        flex: 1,
        marginLeft: 12,
    },
    uploadedFileName: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    uploadedDate: {
        fontSize: 12,
    },
    deleteButton: {
        padding: 8,
    },
});
