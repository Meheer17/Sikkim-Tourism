import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import ServiceCard, { Service } from '@/components/services/ServiceCard';
import { useThemeColor } from '@/hooks/use-theme-color';
import { servicesService, businessService } from '@/services';
import { ServiceModel } from '@/services/services.service';
import { BusinessType } from '@/services/business.service';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageTranslations } from '@/constants/translations';

export default function ServicesScreen() {
    const router = useRouter();
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
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
            // Load business types first - MUST complete before loading services
            await loadBusinessTypes();
        } catch (error) {
            console.error('Failed to load data:', error);
        }
        // Don't set loading to false here - wait for services to load
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

            // NOW load services after business types are ready
            await loadServices(types);
        } catch (error) {
            console.error('Failed to load business types:', error);
            // Even if business types fail, try to load services
            await loadServices([]);
        }
    };

    const loadServices = async (types: BusinessType[]) => {
        try {
            const response = await servicesService.list({ skip: 0, limit: 1000 });
            const servicesList = response.data || [];
            console.log('=== SERVICES LOADING DEBUG ===');
            console.log('Total services from API:', servicesList.length);
            console.log('Business types available:', types.map(t => `${t.id}: ${t.type}`).join(', '));

            const mappedServices: Service[] = await Promise.all(
                servicesList.map(async (svc: ServiceModel) => {
                    // Get business details to find the category
                    let categoryName = 'Other';
                    try {
                        const businessResponse = await businessService.get(svc.bid);
                        if (businessResponse.success && businessResponse.data) {
                            const business = businessResponse.data;
                            // Find the business type name by matching type_id
                            const bizType = types.find(t => t.id === business.type_id);
                            categoryName = bizType ? bizType.type : 'Other';
                            console.log(`Service "${svc.name}": business="${business.name}", type_id="${business.type_id}" -> category="${categoryName}"`);
                        }
                    } catch (error) {
                        console.warn(`Failed to load business for service ${svc.id}:`, error);
                    }

                    return {
                        id: svc.id || '',
                        name: svc.name,
                        description: svc.short_description || svc.description || 'Quality service',
                        price: svc.price,
                        category: categoryName,
                        icon: getCategoryIcon(categoryName),
                    };
                })
            );

            console.log('Final mapped services:', mappedServices.length);
            console.log('Services by category:', mappedServices.reduce((acc: any, s) => {
                acc[s.category] = (acc[s.category] || 0) + 1;
                return acc;
            }, {}));

            setServices(mappedServices.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (error: any) {
            console.error('Failed to load services:', error);
            if (error?.response?.status === 403) {
                console.warn('Access forbidden - user may not be approved yet');
                setServices([]);
            } else {
                console.error('Unexpected error loading services:', error);
                setServices([]);
            }
        } finally {
            setLoading(false);
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
        router.push({
            pathname: '/(user)/(stack)/service-details',
            params: { id: service.id }
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: screenBg }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: cardBg }]}>
                <Text style={[styles.headerTitle, { color: text }]}>{t.services || 'Services'}</Text>
                <Text style={[styles.headerSubtitle, { color: mutedText }]}>{t.discover_experiences || 'Discover amazing experiences'}</Text>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: cardBg }]}>
                <IconSymbol name="magnifyingglass" size={20} color={mutedText as string} />
                <TextInput
                    style={[styles.searchInput, { color: text }]}
                    placeholder={t.search_services || 'Search services...'}
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
                        <Text style={[styles.emptyTitle, { color: text }]}>{t.loading_services || 'Loading services...'}</Text>
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
                        <Text style={[styles.emptyTitle, { color: text }]}>{t.no_services_found || 'No services found'}</Text>
                        <Text style={[styles.emptySubtitle, { color: mutedText }]}>
                            {t.adjust_filters || 'Try adjusting your search or filters'}
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
