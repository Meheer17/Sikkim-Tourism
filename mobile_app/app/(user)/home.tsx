import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import ServiceCard, { Service } from '@/components/services/ServiceCard';
import { useThemeColor } from '@/hooks/use-theme-color';
import { servicesService, businessService } from '@/services';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageTranslations } from '@/constants/translations';

export default function HomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [services, setServices] = useState<Service[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        try {
            const response = await servicesService.list({ skip: 0, limit: 4 });
            const servicesList = response.data || [];

            // Map services to Service format for home screen
            const mappedServices: Service[] = servicesList.map((svc: any) => ({
                id: svc.id || '',
                name: svc.name,
                description: svc.short_description || svc.description || 'Quality service',
                price: svc.price,
                category: 'Service', // Generic category for home screen
                icon: 'star.fill',
            }));

            setServices(mappedServices);
        } catch (error: any) {
            console.error('Failed to load services:', error);
            // Handle 403 Forbidden gracefully - user might not have access yet
            if (error?.response?.status === 403) {
                console.warn('Access forbidden on home screen - user may not be approved yet');
                setServices([]); // Set empty services instead of crashing
            } else {
                setServices([]);
            }
        }
    };

    const getCategoryIcon = (type?: string): any => {
        const iconMap: Record<string, string> = {
            'Adventure': 'mountain.2.fill',
            'Transport': 'car.fill',
            'Culture': 'building.columns.fill',
            'Food': 'fork.knife',
            'Tour': 'map.fill',
        };
        return iconMap[type || 'Other'] || 'star.fill';
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadServices();
        setRefreshing(false);
    };

    const handleServicePress = (service: Service) => {
        router.push(`/(user)/(stack)/service-details?id=${service.id}` as any);
    };

    const handleViewAllServices = () => {
        router.push('/(user)/services' as any);
    };

    const handleViewUpcomingBookings = () => {
        router.push('/(user)/(stack)/schedule' as any);
    };

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: Math.max(insets.top, 20) }
                ]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        progressViewOffset={insets.top + 20}
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.greeting, { color: text }]}>{t.welcomeBack || 'Welcome Back!'}</Text>
                        <Text style={[styles.subtitle, { color: muted }]}>{t.explore_places || 'Explore amazing services'}</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.profileButton, { backgroundColor: card }]}
                        onPress={() => router.push('/(user)/profile' as any)}
                    >
                        <IconSymbol name="person.crop.circle.fill" size={32} color={tint} />
                    </TouchableOpacity>
                </View>

                {/* Quick Stats */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, { backgroundColor: card }]}>
                        <IconSymbol name="ticket.fill" size={24} color={tint} />
                        <Text style={[styles.statValue, { color: text }]}>12</Text>
                        <Text style={[styles.statLabel, { color: muted }]}>{t.bookings || 'Bookings'}</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: card }]}>
                        <IconSymbol name="heart.fill" size={24} color="#ef4444" />
                        <Text style={[styles.statValue, { color: text }]}>8</Text>
                        <Text style={[styles.statLabel, { color: muted }]}>{t.myFavorites || 'Favorites'}</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: card }]}>
                        <IconSymbol name="mappin.circle.fill" size={24} color="#10b981" />
                        <Text style={[styles.statValue, { color: text }]}>5</Text>
                        <Text style={[styles.statLabel, { color: muted }]}>Visited</Text>
                    </View>
                </View>

                {/* AI Planner Banner */}
                <TouchableOpacity
                    style={styles.aiPlannerBanner}
                    onPress={() => router.push('/(user)/(stack)/ai-planner-chat' as any)}
                    activeOpacity={0.8}
                >
                    <View style={styles.aiPlannerLeft}>
                        <View style={styles.aiIconContainer}>
                            <IconSymbol name="sparkles" size={32} color="#fff" />
                        </View>
                        <View style={styles.aiPlannerText}>
                            <Text style={styles.aiPlannerTitle}>Chat with AI Planner</Text>
                            <Text style={styles.aiPlannerSubtitle}>
                                Natural conversation for personalized trips
                            </Text>
                        </View>
                    </View>
                    <IconSymbol name="chevron.right" size={24} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.scheduleButton, { backgroundColor: card }]}
                    activeOpacity={0.85}
                    onPress={handleViewUpcomingBookings}
                >
                    <View style={styles.scheduleButtonLeft}>
                        <View style={[styles.scheduleIcon, { backgroundColor: `${tint}15` }]}
                        >
                            <IconSymbol name="calendar" size={20} color={tint} />
                        </View>
                        <View>
                            <Text style={[styles.scheduleTitle, { color: text }]}>View Upcoming Events</Text>
                            <Text style={[styles.scheduleSubtitle, { color: muted }]}>See what's happening around</Text>
                        </View>
                    </View>
                    <IconSymbol name="chevron.right" size={18} color={tint} />
                </TouchableOpacity>

                {/* Services Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: text }]}>{t.popular_services || 'Popular Services'}</Text>
                        <TouchableOpacity onPress={handleViewAllServices}>
                            <Text style={[styles.viewAllText, { color: tint }]}>{t.viewAll || 'View All'}</Text>
                        </TouchableOpacity>
                    </View>

                    {services.map((service) => (
                        <React.Fragment key={service.id}>
                            <ServiceCard
                                service={service}
                                onPress={handleServicePress}
                            />
                        </React.Fragment>
                    ))}
                </View>

                {/* Featured Banner */}
                <View style={[styles.banner, { backgroundColor: card }]}>
                    <View style={styles.bannerContent}>
                        <IconSymbol name="sparkles" size={32} color="#fbbf24" />
                        <View style={styles.bannerText}>
                            <Text style={[styles.bannerTitle, { color: text }]}>{t.specialOffer || 'Special Offer!'}</Text>
                            <Text style={[styles.bannerSubtitle, { color: muted }]}>{t.getDiscount || 'Get 20% off on first booking'}</Text>
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    greeting: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 4,
        marginTop: 20,
    },
    subtitle: {
        fontSize: 15,
    },
    profileButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        marginTop: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    aiPlannerBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#667eea',
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        elevation: 4,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    aiPlannerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flex: 1,
    },
    aiIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    aiPlannerText: {
        flex: 1,
    },
    aiPlannerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    aiPlannerSubtitle: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.9,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: '600',
    },
    banner: {
        borderRadius: 16,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        marginBottom: 20,
    },
    bannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    bannerText: {
        flex: 1,
    },
    bannerTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    bannerSubtitle: {
        fontSize: 14,
    },
    scheduleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
    },
    scheduleButtonLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    scheduleIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scheduleTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    scheduleSubtitle: {
        fontSize: 13,
    },
});
