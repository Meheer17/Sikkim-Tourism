import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import { locationService } from '@/services';
import PlaceCard from '@/components/explore/PlaceCard';

export default function FavouritesScreen() {
  const [favourites, setFavourites] = useState<string[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const background = useThemeColor('background');
  const text = useThemeColor('text');
  const router = useRouter();

  useEffect(() => {
    loadFavourites();
  }, []);

  const loadFavourites = async () => {
    try {
      const favData = await AsyncStorage.getItem('favorites');
      const favIds = favData ? JSON.parse(favData) : [];
      setFavourites(favIds);
      // Fetch all places and filter by favIds
      const allPlacesResp = await locationService.list({ skip: 0, limit: 100 });
      const allPlaces = allPlacesResp.data || [];
      setPlaces(allPlaces.filter((p: any) => favIds.includes(p.id)));
    } catch (e) {
      setFavourites([]);
      setPlaces([]);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: background }]}> 
      <Text style={[styles.title, { color: text }]}>My Favourites</Text>
      {places.length === 0 ? (
        <Text style={{ color: text, marginTop: 24 }}>No favourites yet.</Text>
      ) : (
        <FlatList
          data={places}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            // Map location model to PlaceCard props
            const mappedPlace = {
              id: item.id,
              name: item.name,
              description: item.short_description || item.description || '',
              distance: item.distance || '',
              rating: item.rating,
              imageUrl: item.imageUrl || (item.images && item.images[0]) || undefined,
              images: item.images,
              category: item.type || '',
              modelPath: item.modelPath,
              has360Images: item.has360Images,
              panorama360Url: item.panorama360Url,
              latitude: item.latitude,
              longitude: item.longitude,
            };
            return <PlaceCard place={mappedPlace} />;
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 12,
  },
});
