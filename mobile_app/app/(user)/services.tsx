import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import ServiceCard, { Service } from '@/components/services/ServiceCard';
import { useThemeColor } from '@/hooks/use-theme-color';
import { businessService } from '@/services';
import { BusinessType } from '@/services/business.service';

export default function ServicesScreen() {
    const [services, setServices] = useState<Service[]>([]);
    const [filteredServices, setFilteredServices] = useState<Service[]>([]);
    const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
    const [categories, setCategories] = useState<string[]>(['All']);
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
        loadData();
    }, []);

    useEffect(() => {
        filterServices();
    }, [selectedCategory, searchQuery, services]);

    const loadData = async () => {
        try {
            setLoading(true);
            // Load business types first
            await loadBusinessTypes();
            // Then load services
            await loadServices();
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadBusinessTypes = async () => {
        try {
            const response = await businessService.getTypes();
            console.log('Business Types API Response:', JSON.stringify(response, null, 2));
            const types = response.data || [];
            setBusinessTypes(types);

            // Build categories from business types, always include 'Other' at the end
            const typeNames = types.map((type: BusinessType) => type.type);
            console.log('Categories built:', ['All', ...typeNames, 'Other']);
            setCategories(['All', ...typeNames, 'Other']);
        } catch (error) {
            console.error('Failed to load business types:', error);
        }
    };

    const loadServices = async () => {
        try {
            const response = await businessService.list();
            const businesses = response.data || [];
            console.log('=== SERVICES LOADING DEBUG ===');
            console.log('Total businesses from API:', businesses);
            console.log('Business types available:', businessTypes.map(t => `${t.id}: ${t.type}`).join(', '));

            // Map businesses to Service format
            const mappedServices: Service[] = businesses
                .filter((biz: any) => biz.approved) // Only show approved businesses
                .map((biz: any) => {
                    // Find the business type name by matching type_id with business type id
                    const bizType = businessTypes.find(t => t.id === biz.type_id);
                    const categoryName = bizType ? bizType.type : 'Other';

                    console.log(`Business "${biz.name}": type_id="${biz.type_id}" -> category="${categoryName}"`);

                    return {
                        id: biz.id,
                        name: biz.name,
                        description: biz.short_description || biz.description || 'Quality service provider',
                        price: biz.price || Math.floor(Math.random() * 3000) + 500,
                        category: categoryName,
                        icon: getCategoryIcon(categoryName),
                    };
                })
                .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name

            console.log('Final mapped services:', mappedServices.length);
            console.log('Services by category:', mappedServices.reduce((acc: any, s) => {
                acc[s.category] = (acc[s.category] || 0) + 1;
                return acc;
            }, {}));

            setServices(mappedServices);
        } catch (error) {
            console.error('Failed to load services:', error);
        }
    };

    const getCategoryIcon = (type?: string): any => {
        const iconMap: Record<string, string> = {
            'hotel': 'bed.double.fill',
            'restaurant': 'fork.knife',
            'cab': 'car.fill',
            'guide': 'person.fill',
            'tourist_entry': 'ticket.fill',
            'event': 'calendar',
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
                {categories.map((category) => (
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
