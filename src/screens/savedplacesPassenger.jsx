import React, { useEffect, useState, useContext } from "react";
import {
  ActivityIndicator,
  Alert,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { AuthContext } from "./AuthContext";

export default function SavedPlacesScreen() {
  const router = useRouter();
  const { session, theme } = useContext(AuthContext);
  const [place, setPlace] = useState("");
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const storageKey = "moveon_saved_places_" + (session?.user?.id || "guest");

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storageKey)
      .then((value) => {
        if (active) setPlaces(value ? JSON.parse(value) : []);
      })
      .catch((error) => {
        console.warn("Saved places could not be loaded:", error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [storageKey]);

  const persistPlaces = async (nextPlaces) => {
    setPlaces(nextPlaces);
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(nextPlaces));
    } catch (error) {
      Alert.alert("Save Failed", "Your saved places could not be stored on this device.");
    }
  };

  const addPlace = async () => {
    const name = place.trim();
    if (!name || saving) {
      if (!name) Alert.alert("Missing Location", "Enter a place first.");
      return;
    }

    setSaving(true);
    try {
      const matches = await Location.geocodeAsync(name);
      if (!matches?.length) {
        Alert.alert("Place Not Found", "Enter a more complete address or nearby landmark.");
        return;
      }

      await persistPlaces([
        ...places,
        {
          id: Date.now().toString(),
          name,
          latitude: matches[0].latitude,
          longitude: matches[0].longitude,
        },
      ]);
      setPlace("");
    } catch (error) {
      Alert.alert("Unable to Save Place", "The location could not be found. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const deletePlace = (id) => {
    persistPlaces(places.filter((item) => item.id !== id));
  };

  const selectPlace = (item) => {
    router.replace({
      pathname: "/(tabs)/passengerHome",
      params: {
        savedLat: String(item.latitude),
        savedLng: String(item.longitude),
        savedName: item.name,
        selectionId: item.id,
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Saved Places</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.label, { color: theme.text }]}>Add Favorite Location</Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.input }]}
          placeholder="Enter address or place"
          placeholderTextColor={theme.muted}
          value={place}
          onChangeText={setPlace}
          onSubmitEditing={addPlace}
          returnKeyType="done"
        />
        <TouchableOpacity style={[styles.button, saving && styles.disabled]} onPress={addPlace} disabled={saving}>
          {saving ? <ActivityIndicator color="#ffffff" /> : <Ionicons name="add" size={22} color="#ffffff" />}
          <Text style={styles.buttonText}>{saving ? "Finding place..." : "Save Place"}</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator style={styles.loader} color={theme.accent} />
        ) : (
          <FlatList
            data={places}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={[styles.empty, { color: theme.muted }]}>No saved places yet.</Text>}
            renderItem={({ item }) => (
              <View style={[styles.placeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <TouchableOpacity style={styles.placeSelect} onPress={() => selectPlace(item)} activeOpacity={0.75}>
                  <Ionicons name="location-outline" size={22} color={theme.accent} />
                  <View style={styles.placeDetails}>
                    <Text style={[styles.placeText, { color: theme.text }]}>{item.name}</Text>
                    <Text style={[styles.coordinates, { color: theme.muted }]}>Tap to pin this destination on the map</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deletePlace(item.id)} accessibilityLabel={"Delete " + item.name}>
                  <Ionicons name="trash-outline" size={22} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 55, paddingHorizontal: 20, paddingBottom: 20, flexDirection: "row", alignItems: "center", gap: 18, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: "bold" },
  content: { flex: 1, padding: 20 },
  label: { fontSize: 16, fontWeight: "bold", marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 12, padding: 15, marginBottom: 15, fontSize: 15 },
  button: { backgroundColor: "#0284c7", padding: 15, borderRadius: 12, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  buttonText: { color: "#ffffff", fontWeight: "bold", fontSize: 15 },
  disabled: { opacity: 0.6 },
  loader: { marginTop: 35 },
  list: { paddingBottom: 30 },
  placeCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderWidth: 1, borderRadius: 12, marginTop: 12 },
  placeSelect: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  placeDetails: { flex: 1 },
  placeText: { fontSize: 15, fontWeight: "600" },
  coordinates: { fontSize: 11, marginTop: 4 },
  empty: { textAlign: "center", marginTop: 40 },
});
