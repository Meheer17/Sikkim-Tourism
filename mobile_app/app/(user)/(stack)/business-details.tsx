import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { businessService } from '@/services/business.service';
import { fileService } from '@/services';
import { useAuth } from '@/hooks/useAuth';
import { PageTurnPdfViewer } from '@/components/common/PageTurnPdfViewer';

interface BusinessDetails {
    id: string;
    name: string;
    description: string;
    short_description: string;
    open_hours?: { start: string; end: string };
    type_id?: string;
    l_id?: string;
    scheduled_at?: string;
    approved?: boolean;
    created_at?: string;
    updated_at?: string;
}

interface HeritageDocument {
    _id: string;
    file_name: string;
    file_path: string;
    category: string;
    mime_type?: string;
    created_at: string;
}

export default function BusinessDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [business, setBusiness] = useState<BusinessDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [heritageDocuments, setHeritageDocuments] = useState<HeritageDocument[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [viewingPdf, setViewingPdf] = useState<{ url: string; name: string } | null>(null);
    const { user } = useAuth();

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    const canEdit = user && (user.role === 'admin' || user.role === 'business');

    useEffect(() => {
        loadBusinessDetails();
        loadHeritageDocuments();
    }, [id]);

    const loadHeritageDocuments = async () => {
        if (!id) return;
        setLoadingDocs(true);
        try {
            const resp = await fileService.getHeritageDocuments({ businessId: id });
            if (resp.success && resp.data) {
                setHeritageDocuments(resp.data.documents || []);
            }
        } catch (error) {
            console.error('Failed to load heritage documents:', error);
        } finally {
            setLoadingDocs(false);
        }
    };

    const loadBusinessDetails = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const resp = await businessService.get(id);
            if (resp.success && resp.data) {
                setBusiness(resp.data);
            }
        } catch (error) {
            console.error('Failed to load business:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: background }]}>
                <ActivityIndicator size="large" color={tint} />
            </View>
        );
    }

    if (!business) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: background }]}>
                <IconSymbol name="exclamationmark.triangle" size={48} color={muted} />
                <Text style={[styles.errorText, { color: text }]}>Business not found</Text>
                <TouchableOpacity style={[styles.button, { backgroundColor: tint }]} onPress={() => router.back()}>
                    <Text style={styles.buttonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: card }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={24} color={text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: text }]} numberOfLines={1}>
                    {business.name}
                </Text>
                {canEdit ? (
                    <TouchableOpacity
                        onPress={() => router.push({
                            pathname: '/edit-business' as any,
                            params: { id }
                        })}
                        style={styles.placeholder}
                    >
                        <IconSymbol name="pencil" size={20} color={tint} />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.placeholder} />
                )}
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Hero */}
                <View style={styles.heroContainer}>
                    <View style={[styles.heroPlaceholder, { backgroundColor: card }]}>
                        <IconSymbol name="building.2" size={64} color={muted} />
                    </View>
                    {business.approved && (
                        <View style={styles.approvedBadge}>
                            <IconSymbol name="checkmark.seal.fill" size={20} color="#10b981" />
                            <Text style={styles.approvedText}>Verified</Text>
                        </View>
                    )}
                </View>

                {/* Info Card */}
                <View style={[styles.infoCard, { backgroundColor: card }]}>
                    <Text style={[styles.title, { color: text }]}>{business.name}</Text>
                    <Text style={[styles.shortDesc, { color: muted }]}>{business.short_description}</Text>

                    {/* Opening Hours */}
                    {business.open_hours ? (
                        <View style={styles.hoursContainer}>
                            <IconSymbol name="clock" size={20} color={tint} />
                            <Text style={[styles.hoursText, { color: text }]}>
                                {business.open_hours.start} - {business.open_hours.end}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.hoursContainer}>
                            <IconSymbol name="clock" size={20} color={tint} />
                            <Text style={[styles.hoursText, { color: muted }]}>Hours unavailable</Text>
                        </View>
                    )}

                    {/* Event Date */}
                    {business.scheduled_at && (
                        <View style={styles.eventContainer}>
                            <IconSymbol name="calendar" size={20} color={tint} />
                            <Text style={[styles.eventText, { color: text }]}>
                                Event: {new Date(business.scheduled_at).toLocaleDateString()}
                            </Text>
                        </View>
                    )}

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: text }]}>About</Text>
                        <Text style={[styles.description, { color: muted }]}>{business.description}</Text>
                    </View>
                </View>

                {/* Heritage Documents */}
                {heritageDocuments.length > 0 && (
                    <View style={[styles.heritageSection, { backgroundColor: card }]}>
                        <View style={styles.heritageSectionHeader}>
                            <IconSymbol name="book.closed.fill" size={24} color={tint} />
                            <Text style={[styles.sectionTitle, { color: text }]}>Heritage Documents</Text>
                        </View>
                        <Text style={[styles.heritageSectionDesc, { color: muted }]}>
                            Explore ancient manuscripts, scriptures, and cultural artifacts
                        </Text>
                        
                        {loadingDocs ? (
                            <ActivityIndicator size="small" color={tint} style={{ marginTop: 16 }} />
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.heritageScroll}>
                                {heritageDocuments.map((doc) => {
                                    const isPdf = doc.mime_type === 'application/pdf' || doc.file_name.toLowerCase().endsWith('.pdf');
                                    const categoryLabel = doc.category.replace('heritage_', '').replace('_', ' ');
                                    
                                    return (
                                        <TouchableOpacity
                                            key={doc._id}
                                            style={[styles.heritageCard, { backgroundColor: background, borderColor: tint }]}
                                            onPress={() => isPdf && setViewingPdf({ url: doc.file_path, name: doc.file_name })}
                                            activeOpacity={0.7}
                                        >
                                            <View style={[styles.heritageThumb, { backgroundColor: isPdf ? '#ef4444' : '#f3f4f6' }]}>
                                                {isPdf ? (
                                                    <IconSymbol name="doc.text.fill" size={40} color="#fff" />
                                                ) : (
                                                    <Image source={{ uri: doc.file_path }} style={styles.heritageImage} />
                                                )}
                                            </View>
                                            <View style={styles.heritageCardContent}>
                                                <View style={[styles.categoryBadge, { backgroundColor: tint + '20' }]}>
                                                    <Text style={[styles.categoryBadgeText, { color: tint }]} numberOfLines={1}>
                                                        {categoryLabel}
                                                    </Text>
                                                </View>
                                                <Text style={[styles.heritageFileName, { color: text }]} numberOfLines={2}>
                                                    {doc.file_name}
                                                </Text>
                                                {isPdf && (
                                                    <View style={styles.pdfIndicator}>
                                                        <IconSymbol name="book.pages" size={14} color={tint} />
                                                        <Text style={[styles.pdfIndicatorText, { color: tint }]}>Tap to read</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        )}
                    </View>
                )}

                {/* Actions */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: tint }]}>
                        <IconSymbol name="phone.fill" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Contact</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: card, borderWidth: 1, borderColor: tint }]}>
                        <IconSymbol name="bookmark" size={20} color={tint} />
                        <Text style={[styles.actionButtonText, { color: tint }]}>Save</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <PageTurnPdfViewer
                visible={!!viewingPdf}
                pdfUrl={viewingPdf?.url || ''}
                fileName={viewingPdf?.name}
                onClose={() => setViewingPdf(null)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 8,
    },
    placeholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    heroContainer: {
        height: 250,
        position: 'relative',
    },
    heroPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    approvedBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#d1fae5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    approvedText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10b981',
    },
    infoCard: {
        margin: 16,
        borderRadius: 16,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
    },
    shortDesc: {
        fontSize: 16,
        marginBottom: 16,
    },
    hoursContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    hoursText: {
        fontSize: 15,
        fontWeight: '500',
    },
    eventContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    eventText: {
        fontSize: 15,
        fontWeight: '500',
    },
    section: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    description: {
        fontSize: 15,
        lineHeight: 24,
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
        paddingBottom: 32,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 24,
    },
    button: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    heritageSection: {
        margin: 16,
        marginTop: 0,
        borderRadius: 16,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    heritageSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    heritageSectionDesc: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    heritageScroll: {
        marginHorizontal: -8,
    },
    heritageCard: {
        width: 160,
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
        marginHorizontal: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    heritageThumb: {
        width: '100%',
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heritageImage: {
        width: '100%',
        height: '100%',
    },
    heritageCardContent: {
        padding: 12,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 8,
    },
    categoryBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    heritageFileName: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        lineHeight: 18,
    },
    pdfIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    pdfIndicatorText: {
        fontSize: 11,
        fontWeight: '500',
    },
});
