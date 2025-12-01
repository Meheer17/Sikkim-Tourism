import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import ServiceCard, { Service } from '@/components/services/ServiceCard';
import { useThemeColor } from '@/hooks/use-theme-color';
import { businessService } from '@/services';

const CATEGORIES = ['All', 'Adventure', 'Culture', 'Transport', 'Food', 'Tour', 'Accommodation'];

export default function ServicesScreen() {
    const [services, setServices] = useState<Service[]>([]);
    const [filteredServices, setFilteredServices] = useState<Service[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // Theme colors
    const screenBg = useThemeColor('background');
    const cardBg = useThemeColor('card');
    const text = useThemeColor('text');
    const mutedText = useThemeColor('mutedText');
    const tint = useThemeColor('tint');
    const border = useThemeColor('border');

    useEffect(() => {
        loadServices();
    }, []);

    useEffect(() => {
        filterServices();
    }, [selectedCategory, searchQuery, services]);

    const loadServices = async () => {
        try {
            setLoading(true);
            const response = await businessService.list();
            const businesses = response.data || [];

            // Map businesses to Service format
            const mappedServices: Service[] = businesses.map((biz: any) => ({
                id: biz._id,
                name: biz.name,
                description: biz.decription || biz.description || 'Quality service provider',
                price: biz.price || Math.floor(Math.random() * 3000) + 500,
                category: biz.type || 'Other',
                icon: getCategoryIcon(biz.type),
            }));

            setServices(mappedServices);
        } catch (error) {
            console.error('Failed to load services:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryIcon = (type?: string): any => {
        const iconMap: Record<string, string> = {
            'Adventure': 'mountain.2.fill',
            'Transport': 'car.fill',
            'Culture': 'building.columns.fill',
            'Food': 'fork.knife',
            'Tour': 'map.fill',
            'Accommodation': 'house.fill',
        };
        return iconMap[type || 'Other'] || 'star.fill';
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
        <View style={[styles.container, { backgroundColor: screenBg }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: cardBg }]}>
                <Text style={[styles.headerTitle, { color: text }]}>Services</Text>
                <Text style={[styles.headerSubtitle, { color: mutedText }]}>Discover amazing experiences</Text>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: cardBg }]}>
                <IconSymbol name="magnifyingglass" size={20} color={mutedText as string} />
                <TextInput
                    style={[styles.searchInput, { color: text }]}
                    placeholder="Search services..."
                    placeholderTextColor={mutedText as string}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <IconSymbol name="xmark.circle.fill" size={20} color={mutedText as string} />
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
                            { backgroundColor: cardBg, borderColor: border },
                            selectedCategory === category && { backgroundColor: tint, borderColor: tint },
                        ]}
                        onPress={() => setSelectedCategory(category)}
                    >
                        <Text
                            style={[
                                styles.categoryText,
                                { color: mutedText },
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
                {loading ? (
                    <View style={styles.emptyState}>
                        <Text style={[styles.emptyTitle, { color: text }]}>Loading services...</Text>
                    </View>
                ) : filteredServices.length > 0 ? (
                    filteredServices.map((service) => (
                        <ServiceCard
                            key={service.id}
                            service={service}
                            onPress={handleServicePress}
                        />
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <IconSymbol name="magnifyingglass" size={64} color={border as string} />
                        <Text style={[styles.emptyTitle, { color: text }]}>No services found</Text>
                        <Text style={[styles.emptySubtitle, { color: mutedText }]}>
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
    },
    header: {
        padding: 20,
        paddingTop: 60,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 15,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
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
        borderWidth: 1,
        height: 36,
        justifyContent: 'center',
    },
    categoryChipActive: {
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
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
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
    },
});
