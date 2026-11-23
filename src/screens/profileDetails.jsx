import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../screens/AuthContext";

export default function ProfileDetailsScreen() {
  const router = useRouter();
  const { currentUser, updateProfile } = useContext(AuthContext);
  const isDriver = currentUser?.role === "driver";

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseId, setLicenseId] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(currentUser?.full_name || "");
    setPhone(currentUser?.phone || "");
    setLicenseId(currentUser?.driverProfile?.license_id || "");
    setVehicleType(currentUser?.driverProfile?.vehicle_type || "");
    setPlateNumber(currentUser?.driverProfile?.plate_number || "");
  }, [currentUser]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert("Missing information", "Please enter your full name.");
      return;
    }

    if (isDriver && (!licenseId.trim() || !vehicleType.trim() || !plateNumber.trim())) {
      Alert.alert("Missing information", "Please complete your license ID, vehicle type, and plate number.");
      return;
    }

    setSaving(true);
    const result = await updateProfile({
      full_name: fullName,
      phone,
      license_id: licenseId,
      vehicle_type: vehicleType,
      plate_number: plateNumber,
    });
    setSaving(false);

    if (!result.success) {
      Alert.alert("Update failed", result.message || "Please try again.");
      return;
    }

    Alert.alert("Profile updated", "Your registration details have been updated.");
  };

  if (!currentUser) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={23} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>My Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.avatar}>
          <Ionicons name="person" size={42} color="#0284c7" />
        </View>
        <Text style={styles.role}>{isDriver ? "Driver Account" : "Passenger Account"}</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Full name" />

        <Text style={styles.label}>Email Address</Text>
        <View style={styles.readOnlyField}>
          <Text style={styles.readOnlyText}>{currentUser.email || "No email available"}</Text>
          <Ionicons name="lock-closed-outline" size={16} color="#94a3b8" />
        </View>
        <Text style={styles.hint}>Email is read-only. It is used for account login.</Text>

        {isDriver && (
          <>
            <Text style={styles.label}>Contact Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Contact number"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Driver's License ID</Text>
            <TextInput
              style={styles.input}
              value={licenseId}
              onChangeText={setLicenseId}
              placeholder="License ID"
              autoCapitalize="characters"
            />

            <Text style={styles.label}>Vehicle Type / Model</Text>
            <TextInput
              style={styles.input}
              value={vehicleType}
              onChangeText={setVehicleType}
              placeholder="e.g. Yamaha NMAX"
            />

            <Text style={styles.label}>Vehicle Plate Number</Text>
            <TextInput
              style={styles.input}
              value={plateNumber}
              onChangeText={(value) => setPlateNumber(value.toUpperCase())}
              placeholder="Plate number"
              autoCapitalize="characters"
            />
          </>
        )}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" },
  header: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 16, flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  backButton: { paddingRight: 16, paddingVertical: 4 },
  title: { color: "#0f172a", fontSize: 20, fontWeight: "bold" },
  content: { padding: 22, paddingBottom: 40 },
  avatar: { alignSelf: "center", width: 82, height: 82, borderRadius: 41, backgroundColor: "#e0f2fe", alignItems: "center", justifyContent: "center", marginTop: 10 },
  role: { color: "#64748b", textAlign: "center", marginTop: 10, marginBottom: 25, fontWeight: "600" },
  label: { color: "#334155", fontSize: 13, fontWeight: "600", marginBottom: 7, marginTop: 14 },
  input: { backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 11, paddingHorizontal: 14, paddingVertical: 13, color: "#0f172a", fontSize: 15 },
  readOnlyField: { backgroundColor: "#e2e8f0", borderRadius: 11, paddingHorizontal: 14, paddingVertical: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  readOnlyText: { color: "#475569", fontSize: 15 },
  hint: { color: "#94a3b8", fontSize: 11, marginTop: 5 },
  saveButton: { marginTop: 28, backgroundColor: "#0284c7", borderRadius: 12, paddingVertical: 15, alignItems: "center" },
  saveText: { color: "#ffffff", fontSize: 15, fontWeight: "bold" },
});
