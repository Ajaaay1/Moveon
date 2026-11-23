import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { AuthContext } from "./AuthContext";

export default function ProfileDetailsScreen() {
  const router = useRouter();
  const { currentUser, updateProfile } = useContext(AuthContext);
  const isDriver = currentUser?.role === "driver";

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseId, setLicenseId] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [avatarUri, setAvatarUri] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(currentUser?.full_name || "");
    setPhone(currentUser?.phone || "");
    setLicenseId(currentUser?.driverProfile?.license_id || "");
    setVehicleType(currentUser?.driverProfile?.vehicle_type || "");
    setPlateNumber(currentUser?.driverProfile?.plate_number || "");
  }, [currentUser]);

  const chooseProfilePicture = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to choose a profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const cancelEditing = () => {
    setAvatarUri(null);
    setFullName(currentUser?.full_name || "");
    setPhone(currentUser?.phone || "");
    setLicenseId(currentUser?.driverProfile?.license_id || "");
    setVehicleType(currentUser?.driverProfile?.vehicle_type || "");
    setPlateNumber(currentUser?.driverProfile?.plate_number || "");
    setIsEditing(false);
  };

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
      avatarUri,
    });
    setSaving(false);

    if (!result.success) {
      Alert.alert("Update failed", result.message || "Please try again.");
      return;
    }

    setAvatarUri(null);
    setIsEditing(false);
    Alert.alert("Profile updated", "Your profile information has been saved.");
  };

  if (!currentUser) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  const displayedAvatar = avatarUri || currentUser.avatar_url;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={23} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>My Profile</Text>
        <TouchableOpacity
          style={styles.headerAction}
          onPress={isEditing ? cancelEditing : () => setIsEditing(true)}
          disabled={saving}
        >
          <Text style={styles.headerActionText}>{isEditing ? "Cancel" : "Edit"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarWrap}>
          {displayedAvatar ? (
            <Image source={{ uri: displayedAvatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={42} color="#0284c7" />
            </View>
          )}

          {isEditing && (
            <TouchableOpacity style={styles.changePhotoButton} onPress={chooseProfilePicture}>
              <Ionicons name="camera" size={16} color="#ffffff" />
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.role}>{isDriver ? "Driver Account" : "Passenger Account"}</Text>

        {isEditing ? (
          <>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Full name" />

            <Text style={styles.label}>Email Address</Text>
            <View style={styles.readOnlyField}>
              <Text style={styles.readOnlyText}>{currentUser.email || "No email available"}</Text>
              <Ionicons name="lock-closed-outline" size={16} color="#94a3b8" />
            </View>
            <Text style={styles.hint}>Email is used for login and cannot be changed here.</Text>

            <Text style={styles.label}>Contact Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Contact number"
              keyboardType="phone-pad"
            />

            {isDriver && (
              <>
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
          </>
        ) : (
          <View style={styles.detailsCard}>
            <ProfileRow label="Full Name" value={currentUser.full_name} />
            <ProfileRow label="Email Address" value={currentUser.email} />
            <ProfileRow label="Contact Number" value={currentUser.phone} />
            {isDriver && (
              <>
                <ProfileRow label="Driver's License ID" value={currentUser.driverProfile?.license_id} />
                <ProfileRow label="Vehicle Type / Model" value={currentUser.driverProfile?.vehicle_type} />
                <ProfileRow label="Vehicle Plate Number" value={currentUser.driverProfile?.plate_number} />
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ProfileRow({ label, value }) {
  return (
    <View style={styles.profileRow}>
      <Text style={styles.profileLabel}>{label}</Text>
      <Text style={styles.profileValue}>{value || "Not provided"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" },
  header: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 16, flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  backButton: { paddingRight: 16, paddingVertical: 4 },
  title: { color: "#0f172a", fontSize: 20, fontWeight: "bold", flex: 1 },
  headerAction: { paddingHorizontal: 10, paddingVertical: 7 },
  headerActionText: { color: "#0284c7", fontSize: 15, fontWeight: "700" },
  content: { padding: 22, paddingBottom: 40 },
  avatarWrap: { alignItems: "center", marginTop: 10 },
  avatarPlaceholder: { width: 104, height: 104, borderRadius: 52, backgroundColor: "#e0f2fe", alignItems: "center", justifyContent: "center" },
  avatarImage: { width: 104, height: 104, borderRadius: 52, backgroundColor: "#e2e8f0" },
  changePhotoButton: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#0284c7", paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20 },
  changePhotoText: { color: "#ffffff", fontSize: 12, fontWeight: "600" },
  role: { color: "#64748b", textAlign: "center", marginTop: 12, marginBottom: 25, fontWeight: "600" },
  label: { color: "#334155", fontSize: 13, fontWeight: "600", marginBottom: 7, marginTop: 14 },
  input: { backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 11, paddingHorizontal: 14, paddingVertical: 13, color: "#0f172a", fontSize: 15 },
  readOnlyField: { backgroundColor: "#e2e8f0", borderRadius: 11, paddingHorizontal: 14, paddingVertical: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  readOnlyText: { color: "#475569", fontSize: 15 },
  hint: { color: "#94a3b8", fontSize: 11, marginTop: 5 },
  saveButton: { marginTop: 28, backgroundColor: "#0284c7", borderRadius: 12, paddingVertical: 15, alignItems: "center" },
  saveText: { color: "#ffffff", fontSize: 15, fontWeight: "bold" },
  detailsCard: { backgroundColor: "#ffffff", borderRadius: 15, borderWidth: 1, borderColor: "#e2e8f0", paddingHorizontal: 16 },
  profileRow: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  profileLabel: { color: "#94a3b8", fontSize: 12, marginBottom: 5 },
  profileValue: { color: "#0f172a", fontSize: 15, fontWeight: "600" },
});
