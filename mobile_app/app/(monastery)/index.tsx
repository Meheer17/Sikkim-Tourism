import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageTranslations } from '@/constants/translations';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { monasteryService, MonasteryData } from '@/services/monastery.service';
import { useRouter } from 'expo-router';

interface ArtifactStats {
    total: number;
    by_category: Record<string, number>;
    storage_used: number;
    storage_limit: number;
}

export default function MonasteryDashboard() {
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');
    const router = useRouter();

    const [monasteryData, setMonasteryData] = useState<MonasteryData | null>(null);
    const [stats, setStats] = useState<ArtifactStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [monasteryRes, statsRes] = await Promise.all([
                monasteryService.getMonasteryDetails(),
                monasteryService.getArtifactStats(),
            ]);

            if (monasteryRes.success && monasteryRes.data) {
                setMonasteryData(monasteryRes.data);
            }

            if (statsRes.success && statsRes.data) {
                console.log('Artifact Stats:', statsRes.data);
                setStats(statsRes.data);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadDashboardData();
        setRefreshing(false);
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const StatCard = ({ title, value, icon, color, bg }: any) => (
        <View style={[styles.statCard, { backgroundColor: card }]}>
            <View style={[styles.statIconContainer, { backgroundColor: color }]}>
                <IconSymbol size={24} name={icon} color="#fff" />
            </View>
            <View style={styles.statContent}>
                <Text style={[styles.statTitle, { color: muted }]}>{title}</Text>
                <Text style={[styles.statValue, { color: text }]}>{value}</Text>
            </View>
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
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

                {/* Header Section */}
                <View style={[styles.headerSection, { backgroundColor: card }]}>
                    <View style={styles.headerContent}>
                        <View style={[styles.iconContainer, { backgroundColor: tint + '20' }]}>
                            <IconSymbol size={32} name="building.2.fill" color={tint} />
                        </View>
                        <View style={styles.headerText}>
                            <Text style={[styles.headerTitle, { color: text }]}>{monasteryData?.name}</Text>
                            <Text style={[styles.headerSubtitle, { color: muted }]}>
                                {monasteryData?.approved ? '✓ Verified' : 'Pending Verification'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Stats Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: text }]}>Artifacts Overview</Text>

                    <StatCard
                        title="Total Artifacts"
                        value={monasteryData?.artifacts_count || 0}
                        icon="photo.fill"
                        color="#3b82f6"
                        bg={card}
                    />

                    <StatCard
                        title="Storage Used"
                        value={`${formatBytes(stats?.storage_used || 0)} / ${formatBytes(stats?.storage_limit || 0)}`}
                        icon="externaldrive.fill"
                        color="#10b981"
                        bg={card}
                    />
                </View>

                {/* Categories Breakdown */}
                {stats?.by_category && Object.keys(stats.by_category).length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: text }]}>Categories</Text>

                        {Object.entries(stats.by_category).map(([category, count]) => (
                            <View key={category} style={[styles.categoryItem, { backgroundColor: card }]}>
                                <Text style={[styles.categoryName, { color: text }]}>
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </Text>
                                <Text style={[styles.categoryCount, { color: tint }]}>{count}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: text }]}>Quick Actions</Text>

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: tint }]}
                        onPress={() => router.push('/(monastery)/artifacts' as any)}>
                        <IconSymbol size={20} name="plus.circle.fill" color="#fff" />
                        <Text style={styles.actionButtonText}>Add New Artifact</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: card, borderWidth: 1, borderColor: tint }]}
                        onPress={() => router.push('/(monastery)/gallery' as any)}>
                        <IconSymbol size={20} name="square.grid.2x2.fill" color={tint} />
                        <Text style={[styles.actionButtonText, { color: tint }]}>View Gallery</Text>
                    </TouchableOpacity>
                </View>

                {/* Monastery Information */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: text }]}>Monastery Information</Text>

                    <View style={[styles.infoCard, { backgroundColor: card }]}>
                        <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: muted }]}>Operating Hours</Text>
                            <Text style={[styles.infoValue, { color: text }]}>
                                {monasteryData?.open_hours.start} - {monasteryData?.open_hours.end}
                            </Text>
                        </View>

                        <View style={[styles.divider, { backgroundColor: muted + '20' }]} />

                        <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: muted }]}>Location</Text>
                            <Text style={[styles.infoValue, { color: text }]} numberOfLines={2}>
                                {monasteryData?.address}
                            </Text>
                        </View>

                        <View style={[styles.divider, { backgroundColor: muted + '20' }]} />

                        <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: muted }]}>Status</Text>
                            <View style={[
                                styles.statusBadge,
                                { backgroundColor: monasteryData?.approved ? '#d1fae5' : '#fef3c7' }
                            ]}>
                                <Text style={[
                                    styles.statusText,
                                    { color: monasteryData?.approved ? '#065f46' : '#b45309' }
                                ]}>
                                    {monasteryData?.approved ? 'Approved' : 'Pending'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
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
        gap: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerSection: {
        borderRadius: 12,
        padding: 16,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 12,
    },
    section: {
        gap: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    statCard: {
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statContent: {
        flex: 1,
    },
    statTitle: {
        fontSize: 12,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    categoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    categoryName: {
        fontSize: 14,
        fontWeight: '500',
    },
    categoryCount: {
        fontSize: 16,
        fontWeight: '700',
    },
    actionButton: {
        flexDirection: 'row',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 8,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    infoCard: {
        borderRadius: 12,
        padding: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    infoLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
        textAlign: 'right',
    },
    divider: {
        height: 1,
        marginVertical: 8,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
});
