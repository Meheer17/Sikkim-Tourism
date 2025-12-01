import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import * as Speech from "expo-speech";

import PlaceCard, { Place } from "@/components/explore/PlaceCard";

export default function ExploreScreen() {
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [routeCoords, setRouteCoords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ---- MOCK NEARBY PLACES ---- //
  const PLACES: Place[] = [
    {
      id: "1",
      name: "MG Marg",
      latitude: 27.334,
      longitude: 88.606,
      image:
        "https://upload.wikimedia.org/wikipedia/commons/4/46/MG_Marg_Gangtok.jpg",
      category: "Shopping",
      rating: 4.5,
      distance: 1.2,
    },
    {
      id: "2",
      name: "Hanuman Tok",
      latitude: 27.35,
      longitude: 88.62,
      image:
        "https://upload.wikimedia.org/wikipedia/commons/e/e3/Hanuman_Tok.jpg",
      category: "Temple",
      rating: 4.7,
      distance: 3.4,
    },
  ];

  // ----------- GET USER LOCATION ---------- //
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Location permission denied");
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      setLoading(false);
    })();
  }, []);

  // ----------- DRAW ROUTE WHEN PLACE SELECTED ---------- //
  useEffect(() => {
    if (!selectedPlace || !userLocation) return;

    const route = [
      { latitude: userLocation.latitude, longitude: userLocation.longitude },
      { latitude: selectedPlace.latitude, longitude: selectedPlace.longitude },
    ];

    setRouteCoords(route);

    Speech.speak(`Navigating to ${selectedPlace.name}`, {
      rate: 0.9,
    });
  }, [selectedPlace]);

  if (loading || !userLocation) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Fetching location...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* MAP VIEW */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* USER MARKER */}
        <Marker
          coordinate={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }}
          title="You are here"
          pinColor="blue"
        />

        {/* PLACES MARKERS */}
        {PLACES.map((p) => (
          <Marker
            key={p.id}
            coordinate={{
              latitude: p.latitude,
              longitude: p.longitude,
            }}
            title={p.name}
            onPress={() => setSelectedPlace(p)}
          />
        ))}

        {/* ROUTE POLYLINE */}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={4}
            strokeColor="#007AFF"
          />
        )}
      </MapView>

      {/* NEARBY PLACES LIST */}
      <View style={styles.cardContainer}>
        <Text style={styles.sectionTitle}>Nearby Places</Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          {PLACES.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              onPress={(p) => setSelectedPlace(p)}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

// --------------------------------------------------

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: "55%",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContainer: {
    backgroundColor: "#f8f8f8",
    paddingTop: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -25,
    height: "45%",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
});
