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
    TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { businessService, fileService } from '@/services';
import * as ImagePicker from 'expo-image-picker';

export default function BusinessEditProfile() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    
    const [business, setBusiness] = useState<any>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [bannerImage, setBannerImage] = useState<string | null>(null);
    const [images, setImages] = useState<string[]>([]);

    const theme = {
        background: useThemeColor('background'),
        card: useThemeColor('card'),
        text: useThemeColor('text'),
        tint: useThemeColor('tint'),
        border: useThemeColor('border'),
        mutedText: useThemeColor('mutedText'),
    };

    useEffect(() => {
        loadBusinessProfile();
    }, []);

    const loadBusinessProfile = async () => {
        setLoading(true);
        try {
            const response = await businessService.mine();
            if (response.success && response.data && response.data.length > 0) {
                const biz = response.data[0];
                setBusiness(biz);
                setName(biz.name || '');
                setDescription(biz.description || '');
                setShortDescription(biz.short_description || '');
                setBannerImage(biz.banner_image || null);
                setImages(biz.images || []);
            }
        } catch (error: any) {
            Alert.alert('Error', 'Failed to load business profile');
        } finally {
            setLoading(false);
        }
    };

    const pickBannerImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            await uploadBannerImage(result.assets[0].uri);
        }
    };

    const uploadBannerImage = async (uri: string) => {
        setUploadingBanner(true);
        try {
            const response = await fileService.uploadDocument(uri, 'business_banner', business?.id);
            if (response.success && response.data) {
                setBannerImage(response.data.cdn_url || response.data.url);
                Alert.alert('Success', 'Banner image uploaded successfully');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to upload banner image');
        } finally {
            setUploadingBanner(false);
        }
    };

    const pickGalleryImages = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            for (const asset of result.assets) {
                await uploadGalleryImage(asset.uri);
            }
        }
    };

    const uploadGalleryImage = async (uri: string) => {
        setUploadingImage(true);
        try {
            const response = await fileService.uploadDocument(uri, 'business_gallery', business?.id);
            if (response.success && response.data) {
                const imageUrl = response.data.url;
                setImages(prev => [...prev, imageUrl]);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to upload image');
        } finally {
            setUploadingImage(false);
        }
    };

    const removeGalleryImage = (index: number) => {
        Alert.alert(
            'Remove Image',
            'Are you sure you want to remove this image?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        setImages(prev => prev.filter((_, i) => i !== index));
                    },
                },
            ]
        );
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Business name is required');
            return;
        }

        if (!shortDescription.trim()) {
            Alert.alert('Error', 'Short description is required');
            return;
        }

        setSaving(true);
        try {
            const updateData: any = {
                name: name.trim(),
                description: description.trim(),
                short_description: shortDescription.trim(),
            };

            if (bannerImage) {
                updateData.banner_image = bannerImage;
            }

            if (images.length > 0) {
                updateData.images = images;
            }

            const response = await businessService.update(business.id, updateData);
            if (response.success) {
                Alert.alert('Success', 'Business profile updated successfully', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('Error', response.message || 'Failed to update profile');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                    <TouchableOpacity style={styles.back} onPress={() => router.back()}>
                        <IconSymbol name="chevron.left" size={24} color={theme.tint} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.tint} />
                    <Text style={[styles.loadingText, { color: theme.mutedText }]}>Loading...</Text>
                </View>
            </View>
        );
    }

    if (!business) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                    <TouchableOpacity style={styles.back} onPress={() => router.back()}>
                        <IconSymbol name="chevron.left" size={24} color={theme.tint} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.emptyContainer}>
                    <IconSymbol name="exclamationmark.triangle" size={64} color={theme.mutedText} />
                    <Text style={[styles.emptyText, { color: theme.text }]}>No Business Found</Text>
                    <Text style={[styles.emptySubtext, { color: theme.mutedText }]}>
                        Please create a business first
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <TouchableOpacity style={styles.back} onPress={() => router.back()}>
                    <IconSymbol name="chevron.left" size={24} color={theme.tint} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
                <TouchableOpacity 
                    onPress={handleSave} 
                    disabled={saving}
                    style={styles.saveButton}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color={theme.tint} />
                    ) : (
                        <Text style={[styles.saveText, { color: theme.tint }]}>Save</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Banner Image Section */}
                <View style={[styles.section, { backgroundColor: theme.card }]}>
                    <View style={styles.sectionHeader}>
                        <IconSymbol name="photo" size={24} color={theme.tint} />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Banner Image</Text>
                    </View>
                    <Text style={[styles.sectionDescription, { color: theme.mutedText }]}>
                        Upload a banner image for your business (16:9 recommended)
                    </Text>

                    <TouchableOpacity
                        style={[styles.bannerContainer, { borderColor: theme.border }]}
                        onPress={pickBannerImage}
                        disabled={uploadingBanner}
                    >
                        {bannerImage ? (
                            <Image source={{ uri: bannerImage }} style={styles.bannerImage} />
                        ) : (
                            <View style={styles.bannerPlaceholder}>
                                <IconSymbol name="photo.on.rectangle" size={48} color={theme.mutedText} />
                                <Text style={[styles.bannerPlaceholderText, { color: theme.mutedText }]}>
                                    Tap to upload banner
                                </Text>
                            </View>
                        )}
                        {uploadingBanner && (
                            <View style={styles.uploadingOverlay}>
                                <ActivityIndicator size="large" color="#fff" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Gallery Images Section */}
                <View style={[styles.section, { backgroundColor: theme.card }]}>
                    <View style={styles.sectionHeader}>
                        <IconSymbol name="photo.stack" size={24} color={theme.tint} />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Gallery Images ({images.length})
                        </Text>
                    </View>
                    <Text style={[styles.sectionDescription, { color: theme.mutedText }]}>
                        Upload photos of your business, facilities, or products
                    </Text>

                    <TouchableOpacity
                        style={[styles.uploadButton, { backgroundColor: theme.tint }]}
                        onPress={pickGalleryImages}
                        disabled={uploadingImage}
                    >
                        {uploadingImage ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <IconSymbol name="plus" size={20} color="#fff" />
                                <Text style={styles.uploadButtonText}>Add Images</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {images.length > 0 && (
                        <View style={styles.galleryGrid}>
                            {images.map((imageUrl, index) => (
                                <View key={index} style={styles.galleryItem}>
                                    <Image source={{ uri: imageUrl }} style={styles.galleryImage} />
                                    <TouchableOpacity
                                        style={styles.removeButton}
                                        onPress={() => removeGalleryImage(index)}
                                    >
                                        <IconSymbol name="xmark.circle.fill" size={24} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Business Details Section */}
                <View style={[styles.section, { backgroundColor: theme.card }]}>
                    <View style={styles.sectionHeader}>
                        <IconSymbol name="info.circle" size={24} color={theme.tint} />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Business Details</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>Business Name *</Text>
                        <TextInput
                            style={[styles.input, { 
                                backgroundColor: theme.background, 
                                borderColor: theme.border,
                                color: theme.text 
                            }]}
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter business name"
                            placeholderTextColor={theme.mutedText}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>Short Description *</Text>
                        <TextInput
                            style={[styles.input, { 
                                backgroundColor: theme.background, 
                                borderColor: theme.border,
                                color: theme.text 
                            }]}
                            value={shortDescription}
                            onChangeText={setShortDescription}
                            placeholder="Brief description (max 255 characters)"
                            placeholderTextColor={theme.mutedText}
                            maxLength={255}
                        />
                        <Text style={[styles.charCount, { color: theme.mutedText }]}>
                            {shortDescription.length}/255
                        </Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>Full Description</Text>
                        <TextInput
                            style={[styles.textArea, { 
                                backgroundColor: theme.background, 
                                borderColor: theme.border,
                                color: theme.text 
                            }]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Detailed description of your business"
                            placeholderTextColor={theme.mutedText}
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                        />
                    </View>
                </View>

                <View style={{ height: 40 }} />
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
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    back: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    saveButton: {
        width: 60,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    saveText: {
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
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
    bannerContainer: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        overflow: 'hidden',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    bannerPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bannerPlaceholderText: {
        marginTop: 12,
        fontSize: 14,
    },
    uploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 8,
        marginBottom: 16,
    },
    uploadButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    galleryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -4,
    },
    galleryItem: {
        width: '31.333%',
        aspectRatio: 1,
        margin: 4,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    galleryImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeButton: {
        position: 'absolute',
        top: 4,
        right: 4,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        minHeight: 120,
    },
    charCount: {
        fontSize: 12,
        marginTop: 4,
        textAlign: 'right',
    },
});
