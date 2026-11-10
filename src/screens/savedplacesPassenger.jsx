import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function SavedPlacesScreen() {
  const router = useRouter();
  const [place, setPlace] = useState("");
  const [places, setPlaces] = useState([]);

  const addPlace = () => {
    if (!place.trim()) {
      Alert.alert("Missing Location", "Enter a place first.");
      return;
    }

    setPlaces((current) => [
      ...current,
      { id: Date.now().toString(), name: place.trim() },
    ]);
    setPlace("");
  };

  const deletePlace = (id) => {
    setPlaces((current) =>
      current.filter((item) => item.id !== id)
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>Saved Places</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Add Favorite Location</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter address or place"
          value={place}
          onChangeText={setPlace}
        />

        <TouchableOpacity style={styles.button} onPress={addPlace}>
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.buttonText}>Save Place</Text>
        </TouchableOpacity>

        <FlatList
          data={places}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No saved places yet.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.placeCard}>
              <Ionicons
                name="location-outline"
                size={22}
                color="#0284c7"
              />
              <Text style={styles.placeText}>{item.name}</Text>
              <TouchableOpacity
                onPress={() => deletePlace(item.id)}
              >
                <Ionicons
                  name="trash-outline"
                  size={22}
                  color="#ef4444"
                />
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
  },
  content: { flex: 1, padding: 20 },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#0284c7",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  placeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    marginTop: 12,
  },
  placeText: { flex: 1, color: "#0f172a" },
  empty: {
    textAlign: "center",
    color: "#94a3b8",
    marginTop: 40,
  },
});
