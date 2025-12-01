// app/(admin)/places.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
  Image,
  Platform,
} from "react-native";

import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useRouter } from "expo-router";

type Place = {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  category?: string;
  image?: string;
};

export default function AdminPlaces() {
  const router = useRouter();

  const [places, setPlaces] = useState<Place[]>([]);
  const [selected, setSelected] = useState<Place | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formLatitude, setFormLatitude] = useState("");
  const [formLongitude, setFormLongitude] = useState("");

  // Load Admin Places
  const loadPlaces = async () => {
    const data = await AsyncStorage.getItem("ADMIN_PLACES");
    if (data) {
      setPlaces(JSON.parse(data));
    }
  };

  const savePlaces = async (list: Place[]) => {
    await AsyncStorage.setItem("ADMIN_PLACES", JSON.stringify(list));
  };

  useEffect(() => {
    loadPlaces();
  }, []);

  // Add or Edit
  const openAddModal = () => {
    setSelected(null);
    setFormName("");
    setFormDescription("");
    setFormLatitude("");
    setFormLongitude("");
    setShowModal(true);
  };

  const openEditModal = (place: Place) => {
    setSelected(place);
    setFormName(place.name);
    setFormDescription(place.description || "");
    setFormLatitude(String(place.latitude));
    setFormLongitude(String(place.longitude));
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formName || !formLatitude || !formLongitude) {
      Alert.alert("Missing fields", "Name, Latitude, Longitude required.");
      return;
    }

    const newPlace: Place = {
      id: selected ? selected.id : Date.now().toString(),
      name: formName,
      description: formDescription,
      latitude: Number(formLatitude),
      longitude: Number(formLongitude),
      category: "Custom",
      image: "https://cdn-icons-png.flaticon.com/512/854/854878.png",
    };

    let updated;
    if (selected) {
      updated = places.map((p) => (p.id === selected.id ? newPlace : p));
    } else {
      updated = [...places, newPlace];
    }

    setPlaces(updated);
    savePlaces(updated);
    setShowModal(false);
  };

  const handleDelete = (place: Place) => {
    Alert.alert("Confirm", "Delete this place?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const updated = places.filter((p) => p.id !== place.id);
          setPlaces(updated);
          savePlaces(updated);
        },
      },
    ]);
  };

  const renderCard = ({ item }: { item: Place }) => (
    <TouchableOpacity style={styles.card}>
      <Image
        source={{ uri: item.image }}
        style={{ width: 60, height: 60, borderRadius: 8 }}
      />

      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.desc}>
          {item.description?.slice(0, 40) || "No description"}
        </Text>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => openEditModal(item)}
          >
            <Text style={styles.editTxt}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item)}
          >
            <Text style={styles.deleteTxt}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Places</Text>

        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          initialRegion={{
            latitude: 27.533,
            longitude: 88.512,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          }}
        >
          {places.map((p) => (
            <Marker
              key={p.id}
              coordinate={{ latitude: p.latitude, longitude: p.longitude }}
              title={p.name}
            />
          ))}
        </MapView>
      </View>

      {/* Cards */}
      <FlatList
        data={places}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
      />

      {/* Modal */}
      <Modal transparent visible={showModal} animationType="slide">
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {selected ? "Edit Place" : "Add Place"}
            </Text>

            <TextInput
              placeholder="Name"
              value={formName}
              onChangeText={setFormName}
              style={styles.input}
            />

            <TextInput
              placeholder="Description"
              value={formDescription}
              onChangeText={setFormDescription}
              style={styles.input}
            />

            <TextInput
              placeholder="Latitude"
              value={formLatitude}
              onChangeText={setFormLatitude}
              keyboardType="numeric"
              style={styles.input}
            />

            <TextInput
              placeholder="Longitude"
              value={formLongitude}
              onChangeText={setFormLongitude}
              keyboardType="numeric"
              style={styles.input}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
              >
                <Text style={styles.saveTxt}>Save</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "bold" },

  addButton: {
    backgroundColor: "#3568eb",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },

  mapContainer: { height: 250, borderRadius: 10, overflow: "hidden", margin: 10 },

  card: {
    flexDirection: "row",
    backgroundColor: "#f4f4f4",
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: "center",
  },

  name: { fontSize: 16, fontWeight: "bold", color: "#333" },
  desc: { fontSize: 13, color: "#777", marginTop: 2 },

  cardActions: { flexDirection: "row", marginTop: 8 },
  editBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#ffc107",
    borderRadius: 6,
    marginRight: 10,
  },
  editTxt: { color: "#000", fontWeight: "600" },
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#dc3545",
    borderRadius: 6,
  },
  deleteTxt: { color: "#fff", fontWeight: "600" },

  modalWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },

  input: {
    backgroundColor: "#f1f1f1",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  saveBtn: {
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  saveTxt: { color: "#fff", fontWeight: "bold", textAlign: "center" },

  cancelBtn: {
    backgroundColor: "#6c757d",
    padding: 12,
    borderRadius: 8,
    flex: 1,
  },
  cancelTxt: { color: "#fff", fontWeight: "bold", textAlign: "center" },
});
