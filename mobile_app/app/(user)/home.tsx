import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import ServiceCard, { Service } from '@/components/services/ServiceCard';
import { useThemeColor } from '@/hooks/use-theme-color';
import { businessService } from '@/services';

export default function HomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [services, setServices] = useState<Service[]>([]);
    const [refreshing, setRefreshing] = useState(false);
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
            const response = await businessService.list();
            const businesses = response.data || [];

            // Map businesses to Service format and limit to 4 for home screen
            const mappedServices: Service[] = businesses.slice(0, 4).map((biz: any, index: number) => ({
                id: biz._id || `service-${index}`,
                name: biz.name,
                description: biz.decription || biz.description || 'Quality service provider',
                price: biz.price || Math.floor(Math.random() * 3000) + 500,
                category: biz.type || 'Other',
                icon: getCategoryIcon(biz.type),
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
        // Navigate to service details
        console.log('Service pressed:', service);
    };

    const handleViewAllServices = () => {
        router.push('/(user)/services' as any);
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
                        <Text style={[styles.greeting, { color: text }]}>Welcome Back!</Text>
                        <Text style={[styles.subtitle, { color: muted }]}>Explore amazing services</Text>
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
                        <Text style={[styles.statLabel, { color: muted }]}>Bookings</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: card }]}>
                        <IconSymbol name="heart.fill" size={24} color="#ef4444" />
                        <Text style={[styles.statValue, { color: text }]}>8</Text>
                        <Text style={[styles.statLabel, { color: muted }]}>Favorites</Text>
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

                {/* Services Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: text }]}>Popular Services</Text>
                        <TouchableOpacity onPress={handleViewAllServices}>
                            <Text style={[styles.viewAllText, { color: tint }]}>View All</Text>
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
                            <Text style={[styles.bannerTitle, { color: text }]}>Special Offer!</Text>
                            <Text style={[styles.bannerSubtitle, { color: muted }]}>Get 20% off on first booking</Text>
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
});
