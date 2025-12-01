import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ReusableMap from "@/components/maps/ReusableMap";
import PlaceCard from "@/components/explore/PlaceCard";
import { Place, DEFAULT_PLACES } from "@/assets/data/places";

export default function Explore() {
  const [userLocation, setUserLocation] = useState({
    latitude: 27.332,
    longitude: 88.613,
  });

  const [places, setPlaces] = useState<Place[]>(DEFAULT_PLACES);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  // LOAD from storage
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("PLACES_DB");
      if (saved) setPlaces(JSON.parse(saved));
    })();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: "60%" }}>
        <ReusableMap
          userLocation={userLocation}
          places={places}
          selectedPlace={selectedPlace}
          onSelect={(p) => setSelectedPlace(p)}
          showRoute={true}
        />
      </View>

      <View style={styles.bottom}>
        <Text style={styles.title}>Nearby Places</Text>
        <ScrollView>
          {places.map((p) => (
            <PlaceCard key={p.id} place={p} onPress={() => setSelectedPlace(p)} />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottom: {
    height: "40%",
    backgroundColor: "#fff",
    padding: 10,
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
});
