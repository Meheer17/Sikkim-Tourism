import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ReusableMap from "@/components/maps/ReusableMap";
import { Place, Category, DEFAULT_PLACES } from "@/assets/data/places";

export default function AdminPlaces() {
  const [places, setPlaces] = useState<Place[]>(DEFAULT_PLACES);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    latitude: "",
    longitude: "",
    category: "tourist" as Category,
  });

  // Load saved places
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("PLACES_DB");
      if (saved) setPlaces(JSON.parse(saved));
    })();
  }, []);

  async function savePlaces(updated: Place[]) {
    setPlaces(updated);
    await AsyncStorage.setItem("PLACES_DB", JSON.stringify(updated));
  }

  function resetForm() {
    setForm({
      name: "",
      description: "",
      latitude: "",
      longitude: "",
      category: "tourist",
    });
    setEditingId(null);
  }

  function addOrUpdatePlace() {
    if (!form.name || !form.latitude || !form.longitude) return;

    if (editingId) {
      // UPDATE EXISTING PLACE
      const updated = places.map((p) =>
        p.id === editingId
          ? {
              ...p,
              name: form.name,
              description: form.description,
              latitude: Number(form.latitude),
              longitude: Number(form.longitude),
              category: form.category,
            }
          : p
      );
      savePlaces(updated);
    } else {
      // ADD NEW PLACE
      const newPlace: Place = {
        id: Date.now().toString(),
        name: form.name,
        description: form.description,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        category: form.category,
      };
      savePlaces([...places, newPlace]);
    }

    resetForm();
  }

  function deletePlace(id: string) {
    savePlaces(places.filter((p) => p.id !== id));
    if (id === editingId) resetForm();
  }

  function startEditing(place: Place) {
    setEditingId(place.id);
    setForm({
      name: place.name,
      description: place.description,
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      category: place.category,
    });
  }

  return (
    <View style={{ flex: 1 }}>
      {/* MAP */}
      <View style={{ height: "50%" }}>
        <ReusableMap
          userLocation={{ latitude: 27.33, longitude: 88.61 }}
          places={places}
          selectedPlace={null}
          onSelect={() => {}}
          showRoute={false}
          enableTapSelect={true}
          onTapCoordinates={(lat, lng) =>
            setForm({ ...form, latitude: String(lat), longitude: String(lng) })
          }
        />
      </View>

      <ScrollView style={styles.form}>
        <Text style={styles.header}>
          {editingId ? "Edit Place" : "Add New Place"}
        </Text>

        <TextInput
          placeholder="Place name"
          value={form.name}
          onChangeText={(v) => setForm({ ...form, name: v })}
          style={styles.input}
        />

        <TextInput
          placeholder="Description"
          value={form.description}
          onChangeText={(v) => setForm({ ...form, description: v })}
          style={styles.input}
        />

        {/* COORDINATES */}
        <TextInput
          placeholder="Latitude"
          value={form.latitude}
          style={styles.input}
          editable={false}
        />

        <TextInput
          placeholder="Longitude"
          value={form.longitude}
          style={styles.input}
          editable={false}
        />

        {/* CATEGORY */}
        <Text style={{ marginTop: 10, marginBottom: 5 }}>Category</Text>

        <ScrollView horizontal>
          {["tourist", "hospital", "police", "food", "other"].map((c) => (
            <Pressable
              key={c}
              onPress={() => setForm({ ...form, category: c as Category })}
              style={[
                styles.categoryChip,
                form.category === c && styles.chipSelected,
              ]}
            >
              <Text style={{ color: "#fff" }}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ADD / UPDATE BUTTON */}
        <Pressable style={styles.saveBtn} onPress={addOrUpdatePlace}>
          <Text style={styles.btnText}>
            {editingId ? "Update Place" : "Add Place"}
          </Text>
        </Pressable>

        {editingId && (
          <Pressable style={styles.cancelBtn} onPress={resetForm}>
            <Text style={{ color: "#000", fontWeight: "bold" }}>Cancel Edit</Text>
          </Pressable>
        )}

        <Text style={styles.header}>Existing Places</Text>

        {/* LIST OF PLACES */}
        {places.map((p) => (
          <View key={p.id} style={styles.placeCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.placeName}>{p.name}</Text>
              <Text style={styles.placeCategory}>{p.category}</Text>
            </View>

            <View>
              <Pressable
                style={styles.editBtn}
                onPress={() => startEditing(p)}
              >
                <Text style={styles.btnTextSmall}>Edit</Text>
              </Pressable>

              <Pressable
                style={styles.deleteBtn}
                onPress={() => deletePlace(p.id)}
              >
                <Text style={styles.btnTextSmall}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { padding: 12, backgroundColor: "#fff" },
  header: { fontSize: 18, fontWeight: "bold", marginVertical: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  categoryChip: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#888",
    marginRight: 10,
  },
  chipSelected: { backgroundColor: "#007AFF" },
  saveBtn: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  cancelBtn: {
    marginTop: 8,
    padding: 10,
    backgroundColor: "#eee",
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "bold" },
  placeCard: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
    padding: 12,
    borderRadius: 10,
    marginVertical: 6,
    alignItems: "center",
  },
  placeName: { fontSize: 16, fontWeight: "600" },
  placeCategory: { color: "#777", marginTop: 3 },
  editBtn: {
    backgroundColor: "#007AFF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 5,
  },
  deleteBtn: {
    backgroundColor: "red",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  btnTextSmall: { color: "#fff", fontSize: 12 },
});
