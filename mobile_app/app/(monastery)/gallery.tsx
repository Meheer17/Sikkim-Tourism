import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    Dimensions,
    TextInput,
} from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageTranslations } from '@/constants/translations';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { monasteryService } from '@/services';
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

type CategoryFilter = 'all' | 'manuscript' | 'artifact' | 'image' | 'document' | 'other';

export default function GalleryScreen() {
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    const [allArtifacts, setAllArtifacts] = useState<MonasteryArtifact[]>([]);
    const [filteredArtifacts, setFilteredArtifacts] = useState<MonasteryArtifact[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
    const [selectedArtifact, setSelectedArtifact] = useState<MonasteryArtifact | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        loadArtifacts();
    }, []);

    useEffect(() => {
        filterArtifacts();
    }, [allArtifacts, selectedCategory, searchQuery]);

    const loadArtifacts = async () => {
        try {
            setLoading(true);
            const response = await monasteryService.getArtifacts({
                limit: 500,
                skip: 0,
            });

            if (response.success && response.data) {
                setAllArtifacts(response.data.artifacts);
            }
        } catch (error) {
            console.error('Error loading artifacts:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to load gallery',
            });
        } finally {
            setLoading(false);
        }
    };

    const filterArtifacts = () => {
        let filtered = allArtifacts;

        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(a => a.category === selectedCategory);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            filtered = filtered.filter(a =>
                a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredArtifacts(filtered);
    };

    const categories: { label: string; value: CategoryFilter }[] = [
        { label: 'All', value: 'all' },
        { label: 'Manuscripts', value: 'manuscript' },
        { label: 'Artifacts', value: 'artifact' },
        { label: 'Images', value: 'image' },
        { label: 'Documents', value: 'document' },
        { label: 'Other', value: 'other' },
    ];

    const GalleryGridItem = ({ artifact, index }: { artifact: MonasteryArtifact; index: number }) => (
        <TouchableOpacity
            style={[styles.gridItem, { backgroundColor: card }]}
            onPress={() => {
                setSelectedArtifact(artifact);
                setShowDetailModal(true);
            }}>
            <View style={[styles.imagePlaceholder, { backgroundColor: muted + '20' }]}>
                {artifact.file_url ? (
                    <Image
                        source={{ uri: artifact.file_url }}
                        style={styles.artifactImage}
                        resizeMode="cover"
                    />
                ) : (
                    <IconSymbol size={32} name="photo.fill" color={muted} />
                )}
                <View style={[styles.categoryBadge, { backgroundColor: tint }]}>
                    <Text style={styles.categoryBadgeText} numberOfLines={1}>
                        {artifact.category.charAt(0).toUpperCase()}
                    </Text>
                </View>
            </View>
            <Text style={[styles.itemName, { color: text }]} numberOfLines={2}>
                {artifact.name}
            </Text>
        </TouchableOpacity>
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
            {/* Search Bar */}
            <View style={[styles.searchBar, { backgroundColor: card }]}>
                <IconSymbol size={20} name="magnifyingglass" color={muted} />
                <TextInput
                    style={[styles.searchInput, { color: text }]}
                    placeholder="Search artifacts..."
                    placeholderTextColor={muted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Category Filter */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}>
                {categories.map(cat => (
                    <TouchableOpacity
                        key={cat.value}
                        style={[
                            styles.categoryTag,
                            selectedCategory === cat.value
                                ? { backgroundColor: tint }
                                : { backgroundColor: card, borderWidth: 1, borderColor: muted + '40' }
                        ]}
                        onPress={() => setSelectedCategory(cat.value)}>
                        <Text style={[
                            styles.categoryTagText,
                            { color: selectedCategory === cat.value ? '#fff' : text }
                        ]}>
                            {cat.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Gallery Grid */}
            {filteredArtifacts.length === 0 ? (
                <View style={[styles.emptyState, { backgroundColor: card }]}>
                    <IconSymbol size={48} name="photo.fill" color={muted} />
                    <Text style={[styles.emptyTitle, { color: text }]}>No Artifacts Found</Text>
                    <Text style={[styles.emptyDescription, { color: muted }]}>
                        {searchQuery.trim() ? 'Try a different search' : 'Start by uploading artifacts'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredArtifacts}
                    renderItem={({ item, index }) => <GalleryGridItem artifact={item} index={index} />}
                    keyExtractor={item => item.id}
                    numColumns={2}
                    columnWrapperStyle={styles.gridRow}
                    contentContainerStyle={styles.gridContent}
                    scrollEnabled={false}
                />
            )}

            {/* Detail Modal */}
            <Modal
                visible={showDetailModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDetailModal(false)}>
                <View style={[styles.detailContainer, { backgroundColor: background }]}>
                    <View style={[styles.detailHeader, { backgroundColor: card }]}>
                        <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                            <IconSymbol size={24} name="chevron.left" color={text} />
                        </TouchableOpacity>
                        <Text style={[styles.detailHeaderTitle, { color: text }]}>Details</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.detailContent}>
                        {selectedArtifact?.file_url && (
                            <View style={[styles.detailImage, { backgroundColor: muted + '20' }]}>
                                <Image
                                    source={{ uri: selectedArtifact.file_url }}
                                    style={styles.fullImage}
                                    resizeMode="contain"
                                />
                            </View>
                        )}

                        <View style={[styles.detailCard, { backgroundColor: card }]}>
                            <Text style={[styles.detailTitle, { color: text }]}>
                                {selectedArtifact?.name}
                            </Text>

                            {selectedArtifact && (
                                <View style={[styles.categoryBadgeDetail, { backgroundColor: tint + '20' }]}>
                                    <Text style={[styles.categoryBadgeDetailText, { color: tint }]}>
                                        {selectedArtifact.category.charAt(0).toUpperCase() + selectedArtifact.category.slice(1)}
                                    </Text>
                                </View>
                            )}

                            <Text style={[styles.detailDescription, { color: muted }]}>
                                {selectedArtifact?.description}
                            </Text>

                            {/* Metadata */}
                            {selectedArtifact?.metadata && Object.keys(selectedArtifact.metadata).length > 0 && (
                                <View style={styles.metadataSection}>
                                    <Text style={[styles.metadataTitle, { color: text }]}>Information</Text>

                                    {selectedArtifact.metadata.age && (
                                        <View style={styles.metadataRow}>
                                            <Text style={[styles.metadataLabel, { color: muted }]}>Age/Period:</Text>
                                            <Text style={[styles.metadataContent, { color: text }]}>
                                                {selectedArtifact.metadata.age}
                                            </Text>
                                        </View>
                                    )}

                                    {selectedArtifact.metadata.material && (
                                        <View style={styles.metadataRow}>
                                            <Text style={[styles.metadataLabel, { color: muted }]}>Material:</Text>
                                            <Text style={[styles.metadataContent, { color: text }]}>
                                                {selectedArtifact.metadata.material}
                                            </Text>
                                        </View>
                                    )}

                                    {selectedArtifact.metadata.dimensions && (
                                        <View style={styles.metadataRow}>
                                            <Text style={[styles.metadataLabel, { color: muted }]}>Dimensions:</Text>
                                            <Text style={[styles.metadataContent, { color: text }]}>
                                                {selectedArtifact.metadata.dimensions}
                                            </Text>
                                        </View>
                                    )}

                                    {selectedArtifact.metadata.historical_period && (
                                        <View style={styles.metadataRow}>
                                            <Text style={[styles.metadataLabel, { color: muted }]}>Historical Period:</Text>
                                            <Text style={[styles.metadataContent, { color: text }]}>
                                                {selectedArtifact.metadata.historical_period}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* Tags */}
                            {selectedArtifact?.tags && selectedArtifact.tags.length > 0 && (
                                <View style={styles.tagsSection}>
                                    <Text style={[styles.tagsTitle, { color: text }]}>Tags</Text>
                                    <View style={styles.tagsContainer}>
                                        {selectedArtifact.tags.map((tag, index) => (
                                            <View key={index} style={[styles.tag, { backgroundColor: tint + '20' }]}>
                                                <Text style={[styles.tagText, { color: tint }]}>{tag}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Date */}
                            <Text style={[styles.dateText, { color: muted }]}>
                                Uploaded on {new Date(selectedArtifact?.created_at || '').toLocaleDateString()}
                            </Text>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const { width } = Dimensions.get('window');
const itemSize = (width - 48) / 2;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 16,
        paddingHorizontal: 12,
        borderRadius: 8,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        paddingVertical: 10,
    },
    categoryScroll: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 8,
    },
    categoryTag: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 4,
    },
    categoryTagText: {
        fontSize: 12,
        fontWeight: '600',
    },
    gridContent: {
        padding: 16,
        gap: 16,
    },
    gridRow: {
        gap: 16,
    },
    gridItem: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    imagePlaceholder: {
        width: itemSize,
        height: itemSize,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        marginBottom: 8,
    },
    artifactImage: {
        width: '100%',
        height: '100%',
    },
    categoryBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryBadgeText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    itemName: {
        fontSize: 13,
        fontWeight: '500',
        paddingHorizontal: 4,
    },
    emptyState: {
        flex: 1,
        borderRadius: 12,
        margin: 16,
        padding: 32,
        justifyContent: 'center',
        alignItems: 'center',
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
    detailContainer: {
        flex: 1,
    },
    detailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    detailHeaderTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    detailContent: {
        flexGrow: 1,
        padding: 16,
        gap: 16,
    },
    detailImage: {
        width: '100%',
        height: 300,
        borderRadius: 12,
        overflow: 'hidden',
    },
    fullImage: {
        width: '100%',
        height: '100%',
    },
    detailCard: {
        borderRadius: 12,
        padding: 16,
    },
    detailTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    categoryBadgeDetail: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    categoryBadgeDetailText: {
        fontSize: 12,
        fontWeight: '600',
    },
    detailDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    metadataSection: {
        marginBottom: 16,
    },
    metadataTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
    },
    metadataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    metadataLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
    metadataContent: {
        fontSize: 13,
        fontWeight: '500',
        flex: 1,
        textAlign: 'right',
    },
    tagsSection: {
        marginBottom: 16,
    },
    tagsTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
    },
    tagText: {
        fontSize: 12,
        fontWeight: '500',
    },
    dateText: {
        fontSize: 12,
        marginTop: 8,
    },
});
