import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function RatingModal({ visible, isSubmitting, onSubmit, theme }) {
  const [selectedRating, setSelectedRating] = useState(0);
  useEffect(() => { if (visible) setSelectedRating(0); }, [visible]);

  const submit = async () => {
    if (selectedRating < 1 || isSubmitting) return;
    await onSubmit(selectedRating);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Ionicons name="checkmark-circle" size={42} color="#10b981" />
          <Text style={[styles.title, { color: theme.text }]}>Ride Completed!</Text>
          <Text style={styles.text}>How was your driver?</Text>
          <View style={styles.stars}>
            {Array.from({ length: 5 }, (_, index) => (
              <TouchableOpacity key={index} onPress={() => setSelectedRating(index + 1)}>
                <Ionicons name={selectedRating >= index + 1 ? "star" : "star-outline"} size={34} color="#f59e0b" />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.text}>{selectedRating ? `${selectedRating} out of 5 stars` : "Tap a star to rate your driver"}</Text>
          <TouchableOpacity style={[styles.button, (!selectedRating || isSubmitting) && styles.disabled]} onPress={submit} disabled={!selectedRating || isSubmitting}>
            <Text style={styles.buttonText}>{isSubmitting ? "Saving..." : "Submit Rating"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.55)", justifyContent: "center", alignItems: "center", padding: 24 },
  card: { width: "100%", maxWidth: 340, backgroundColor: "#ffffff", borderRadius: 20, padding: 24, alignItems: "center", gap: 12 },
  title: { color: "#0f172a", fontSize: 21, fontWeight: "bold" },
  text: { color: "#64748b", fontSize: 13, textAlign: "center" },
  stars: { flexDirection: "row", gap: 10, marginVertical: 8 },
  button: { width: "100%", backgroundColor: "#0284c7", paddingVertical: 16, borderRadius: 30, alignItems: "center" },
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
  disabled: { opacity: 0.45 },
});
