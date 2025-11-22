import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import ServiceCard, { Service } from '@/components/services/ServiceCard';

// Mock data - replace with actual API call
const MOCK_ALL_SERVICES: Service[] = [
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
    {
        id: '5',
        name: 'Monastery Tour',
        description: 'Guided tour of ancient monasteries',
        price: 1200,
        category: 'Culture',
        icon: 'building.2.fill',
    },
    {
        id: '6',
        name: 'Cable Car Ride',
        description: 'Scenic cable car ride with mountain views',
        price: 600,
        category: 'Transport',
        icon: 'cable.connector',
    },
    {
        id: '7',
        name: 'Paragliding',
        description: 'Experience flying over beautiful valleys',
        price: 3500,
        category: 'Adventure',
        icon: 'airplane',
    },
    {
        id: '8',
        name: 'Local Food Tour',
        description: 'Taste authentic local cuisine',
        price: 900,
        category: 'Food',
        icon: 'fork.knife',
    },
];

const CATEGORIES = ['All', 'Adventure', 'Culture', 'Transport', 'Food'];

export default function ServicesScreen() {
    const [services, setServices] = useState<Service[]>([]);
    const [filteredServices, setFilteredServices] = useState<Service[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadServices();
    }, []);

    useEffect(() => {
        filterServices();
    }, [selectedCategory, searchQuery, services]);

    const loadServices = async () => {
        // TODO: Replace with actual API call
        // const response = await apiClient.get('/services');
        // setServices(response.data);

        setServices(MOCK_ALL_SERVICES);
    };

    const filterServices = () => {
        let filtered = services;

        // Filter by category
        if (selectedCategory !== 'All') {
            filtered = filtered.filter(service => service.category === selectedCategory);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            filtered = filtered.filter(service =>
                service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                service.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredServices(filtered);
    };

    const handleServicePress = (service: Service) => {
        console.log('Service pressed:', service);
        // TODO: Navigate to service details
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Services</Text>
                <Text style={styles.headerSubtitle}>Discover amazing experiences</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <IconSymbol name="magnifyingglass" size={20} color="#687076" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search services..."
                    placeholderTextColor="#687076"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <IconSymbol name="xmark.circle.fill" size={20} color="#687076" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Category Filters */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoriesContainer}
                contentContainerStyle={styles.categoriesContent}
            >
                {CATEGORIES.map((category) => (
                    <TouchableOpacity
                        key={category}
                        style={[
                            styles.categoryChip,
                            selectedCategory === category && styles.categoryChipActive,
                        ]}
                        onPress={() => setSelectedCategory(category)}
                    >
                        <Text
                            style={[
                                styles.categoryText,
                                selectedCategory === category && styles.categoryTextActive,
                            ]}
                        >
                            {category}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Services List */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {filteredServices.length > 0 ? (
                    filteredServices.map((service) => (
                        <ServiceCard
                            key={service.id}
                            service={service}
                            onPress={handleServicePress}
                        />
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <IconSymbol name="magnifyingglass" size={64} color="#d1d5db" />
                        <Text style={styles.emptyTitle}>No services found</Text>
                        <Text style={styles.emptySubtitle}>
                            Try adjusting your search or filters
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#fff',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: '#11181C',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 15,
        color: '#687076',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 20,
        marginTop: 16,
        gap: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#11181C',
    },
    categoriesContainer: {
        marginTop: 16,
        marginBottom: 8,
        maxHeight: 50,
    },
    categoriesContent: {
        paddingHorizontal: 20,
        gap: 8,
        alignItems: 'center',
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        height: 36,
        justifyContent: 'center',
    },
    categoryChipActive: {
        backgroundColor: '#0a7ea4',
        borderColor: '#0a7ea4',
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#687076',
    },
    categoryTextActive: {
        color: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#11181C',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#687076',
        textAlign: 'center',
    },
});
