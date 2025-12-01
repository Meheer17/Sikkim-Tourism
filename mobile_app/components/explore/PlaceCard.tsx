import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface Place {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  image: string;
  category?: string;
  distance?: number; // in km
  rating?: number;
}

interface PlaceCardProps {
  place: Place;
  onPress: (place: Place) => void;
}

export default function PlaceCard({ place, onPress }: PlaceCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(place)}>
      <Image source={{ uri: place.image }} style={styles.image} />

      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{place.name}</Text>
        {place.category && (
          <Text style={styles.category}>{place.category}</Text>
        )}

        {place.rating && (
          <Text style={styles.rating}>
            ⭐ {place.rating.toFixed(1)}
          </Text>
        )}

        {place.distance !== undefined && (
          <Text style={styles.distance}>{place.distance.toFixed(1)} km away</Text>
        )}
      </View>

      <Ionicons name="navigate-circle" size={30} color="#007AFF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 16,
    marginVertical: 8,
    marginHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    alignItems: "center",
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: "#eee",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  category: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  rating: {
    fontSize: 12,
    color: "#444",
    marginTop: 4,
  },
  distance: {
    fontSize: 12,
    color: "#007AFF",
    marginTop: 4,
  },
});
