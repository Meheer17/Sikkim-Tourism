import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { aiPlannerService } from '@/services/ai-planner.service';
import type { TravelPlan as TravelPlanType, Answer } from '@/services/ai-planner.service';

interface TravelPlan {
    id: string;
    title: string;
    duration: string;
    budget: string;
    description: string;
    highlights: string[];
    activities: string[];
    accommodation: string;
    best_for: string;
    rating: number;
    image_color: string;
}

export default function AIPlannerResults() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [travelPlans, setTravelPlans] = useState<TravelPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            setLoading(true);
            setError(null);

            // Check if plans are already provided (from chat flow)
            if (params.plans) {
                const plansData = JSON.parse(params.plans as string);
                const plans: TravelPlan[] = plansData.map((plan: any) => ({
                    id: plan.id,
                    title: plan.title,
                    duration: plan.duration,
                    budget: plan.budget,
                    description: plan.description,
                    highlights: plan.highlights,
                    activities: plan.activities,
                    accommodation: plan.accommodation,
                    best_for: plan.best_for,
                    rating: plan.rating,
                    image_color: plan.image_color,
                }));
                setTravelPlans(plans);
                setLoading(false);
                return;
            }

            // Otherwise, generate from answers (legacy flow)
            const answersJson = params.answers as string;
            if (!answersJson) {
                setError('No plans or answers provided');
                setLoading(false);
                return;
            }

            const answers: Answer[] = JSON.parse(answersJson);
            
            // Call AI planner service
            const response = await aiPlannerService.generateTravelPlans(answers);
            
            // Map to local format
            const plans: TravelPlan[] = response.plans.map(plan => ({
                id: plan.id,
                title: plan.title,
                duration: plan.duration,
                budget: plan.budget,
                description: plan.description,
                highlights: plan.highlights,
                activities: plan.activities,
                accommodation: plan.accommodation,
                best_for: plan.best_for,
                rating: plan.rating,
                image_color: plan.image_color,
            }));

            setTravelPlans(plans);
        } catch (err) {
            console.error('Error loading travel plans:', err);
            setError('Failed to load travel plans. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePlanSelect = (planId: string) => {
        setSelectedPlan(planId);
    };

    const handleBookPlan = (plan: TravelPlan) => {
        // Navigate to booking or plan details
        console.log('Booking plan:', plan);
        // router.push(`/(user)/(stack)/plan-details?planId=${plan.id}` as any);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <IconSymbol name="chevron.left" size={24} color="#11181C" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Your Travel Plans</Text>
                    <Text style={styles.headerSubtitle}>AI-powered recommendations</Text>
                </View>
                <View style={styles.aiIconBadge}>
                    <IconSymbol name="sparkles" size={20} color="#667eea" />
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#667eea" />
                    <Text style={styles.loadingText}>Generating your personalized travel plans...</Text>
                    <Text style={styles.loadingSubtext}>This may take a moment</Text>
                </View>
            ) : error || travelPlans.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <IconSymbol name="exclamationmark.triangle" size={64} color="#ef4444" />
                    <Text style={styles.emptyText}>{error || 'No Travel Plans Available'}</Text>
                    <Text style={styles.emptySubtext}>
                        {error ? 'Please try again.' : "We couldn't generate travel plans at this time."}
                    </Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => router.back()}
                    >
                        <IconSymbol name="arrow.counterclockwise" size={20} color="#667eea" />
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    {/* Results Info */}
                    <View style={styles.infoCard}>
                        <IconSymbol name="checkmark.circle.fill" size={32} color="#10b981" />
                        <View style={styles.infoText}>
                            <Text style={styles.infoTitle}>Plans Ready!</Text>
                            <Text style={styles.infoSubtitle}>
                                We've created {travelPlans.length} personalized travel plans based on your preferences
                            </Text>
                        </View>
                    </View>

                    {/* Plans List */}
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {travelPlans.map((plan, index) => (
                    <TouchableOpacity
                        key={plan.id}
                        style={[
                            styles.planCard,
                            selectedPlan === plan.id && styles.planCardSelected,
                        ]}
                        onPress={() => handlePlanSelect(plan.id)}
                        activeOpacity={0.8}
                    >
                        {/* Plan Header */}
                        <View style={[styles.planHeader, { backgroundColor: plan.image_color }]}>
                            <View style={styles.planHeaderContent}>
                                <View style={styles.planBadge}>
                                    <Text style={styles.planBadgeText}>Plan {index + 1}</Text>
                                </View>
                                <View style={styles.ratingContainer}>
                                    <IconSymbol name="star.fill" size={16} color="#fff" />
                                    <Text style={styles.ratingText}>{plan.rating}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Plan Content */}
                        <View style={styles.planContent}>
                            <Text style={styles.planTitle}>{plan.title}</Text>
                            <Text style={styles.planDescription}>{plan.description}</Text>

                            {/* Details Grid */}
                            <View style={styles.detailsGrid}>
                                <View style={styles.detailItem}>
                                    <IconSymbol name="clock.fill" size={16} color="#667eea" />
                                    <Text style={styles.detailText}>{plan.duration}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <IconSymbol name="indianrupeesign.circle.fill" size={16} color="#667eea" />
                                    <Text style={styles.detailText}>{plan.budget}</Text>
                                </View>
                            </View>

                            {/* Highlights */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Highlights</Text>
                                <View style={styles.tagContainer}>
                                    {plan.highlights.map((highlight, idx) => (
                                        <View key={idx} style={styles.tag}>
                                            <Text style={styles.tagText}>{highlight}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {/* Activities */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Activities</Text>
                                <View style={styles.activityList}>
                                    {plan.activities.map((activity, idx) => (
                                        <View key={idx} style={styles.activityItem}>
                                            <IconSymbol name="checkmark.circle.fill" size={16} color="#10b981" />
                                            <Text style={styles.activityText}>{activity}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {/* Best For */}
                            <View style={styles.bestForContainer}>
                                <IconSymbol name="person.2.fill" size={16} color="#667eea" />
                                <Text style={styles.bestForText}>Best for: {plan.best_for}</Text>
                            </View>

                            {/* Action Button */}
                            <TouchableOpacity
                                style={styles.bookButton}
                                onPress={() => handleBookPlan(plan)}
                            >
                                <Text style={styles.bookButtonText}>View Details & Book</Text>
                                <IconSymbol name="arrow.right" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                        ))}

                        {/* Retry Button */}
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => router.back()}
                        >
                            <IconSymbol name="arrow.counterclockwise" size={20} color="#667eea" />
                            <Text style={styles.retryButtonText}>Answer Questions Again</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#11181C',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#687076',
        marginTop: 2,
    },
    aiIconBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 4,
        padding: 20,
        borderRadius: 16,
        gap: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    infoText: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#11181C',
        marginBottom: 4,
    },
    infoSubtitle: {
        fontSize: 13,
        color: '#687076',
        lineHeight: 18,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 120,
    },
    planCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        marginBottom: 20,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    planCardSelected: {
        borderWidth: 3,
        borderColor: '#667eea',
    },
    planHeader: {
        height: 120,
        padding: 16,
        justifyContent: 'space-between',
    },
    planHeaderContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    planBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    planBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    ratingText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    planContent: {
        padding: 20,
    },
    planTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#11181C',
        marginBottom: 8,
    },
    planDescription: {
        fontSize: 14,
        color: '#687076',
        lineHeight: 20,
        marginBottom: 16,
    },
    detailsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    detailItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        padding: 12,
        borderRadius: 12,
        gap: 8,
    },
    detailText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#11181C',
        flex: 1,
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#11181C',
        marginBottom: 12,
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        backgroundColor: '#e8f4f8',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    tagText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0a7ea4',
    },
    activityList: {
        gap: 8,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    activityText: {
        fontSize: 14,
        color: '#11181C',
    },
    bestForContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        padding: 12,
        borderRadius: 12,
        gap: 8,
        marginBottom: 16,
    },
    bestForText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#667eea',
    },
    bookButton: {
        flexDirection: 'row',
        backgroundColor: '#667eea',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    bookButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#687076',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 8,
        textAlign: 'center',
        marginBottom: 24,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#667eea',
        marginTop: 20,
        textAlign: 'center',
    },
    loadingSubtext: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 8,
        textAlign: 'center',
    },
    retryButton: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 2,
        borderColor: '#667eea',
        marginTop: 8,
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#667eea',
    },
});
