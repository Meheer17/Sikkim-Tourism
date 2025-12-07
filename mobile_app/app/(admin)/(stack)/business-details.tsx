import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { businessService, BusinessModel, BusinessType } from '@/services/business.service';
import { servicesService } from '@/services';
import { platformConfig } from '@/config/api.config';

export default function BusinessDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const businessId = params.id as string;

    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const mutedText = useThemeColor('mutedText');
    const tint = useThemeColor('tint');
    const border = useThemeColor('border');

    const [business, setBusiness] = useState<BusinessModel | null>(null);
    const [businessType, setBusinessType] = useState<BusinessType | null>(null);
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState(false);

    useEffect(() => {
        loadBusinessDetails();
    }, [businessId]);

    const loadBusinessDetails = async () => {
        try {
            setLoading(true);
            
            // Load business details
            const businessResp = await businessService.get(businessId);
            if (businessResp.success && businessResp.data) {
                setBusiness(businessResp.data);

                // Load business type
                const typesResp = await businessService.getTypes();
                if (typesResp.success && typesResp.data) {
                    const type = typesResp.data.find(t => t.id === businessResp.data!.type_id);
                    setBusinessType(type || null);
                }

                // Load services for this business
                const servicesResp = await servicesService.list({ bid: businessId, skip: 0, limit: 100 });
                if (servicesResp.success && servicesResp.data) {
                    setServices(servicesResp.data);
                }
            } else {
                Alert.alert('Error', 'Failed to load business details');
                router.back();
            }
        } catch (error: any) {
            console.error('Failed to load business details:', error);
            Alert.alert('Error', error.message || 'Failed to load business details');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        Alert.alert(
            'Approve Business',
            `Are you sure you want to approve "${business?.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    style: 'default',
                    onPress: async () => {
                        try {
                            setApproving(true);
                            const resp = await businessService.approve(businessId);
                            if (resp.success) {
                                Alert.alert('Success', 'Business approved successfully');
                                loadBusinessDetails();
                            } else {
                                Alert.alert('Error', resp.message || 'Failed to approve business');
                            }
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to approve business');
                        } finally {
                            setApproving(false);
                        }
                    },
                },
            ]
        );
    };

    const handleDelete = async () => {
        Alert.alert(
            'Delete Business',
            `Are you sure you want to delete "${business?.name}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const resp = await businessService.remove(businessId);
                            if (resp.success) {
                                Alert.alert('Success', 'Business deleted successfully', [
                                    { text: 'OK', onPress: () => router.back() }
                                ]);
                            } else {
                                Alert.alert('Error', resp.message || 'Failed to delete business');
                            }
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to delete business');
                        }
                    },
                },
            ]
        );
    };

    const handleUploadHeritage = () => {
        router.push({
            pathname: '/(admin)/(stack)/upload-heritage',
            params: { businessId, businessName: business?.name || 'Business' }
        } as any);
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: background }]}>
                <View style={[styles.header, { backgroundColor: card, borderBottomColor: border }]}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <IconSymbol name="chevron.left" size={24} color={text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: text }]}>Business Details</Text>
                    <View style={styles.headerAction} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={tint} />
                    <Text style={[styles.loadingText, { color: mutedText }]}>Loading...</Text>
                </View>
            </View>
        );
    }

    if (!business) {
        return (
            <View style={[styles.container, { backgroundColor: background }]}>
                <View style={[styles.header, { backgroundColor: card, borderBottomColor: border }]}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <IconSymbol name="chevron.left" size={24} color={text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: text }]}>Business Details</Text>
                    <View style={styles.headerAction} />
                </View>
                <View style={styles.emptyContainer}>
                    <IconSymbol name="exclamationmark.triangle" size={64} color={mutedText} />
                    <Text style={[styles.emptyText, { color: text }]}>Business not found</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: card, borderBottomColor: border }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <IconSymbol name="chevron.left" size={24} color={text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: text }]}>Business Details</Text>
                <TouchableOpacity style={styles.headerAction} onPress={() => router.push(`/(admin)/(stack)/business-details?id=${businessId}` as any)}>
                    <IconSymbol name="arrow.clockwise" size={20} color={tint} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Status Badge */}
                <View style={[styles.statusCard, { backgroundColor: card }]}>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusBadge, { backgroundColor: business.approved ? '#10b981' : '#f59e0b' }]}>
                            <IconSymbol 
                                name={business.approved ? "checkmark.circle.fill" : "clock.fill"} 
                                size={16} 
                                color="#fff" 
                            />
                            <Text style={styles.statusText}>
                                {business.approved ? 'Approved' : 'Pending Approval'}
                            </Text>
                        </View>
                        {!business.approved && (
                            <TouchableOpacity
                                style={[styles.approveButton, { backgroundColor: tint }]}
                                onPress={handleApprove}
                                disabled={approving}
                            >
                                {approving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <IconSymbol name="checkmark.shield.fill" size={16} color="#fff" />
                                        <Text style={styles.approveButtonText}>Approve</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Business Info Card */}
                <View style={[styles.card, { backgroundColor: card }]}>
                    <View style={styles.cardHeader}>
                        <IconSymbol name="building.2.fill" size={24} color={tint} />
                        <Text style={[styles.cardTitle, { color: text }]}>Business Information</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: mutedText }]}>Name</Text>
                        <Text style={[styles.infoValue, { color: text }]}>{business.name}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: mutedText }]}>Type</Text>
                        <Text style={[styles.infoValue, { color: text }]}>{businessType?.type || 'Unknown'}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: mutedText }]}>Category</Text>
                        <Text style={[styles.infoValue, { color: text }]}>{businessType?.category || 'N/A'}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: mutedText }]}>Description</Text>
                        <Text style={[styles.infoValueMultiline, { color: text }]}>{business.description}</Text>
                    </View>

                    {business.short_description && (
                        <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: mutedText }]}>Short Description</Text>
                            <Text style={[styles.infoValue, { color: text }]}>{business.short_description}</Text>
                        </View>
                    )}

                    <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: mutedText }]}>Open Hours</Text>
                        <Text style={[styles.infoValue, { color: text }]}>
                            {business.open_hours?.start || 'N/A'} - {business.open_hours?.end || 'N/A'}
                        </Text>
                    </View>

                    {business.position && (
                        <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: mutedText }]}>Location</Text>
                            <Text style={[styles.infoValue, { color: text }]}>
                                {business.position.y}, {business.position.x}
                            </Text>
                        </View>
                    )}

                    <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: mutedText }]}>Scheduled At</Text>
                        <Text style={[styles.infoValue, { color: text }]}>
                            {new Date(business.scheduled_at).toLocaleString()}
                        </Text>
                    </View>

                    {business.created_at && (
                        <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: mutedText }]}>Created</Text>
                            <Text style={[styles.infoValue, { color: text }]}>
                                {new Date(business.created_at).toLocaleDateString()}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Services Card */}
                <View style={[styles.card, { backgroundColor: card }]}>
                    <View style={styles.cardHeader}>
                        <IconSymbol name="list.bullet" size={24} color={tint} />
                        <Text style={[styles.cardTitle, { color: text }]}>Services ({services.length})</Text>
                    </View>

                    {services.length > 0 ? (
                        services.map((service, index) => (
                            <View key={service.id || index} style={[styles.serviceItem, { borderBottomColor: border }]}>
                                <View style={styles.serviceInfo}>
                                    <Text style={[styles.serviceName, { color: text }]}>{service.name}</Text>
                                    <Text style={[styles.servicePrice, { color: tint }]}>₹{service.price}</Text>
                                </View>
                                {service.short_description && (
                                    <Text style={[styles.serviceDescription, { color: mutedText }]} numberOfLines={2}>
                                        {service.short_description}
                                    </Text>
                                )}
                            </View>
                        ))
                    ) : (
                        <Text style={[styles.emptyServices, { color: mutedText }]}>No services listed</Text>
                    )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.verifyButton, { backgroundColor: tint }]}
                        onPress={handleUploadHeritage}
                    >
                        <IconSymbol name="doc.text.fill" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Upload Heritage Documents</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={handleDelete}
                    >
                        <IconSymbol name="trash.fill" size={20} color="#ef4444" />
                        <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Delete Business</Text>
                    </TouchableOpacity>
                </View>
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
        paddingTop: platformConfig.isIOS ? 20 : 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
    },
    headerAction: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
    },
    statusCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    approveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    approveButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    card: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    infoRow: {
        marginBottom: 12,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 16,
    },
    infoValueMultiline: {
        fontSize: 14,
        lineHeight: 20,
    },
    serviceItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    serviceInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    servicePrice: {
        fontSize: 16,
        fontWeight: '700',
    },
    serviceDescription: {
        fontSize: 14,
        lineHeight: 18,
    },
    emptyServices: {
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 20,
    },
    actionButtons: {
        gap: 12,
        marginTop: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        gap: 8,
    },
    verifyButton: {
        // backgroundColor set via inline style
    },
    deleteButton: {
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#ef4444',
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});
