import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Logo from "./logo";

export default function BookingBottomSheet({
  isServiceOpen,
  isFormOpen,
  selectedService,
  pickupText,
  destinationText,
  distance,
  estimatedFare,
  isCalculatingRoute,
  routeError,
  isSubmitting,
  onOpenService,
  onCloseService,
  onSelectService,
  onCloseForm,
  onConfirmBooking,
}) {
  if (isServiceOpen) {
    return (
      <View style={styles.expandedContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Book a Ride</Text>
          <TouchableOpacity onPress={onCloseService}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Select a service type</Text>

        <TouchableOpacity
          style={styles.serviceCard}
          activeOpacity={0.8}
          onPress={() => onSelectService("Motorcycle")}
        >
          <View style={styles.serviceIconContainer}>
            <Logo size={40} />
          </View>
          <Text style={styles.serviceCardText}>Motorcycle</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isFormOpen) {
    const isConfirmDisabled =
      isCalculatingRoute || !!routeError || distance <= 0 || isSubmitting;

    return (
      <View style={styles.expandedContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Book {selectedService}</Text>
          <TouchableOpacity onPress={onCloseForm}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="location" size={20} color="#0284c7" style={styles.inputIcon} />
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationLabel}>Pickup Location</Text>
            <Text style={styles.readOnlyInput}>{pickupText}</Text>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="pin" size={20} color="#ef4444" style={styles.inputIcon} />
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationLabel}>Destination</Text>
            <Text style={styles.readOnlyInput}>
              {destinationText || "Tap the map to choose a destination"}
            </Text>
          </View>
        </View>

        <Text style={styles.mapHintText}>
          {isCalculatingRoute
            ? "Calculating route and fare..."
            : routeError
              ? routeError
              : destinationText
                ? `Route distance: ${distance.toFixed(2)} km`
                : "Tap anywhere on the map to set your destination."}
        </Text>

        <View style={styles.farePreview}>
          <Text style={styles.farePreviewLabel}>Estimated Fare</Text>
          <Text style={styles.farePreviewAmount}>
            {distance > 0 && !routeError ? `₱${estimatedFare.toFixed(2)}` : "—"}
          </Text>
          <Text style={styles.farePreviewNote}>
            ₱50 base fare + ₱25 per calculated kilometer
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.confirmBookButton, isConfirmDisabled && styles.disabledButton]}
          onPress={onConfirmBooking}
          activeOpacity={0.8}
          disabled={isConfirmDisabled}
        >
          <Text style={styles.confirmBookText}>Review and Confirm Booking</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.bottomContainer}>
      <TouchableOpacity style={styles.serviceRow} activeOpacity={0.7} onPress={onOpenService}>
        <Text style={styles.serviceText}>🛵 Choose Service ›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.bookButton} onPress={onOpenService} activeOpacity={0.8}>
        <Text style={styles.bookText}>Book a Ride</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    elevation: 10,
  },
  serviceRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  serviceText: { fontSize: 16, fontWeight: "bold", color: "#0f172a" },
  bookButton: { backgroundColor: "#e2e8f0", paddingVertical: 16, borderRadius: 30, alignItems: "center" },
  bookText: { color: "#64748b", fontSize: 16, fontWeight: "bold" },
  expandedContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    elevation: 15,
    zIndex: 20,
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#0f172a" },
  sectionLabel: { fontSize: 14, color: "#64748b", marginBottom: 16, fontWeight: "600" },
  serviceCard: { width: 140, backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0", borderRadius: 16, padding: 16, alignItems: "center" },
  serviceIconContainer: { marginBottom: 10 },
  serviceCardText: { fontSize: 15, fontWeight: "bold", color: "#0f172a" },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12 },
  inputIcon: { marginRight: 10 },
  locationTextContainer: { flex: 1 },
  locationLabel: { fontSize: 11, color: "#64748b", marginBottom: 2 },
  readOnlyInput: { fontSize: 15, color: "#334155", fontWeight: "500" },
  mapHintText: { fontSize: 12, color: "#64748b", marginBottom: 16, fontStyle: "italic" },
  farePreview: { backgroundColor: "#f0f9ff", borderRadius: 12, padding: 14, marginBottom: 14 },
  farePreviewLabel: { color: "#64748b", fontSize: 12, fontWeight: "600" },
  farePreviewAmount: { color: "#0284c7", fontSize: 24, fontWeight: "bold", marginTop: 3 },
  farePreviewNote: { color: "#64748b", fontSize: 10, marginTop: 3 },
  confirmBookButton: { backgroundColor: "#0284c7", paddingVertical: 16, borderRadius: 30, alignItems: "center" },
  confirmBookText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
  disabledButton: { opacity: 0.45 },
});