import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import ServiceCard, { Service } from '@/components/services/ServiceCard';

// Mock data - replace with actual API call
const MOCK_SERVICES: Service[] = [
    {
        id: '1',
        name: 'Mountain Trekking Guide',
        description: 'Professional trekking guide for Himalayan trails',
        price: 2500,
        category: 'Adventure',
        icon: 'mountain.2.fill',
    },
    {
        id: '2',
        name: 'Local Cab Service',
        description: '24/7 available cab service for local travel',
        price: 800,
        category: 'Transport',
        icon: 'car.fill',
    },
    {
        id: '3',
        name: 'Museum Entry Pass',
        description: 'All-day access to heritage museums',
        price: 150,
        category: 'Culture',
        icon: 'building.columns.fill',
    },
    {
        id: '4',
        name: 'River Rafting',
        description: 'Thrilling river rafting experience',
        price: 1500,
        category: 'Adventure',
        icon: 'water.waves',
    },
];

export default function HomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [services, setServices] = useState<Service[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        // TODO: Replace with actual API call
        // const response = await apiClient.get('/services');
        // setServices(response.data.slice(0, 4));

        // For now, use mock data
        setServices(MOCK_SERVICES);
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
        <View style={styles.container}>
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
                        progressViewOffset={insets.top}
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Welcome Back!</Text>
                        <Text style={styles.subtitle}>Explore amazing services</Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.profileButton}
                        onPress={() => router.push('/(user)/profile' as any)}
                    >
                        <IconSymbol name="person.crop.circle.fill" size={32} color="#0a7ea4" />
                    </TouchableOpacity>
                </View>

                {/* Quick Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <IconSymbol name="ticket.fill" size={24} color="#0a7ea4" />
                        <Text style={styles.statValue}>12</Text>
                        <Text style={styles.statLabel}>Bookings</Text>
                    </View>
                    <View style={styles.statCard}>
                        <IconSymbol name="heart.fill" size={24} color="#ef4444" />
                        <Text style={styles.statValue}>8</Text>
                        <Text style={styles.statLabel}>Favorites</Text>
                    </View>
                    <View style={styles.statCard}>
                        <IconSymbol name="mappin.circle.fill" size={24} color="#10b981" />
                        <Text style={styles.statValue}>5</Text>
                        <Text style={styles.statLabel}>Visited</Text>
                    </View>
                </View>

                {/* AI Planner Banner */}
                <TouchableOpacity 
                    style={styles.aiPlannerBanner}
                    onPress={() => router.push('/(user)/(stack)/ai-planner' as any)}
                    activeOpacity={0.8}
                >
                    <View style={styles.aiPlannerLeft}>
                        <View style={styles.aiIconContainer}>
                            <IconSymbol name="sparkles" size={32} color="#fff" />
                        </View>
                        <View style={styles.aiPlannerText}>
                            <Text style={styles.aiPlannerTitle}>Plan with AI</Text>
                            <Text style={styles.aiPlannerSubtitle}>
                                Get personalized travel recommendations
                            </Text>
                        </View>
                    </View>
                    <IconSymbol name="chevron.right" size={24} color="#fff" />
                </TouchableOpacity>

                {/* Services Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Popular Services</Text>
                        <TouchableOpacity onPress={handleViewAllServices}>
                            <Text style={styles.viewAllText}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    {services.map((service) => (
                        <ServiceCard
                            key={service.id}
                            service={service}
                            onPress={handleServicePress}
                        />
                    ))}
                </View>

                {/* Featured Banner */}
                <View style={styles.banner}>
                    <View style={styles.bannerContent}>
                        <IconSymbol name="sparkles" size={32} color="#fbbf24" />
                        <View style={styles.bannerText}>
                            <Text style={styles.bannerTitle}>Special Offer!</Text>
                            <Text style={styles.bannerSubtitle}>Get 20% off on first booking</Text>
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
        backgroundColor: '#f8f9fa',
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
        color: '#11181C',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
        color: '#687076',
    },
    profileButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
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
        color: '#11181C',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#687076',
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
        color: '#11181C',
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0a7ea4',
    },
    banner: {
        backgroundColor: '#fff',
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
        color: '#11181C',
        marginBottom: 4,
    },
    bannerSubtitle: {
        fontSize: 14,
        color: '#687076',
    },
});
