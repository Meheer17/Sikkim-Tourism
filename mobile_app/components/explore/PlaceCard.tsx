import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Place } from "@/assets/data/places";

type Props = {
  place: Place;
  onPress: () => void;
};

export default function PlaceCard({ place, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{place.name}</Text>
          <Text style={styles.desc}>{place.category.toUpperCase()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "95%",
    alignSelf: "center",
    padding: 12,
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: "#fff",
    elevation: 4,
  },
  row: { flexDirection: "row", alignItems: "center" },
  title: { fontSize: 17, fontWeight: "bold" },
  desc: { color: "#555", marginTop: 3 },
});
