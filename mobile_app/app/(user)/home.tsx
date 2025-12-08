import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput, FlatList } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IconSymbol } from '@/components/ui/icon-symbol';
import ServiceCard, { Service } from '@/components/services/ServiceCard';
import { useThemeColor } from '@/hooks/use-theme-color';
import { servicesService, businessService } from '@/services';
import { locationService } from '@/services/location.service';
import { buildImageUrl } from '@/utils/image-url';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageTranslations } from '@/constants/translations';

export default function HomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [services, setServices] = useState<Service[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [bookingsCount, setBookingsCount] = useState(0);
    const [favoritesCount, setFavoritesCount] = useState(0);
    // --- Search Bar State ---
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);
    const background = useThemeColor('background');
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const tint = useThemeColor('tint');

    useEffect(() => {
        loadServices();
        loadCounts();
    }, []);

    // Load favorites count whenever screen is focused
    useFocusEffect(
        React.useCallback(() => {
            loadCounts();
        }, [])
    );

    const loadCounts = async () => {
        try {
            const favoritesData = await AsyncStorage.getItem('favorites');
            const favorites = favoritesData ? JSON.parse(favoritesData) : [];
            setFavoritesCount(favorites.length);
        } catch (error) {
            console.error('Error loading counts:', error);
            setFavoritesCount(0);
        }
    };

    // Debounced search effect
    useEffect(() => {
        if (!searchQuery || searchQuery.trim().length === 0) {
            setResults([]);
            setSearching(false);
            return;
        }
        const id = setTimeout(() => {
            performSearch(searchQuery.trim());
        }, 300);
        return () => clearTimeout(id);
    }, [searchQuery]);

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
        router.push({
            pathname: '/(user)/(stack)/service-details',
            params: { id: service.id }
        });
    };

    const handleViewAllServices = () => {
        router.push('/(user)/services' as any);
    };

    const handleViewUpcomingBookings = () => {
        router.push('/(user)/(stack)/schedule' as any);
    };

    // --- Search Logic ---
    const performSearch = async (q: string) => {
        setSearching(true);
        try {
            // Run searches in parallel
            const [svcResp, bizResp, locResp] = await Promise.allSettled([
                servicesService.list({ skip: 0, limit: 50 }),
                businessService.list({ skip: 0, limit: 50 }),
                locationService.list({ skip: 0, limit: 50 }),
            ]);

            const items: any[] = [];

            if (svcResp.status === 'fulfilled' && svcResp.value?.data) {
                const servicesList = svcResp.value.data || [];
                servicesList.forEach((s: any) => {
                    const name = (s.name || '').toString();
                    const desc = (s.short_description || s.description || '').toString();
                    if (name.toLowerCase().includes(q.toLowerCase()) || desc.toLowerCase().includes(q.toLowerCase())) {
                        items.push({ id: s.id, type: 'service', title: s.name, subtitle: s.short_description || s.description, route: '/(user)/(stack)/service-details' });
                    }
                });
            }

            if (bizResp.status === 'fulfilled' && bizResp.value?.data) {
                const businessList = bizResp.value.data || [];
                businessList.forEach((b: any) => {
                    const name = (b.name || '').toString();
                    const desc = (b.short_description || b.description || '').toString();
                    if (name.toLowerCase().includes(q.toLowerCase()) || desc.toLowerCase().includes(q.toLowerCase())) {
                        items.push({ id: b.id, type: 'business', title: b.name, subtitle: b.short_description || b.description, route: '/(user)/(stack)/business-details' });
                    }
                });
            }

            if (locResp.status === 'fulfilled' && locResp.value?.data) {
                const locList = locResp.value.data || [];
                locList.forEach((l: any) => {
                    const name = (l.name || '').toString();
                    const desc = (l.short_description || l.description || '').toString();
                    if (name.toLowerCase().includes(q.toLowerCase()) || desc.toLowerCase().includes(q.toLowerCase())) {
                        items.push({ id: l.id, type: 'location', title: l.name, subtitle: l.short_description || l.description, route: '/(user)/(stack)/location-details' });
                    }
                });
            }

            // Deduplicate by type+id, keep first occurrences
            const seen = new Set<string>();
            const deduped = items.filter((it) => {
                const key = `${it.type}:${it.id}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            setResults(deduped.slice(0, 50));
        } catch (error) {
            console.error('Search failed', error);
            setResults([]);
        } finally {
            setSearching(false);
        }
    };

    const handleResultPress = async (item: any) => {
        try {
            if (item.type === 'service') {
                router.push(`${item.route}?id=${item.id}` as any);
            } else if (item.type === 'business') {
                router.push(`${item.route}?id=${item.id}` as any);
            } else if (item.type === 'location') {
                // Fetch full location/place details so we can navigate with the
                // same params Explore uses (ensures identical screen/state).
                const resp = await locationService.get(item.id);
                const loc = resp?.data;

                // Build params similar to Explore's handlePlacePress
                // Map fields the same way `explore.tsx` maps backend locations to Place
                const rawImages: string[] = loc?.metadata?.images || [];
                const images = rawImages.map((f: string) => buildImageUrl(f)).filter(Boolean) as string[];
                const imageUrl = images[0] || '';
                const params: Record<string, string> = {
                    id: loc?.id || item.id,
                    name: (loc?.name as string) || item.title || '',
                    description: (loc?.description as string) || (loc?.short_description as string) || item.subtitle || '',
                    distance: '',
                    rating: '',
                    category: (loc?.type as string) || '',
                    imageUrl: imageUrl,
                    images: JSON.stringify(images || []),
                    modelPath: (loc?.metadata?.model_url as string) || '',
                    has360Images: (!!loc?.metadata?.panorama_360).toString(),
                    panorama360Url: buildImageUrl(loc?.metadata?.panorama_360) || '',
                    latitude: loc?.position?.y ? String(loc.position.y) : '',
                    longitude: loc?.position?.x ? String(loc.position.x) : '',
                    shortDescription: (loc?.short_description as string) || '',
                };

                router.push({ pathname: '/(user)/(stack)/place-details', params } as any);
            } else {
                // Fallback: go to home
                router.push('/(user)/home' as any);
            }
        } catch (err) {
            console.error('Failed navigating to result', err);
            router.push('/(user)/home' as any);
        } finally {
            // Clear search after navigate
            setSearchQuery('');
            setResults([]);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            {/* Top area: header + search (kept outside ScrollView to avoid nesting VirtualizedList) */}
            <View style={{ paddingTop: Math.max(insets.top, 20), paddingHorizontal: 20 }}>
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

                {/* Search Bar */}
                <View style={[styles.searchContainer, { backgroundColor: card }]}>
                    <IconSymbol name="magnifyingglass" size={18} color={muted as string} />
                    <TextInput
                        style={[styles.searchInput, { color: text }]}
                        placeholder={t.search || 'Search'}
                        placeholderTextColor={muted as string}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                        onSubmitEditing={() => performSearch(searchQuery.trim())}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => { setSearchQuery(''); setResults([]); }}>
                            <IconSymbol name="xmark.circle.fill" size={18} color={muted as string} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Search Results (shows when query present) - outside ScrollView so FlatList isn't nested */}
                {searchQuery.trim().length > 0 && (
                    <View style={[styles.resultsContainer, { backgroundColor: 'transparent' }]}>
                        {searching ? (
                            <Text style={[styles.resultsStatus, { color: muted }]}>{t.searching || 'Searching...'}</Text>
                        ) : results.length === 0 ? (
                            <Text style={[styles.resultsStatus, { color: muted }]}>{t.no_results || 'No results'}</Text>
                        ) : (
                            <FlatList
                                data={results}
                                keyExtractor={(i) => `${i.type}-${i.id}`}
                                style={{ maxHeight: 320 }}
                                keyboardShouldPersistTaps="handled"
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={[styles.resultRow, { backgroundColor: card }]} onPress={() => handleResultPress(item)}>
                                        <View style={styles.resultLeft}>
                                            <IconSymbol name={item.type === 'service' ? 'sparkles' : item.type === 'business' ? 'building.2' : 'mappin.circle.fill'} size={20} color={tint} />
                                        </View>
                                        <View style={styles.resultTextContainer}>
                                            <Text style={[styles.resultTitle, { color: text }]} numberOfLines={1}>{item.title}</Text>
                                            <Text style={[styles.resultSubtitle, { color: muted }]} numberOfLines={1}>{item.subtitle}</Text>
                                        </View>
                                        <View style={styles.resultBadge}>
                                            <Text style={[styles.resultBadgeText, { color: tint }]}>{item.type}</Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                    </View>
                )}

            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        progressViewOffset={insets.top + 20}
                    />
                }
            >

                {/* Quick Stats */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, { backgroundColor: card }]}>
                        <IconSymbol name="ticket.fill" size={24} color={tint} />
                        <Text style={[styles.statValue, { color: text }]}>{bookingsCount}</Text>
                        <Text style={[styles.statLabel, { color: muted }]}>{t.bookings || 'Bookings'}</Text>
                    </View>
                    <TouchableOpacity style={[styles.statCard, { backgroundColor: card }]} onPress={() => router.push('/(user)/(stack)/favorites' as any)}>
                        <IconSymbol name="heart.fill" size={24} color="#ef4444" />
                        <Text style={[styles.statValue, { color: text }]}>{favoritesCount}</Text>
                        <Text style={[styles.statLabel, { color: muted }]}>{t.myFavorites || 'Favorites'}</Text>
                    </TouchableOpacity>
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginTop: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 4,
        marginHorizontal: 4,
        zIndex: 15,
    },
    resultsContainer: {
        borderRadius: 12,
        marginTop: 4,
        marginBottom: 8,
        paddingBottom: 8,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
    },
    resultsStatus: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        fontSize: 14,
    },
    resultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginHorizontal: 20,
        marginBottom: 8,
        borderRadius: 12,
    },
    resultLeft: {
        width: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    resultTextContainer: {
        flex: 1,
    },
    resultTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    resultSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    resultBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        backgroundColor: 'transparent',
        marginLeft: 8,
    },
    resultBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
});
