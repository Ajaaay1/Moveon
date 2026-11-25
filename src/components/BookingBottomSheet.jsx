import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Logo from "./logo";

export default function BookingBottomSheet({
  isServiceOpen, isFormOpen, selectedService, pickupText, destinationText, hasDestination,
  distance, estimatedFare, isCalculatingRoute, routeError, routeNotice, isSubmitting,
  onOpenService, onCloseService, onSelectService, onCloseForm, onConfirmBooking, theme,
}) {
  const disabled = isCalculatingRoute || !!routeError || distance <= 0 || isSubmitting;
  if (isServiceOpen) {
    return (
      <View style={[styles.expanded, { backgroundColor: theme.surface }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Book a Ride</Text>
          <TouchableOpacity onPress={onCloseService}><Ionicons name="close" size={24} color={theme.text} /></TouchableOpacity>
        </View>
        <Text style={styles.label}>Select a service type</Text>
        <TouchableOpacity style={styles.serviceCard} activeOpacity={0.8} onPress={() => onSelectService("Motorcycle")}>
          <Logo size={40} />
          <Text style={[styles.serviceText, { color: theme.text }]}>Motorcycle</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (isFormOpen) {
    return (
      <View style={[styles.expanded, { backgroundColor: theme.surface }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Book {selectedService}</Text>
          <TouchableOpacity onPress={onCloseForm}><Ionicons name="close" size={24} color={theme.text} /></TouchableOpacity>
        </View>
        <View style={[styles.input, { backgroundColor: theme.surfaceMuted }]}>
          <Ionicons name="location" size={20} color="#0284c7" />
          <View style={styles.locationText}>
            <Text style={styles.inputLabel}>Pickup Location</Text>
            <Text style={[styles.inputValue, { color: theme.text }]}>{pickupText}</Text>
          </View>
        </View>
        <View style={[styles.input, { backgroundColor: theme.surfaceMuted }]}>
          <Ionicons name="pin" size={20} color="#ef4444" />
          <View style={styles.locationText}>
            <Text style={styles.inputLabel}>Destination</Text>
            <Text style={[styles.inputValue, { color: theme.text }]}>{destinationText || "Tap the map to choose a destination"}</Text>
          </View>
        </View>
        <Text style={styles.hint}>
          {isCalculatingRoute ? "Calculating route and fare..." : routeError ? routeError : routeNotice ? routeNotice : hasDestination ? `Route distance: ${distance.toFixed(2)} km` : "Tap anywhere on the map to set your destination."}
        </Text>
        <View style={styles.fareBox}>
          <Text style={styles.inputLabel}>Estimated Fare</Text>
          <Text style={styles.fareAmount}>{distance > 0 && !routeError ? `₱${estimatedFare.toFixed(2)}` : "—"}</Text>
          <Text style={styles.note}>₱50 base fare + ₱25 per estimated kilometer. Final distance may vary when Mapbox is unavailable.</Text>
        </View>
        <TouchableOpacity style={[styles.confirmButton, disabled && styles.disabled]} onPress={onConfirmBooking} activeOpacity={0.8} disabled={disabled}>
          <Text style={styles.confirmText}>{isSubmitting ? "Submitting..." : "Review and Confirm Booking"}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <View style={[styles.bottom, { backgroundColor: theme.surface }]}>
      <TouchableOpacity style={styles.serviceRow} onPress={onOpenService} activeOpacity={0.7}>
        <Text style={[styles.serviceText, { color: theme.text }]}>🛵 Choose Service ›</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.bookButton} onPress={onOpenService} activeOpacity={0.8}>
        <Text style={styles.bookText}>Book a Ride</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottom: { position: "absolute", bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40, elevation: 10 },
  serviceRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  serviceText: { fontSize: 16, fontWeight: "bold" },
  bookButton: { backgroundColor: "#e2e8f0", paddingVertical: 16, borderRadius: 30, alignItems: "center" },
  bookText: { color: "#64748b", fontSize: 16, fontWeight: "bold" },
  expanded: { position: "absolute", bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40, elevation: 15, zIndex: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 20, fontWeight: "bold" },
  label: { fontSize: 14, color: "#64748b", marginBottom: 16, fontWeight: "600" },
  serviceCard: { width: 140, backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0", borderRadius: 16, padding: 16, alignItems: "center", gap: 10 },
  input: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, gap: 10 },
  locationText: { flex: 1 },
  inputLabel: { fontSize: 11, color: "#64748b", marginBottom: 2 },
  inputValue: { fontSize: 15, fontWeight: "500" },
  hint: { fontSize: 12, color: "#64748b", marginBottom: 16, fontStyle: "italic" },
  fareBox: { backgroundColor: "#f0f9ff", borderRadius: 12, padding: 14, marginBottom: 14 },
  fareAmount: { color: "#0284c7", fontSize: 24, fontWeight: "bold", marginTop: 3 },
  note: { color: "#64748b", fontSize: 10, marginTop: 3 },
  confirmButton: { backgroundColor: "#0284c7", paddingVertical: 16, borderRadius: 30, alignItems: "center" },
  confirmText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
  disabled: { opacity: 0.45 },
});
