import React, { useEffect, useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import * as Location from "expo-location";
import * as Speech from "expo-speech";
import Constants from "expo-constants";

type Place = {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  category?: string;
  image?: string;
};

type AdvancedMapProps = {
  selectedPlace: Place | null;
  adminMode?: boolean;
  children?: React.ReactNode;
};

export default function AdvancedMap({
  selectedPlace,
  adminMode = false,
  children,
}: AdvancedMapProps) {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<any[]>([]);
  const GOOGLE_API_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is needed to show maps.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      setUserLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Highest, distanceInterval: 2 },
        (loc) => {
          setUserLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }
      );
    })();
  }, []);

  const speakDirections = (text: string) => {
    Speech.stop();
    Speech.speak(text, { language: "en-US", pitch: 1.0 });
  };

  return (
    <View style={{ flex: 1 }}>
      {userLocation && (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          showsUserLocation
          followsUserLocation
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {/* Selected destination marker */}
          {selectedPlace && (
            <Marker
              coordinate={{
                latitude: selectedPlace.latitude,
                longitude: selectedPlace.longitude,
              }}
              title={selectedPlace.name}
            />
          )}

          {/* Route polyline from Google Directions */}
          {selectedPlace && (
            <MapViewDirections
              origin={userLocation}
              destination={{
                latitude: selectedPlace.latitude,
                longitude: selectedPlace.longitude,
              }}
              apikey={GOOGLE_API_KEY}
              strokeWidth={5}
              strokeColor="#4285F4"
              optimizeWaypoints={true}
              onReady={(res) => {
                setRouteCoords(res.coordinates);
                const msg = `Route ready. Distance ${res.distance} kilometers. Estimated time ${res.duration} minutes.`;
                speakDirections(msg);
              }}
              onError={(err) => {
                console.log("Directions error: ", err);
              }}
            />
          )}

          {/* Polyline (google curved route) */}
          {routeCoords.length > 0 && (
            <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="#4285F4" />
          )}
        </MapView>
      )}

      {/* Floating content: cards, buttons, admin UI */}
      <View style={styles.overlay}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    width: "100%",
    bottom: 0,
  },
});
