import React, { useState, useEffect } from "react";
import { View, Alert } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import * as Speech from "expo-speech";
import Constants from "expo-constants";
import { Place } from "@/assets/data/places";

type Props = {
  userLocation: { latitude: number; longitude: number };
  places: Place[];
  selectedPlace: Place | null;
  onSelect: (p: Place) => void;
  showRoute?: boolean;
  enableTapSelect?: boolean; // admin only
  onTapCoordinates?: (lat: number, lng: number) => void; // admin only
};

export default function ReusableMap({
  userLocation,
  places,
  selectedPlace,
  onSelect,
  showRoute = true,
  enableTapSelect = false,
  onTapCoordinates,
}: Props) {
  const [routeCoords, setRouteCoords] = useState<any[]>([]);

  const GOOGLE = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY || "";

  // GEO-FENCING (announce arrival)
  useEffect(() => {
    if (!selectedPlace) return;
    const interval = setInterval(() => {
      const dx = Math.abs(selectedPlace.latitude - userLocation.latitude);
      const dy = Math.abs(selectedPlace.longitude - userLocation.longitude);

      if (dx < 0.0005 && dy < 0.0005) {
        Speech.speak(`You have arrived at ${selectedPlace.name}`);
        clearInterval(interval);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [selectedPlace, userLocation]);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        provider="google"
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onPress={(e) => {
          if (enableTapSelect && onTapCoordinates) {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            onTapCoordinates(latitude, longitude);
          }
        }}
      >
        {/* USER MARKER */}
        <Marker
          coordinate={userLocation}
          title="You"
          pinColor="blue"
        />

        {/* PLACES */}
        {places.map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
            pinColor="red"
            title={p.name}
            onPress={() => onSelect(p)}
          />
        ))}

        {/* GOOGLE DIRECTIONS */}
        {showRoute && selectedPlace && (
          <MapViewDirections
            origin={userLocation}
            destination={{
              latitude: selectedPlace.latitude,
              longitude: selectedPlace.longitude,
            }}
            apikey={GOOGLE}
            strokeWidth={5}
            strokeColor="blue"
            onReady={(res) => {
              setRouteCoords(res.coordinates);
              Speech.speak(
                `Route loaded. Distance ${res.distance.toFixed(
                  1
                )} kilometers, estimated time ${res.duration.toFixed(0)} minutes`
              );
            }}
            onError={(err) => console.log("Directions err:", err)}
          />
        )}

        {/* FALLBACK POLYLINE */}
        {routeCoords.length > 0 && (
          <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="blue" />
        )}
      </MapView>
    </View>
  );
}
