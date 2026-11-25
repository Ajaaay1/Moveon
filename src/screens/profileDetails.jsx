import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
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
  const {
    currentUser,
    activeBooking,
    updateProfile,
    updateDriverSettings,
    logoutUser,
    isDark,
    theme,
    toggleDarkMode,
  } = useContext(AuthContext);

  const isDriver = currentUser?.role === "driver";
  const styles = createStyles(isDark);
  const [page, setPage] = useState("menu");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseId, setLicenseId] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [avatarUri, setAvatarUri] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savingDriverSettings, setSavingDriverSettings] = useState(false);

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

    if (!result.canceled && result.assets?.length) setAvatarUri(result.assets[0].uri);
  };

  const cancelEditing = () => {
    setAvatarUri(null);
    setFullName(currentUser?.full_name || "");
    setPhone(currentUser?.phone || "");
    setLicenseId(currentUser?.driverProfile?.license_id || "");
    setVehicleType(currentUser?.driverProfile?.vehicle_type || "");
    setPlateNumber(currentUser?.driverProfile?.plate_number || "");
    setPage("menu");
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert("Missing information", "Please enter your full name.");
      return;
    }

    if (isDriver && ((!licenseId.trim() && !currentUser?.driverProfile?.license_image_path) || !vehicleType.trim() || !plateNumber.trim())) {
      Alert.alert("Missing information", "Please provide a license ID or license photo, vehicle type, and plate number.");
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

    if (!result?.success) {
      Alert.alert("Update failed", result?.message || "Please try again.");
      return;
    }

    setAvatarUri(null);
    setPage("menu");
    Alert.alert("Profile updated", "Your profile information has been saved.");
  };

  const handleDriverSettingChange = async (changes) => {
    setSavingDriverSettings(true);
    const result = await updateDriverSettings(changes);
    setSavingDriverSettings(false);
    if (!result?.success) {
      Alert.alert("Settings not saved", result?.message || "Please try again.");
    }
  };

  const openMessages = () => {
    if (activeBooking?.id) {
      if (isDriver || activeBooking.driver_id) {
        router.push({ pathname: "/chat", params: { bookingId: activeBooking.id } });
      } else {
        Alert.alert("Chat Not Ready", "Messaging becomes available after a driver accepts your booking.");
      }
      return;
    }
    router.push("/inboxPassenger");
  };

  const handleLogout = () => {
    if (activeBooking) {
      Alert.alert("Active ride", "Complete or cancel your active ride before logging out.");
      return;
    }

    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          const result = await logoutUser();
          if (!result?.success) {
            Alert.alert("Logout Failed", result?.message || "Please try again.");
            return;
          }
          router.replace(isDriver ? "/driver/login" : "/login");
        },
      },
    ]);
  };

  // No hook is declared after this auth check; logout can safely clear currentUser.
  if (!currentUser) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  const displayedAvatar = avatarUri || currentUser.avatar_url;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{page === "edit" ? "Personal Information" : "Profile"}</Text>
        {page === "edit" && (
          <TouchableOpacity onPress={cancelEditing}>
            <Text style={styles.headerAction}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            {displayedAvatar ? (
              <Image source={{ uri: displayedAvatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={36} color={theme.accent} />
              </View>
            )}
            <View style={styles.profileIdentity}>
              <Text style={styles.userName}>{currentUser.full_name || "Moveon User"}</Text>
              <Text style={styles.role}>{isDriver ? "Driver Account" : "Passenger Account"}</Text>
            </View>
          </View>
          {page === "menu" && (
            <TouchableOpacity style={styles.editProfileButton} onPress={() => setPage("edit")}>
              <Ionicons name="create-outline" size={17} color={theme.accent} />
              <Text style={styles.editProfileText}>Edit Personal Information</Text>
            </TouchableOpacity>
          )}
        </View>

        {page === "edit" ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Account Details</Text>
            <TouchableOpacity style={styles.photoButton} onPress={chooseProfilePicture}>
              <Ionicons name="camera-outline" size={18} color="#ffffff" />
              <Text style={styles.photoButtonText}>Change Profile Photo</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Full name" placeholderTextColor={theme.muted} />
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.readOnlyField}>
              <Text style={styles.readOnlyText}>{currentUser.email || "No email available"}</Text>
              <Ionicons name="lock-closed-outline" size={16} color={theme.muted} />
            </View>
            <Text style={styles.hint}>Email is used for login and cannot be changed here.</Text>
            <Text style={styles.label}>Contact Number</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Contact number" placeholderTextColor={theme.muted} keyboardType="phone-pad" />

            {isDriver && (
              <>
                <Text style={styles.label}>Driver's License ID</Text>
                <TextInput style={styles.input} value={licenseId} onChangeText={setLicenseId} placeholder="License ID" placeholderTextColor={theme.muted} autoCapitalize="characters" />
                <Text style={styles.label}>Vehicle Type / Model</Text>
                <TextInput style={styles.input} value={vehicleType} onChangeText={setVehicleType} placeholder="e.g. Yamaha NMAX" placeholderTextColor={theme.muted} />
                <Text style={styles.label}>Vehicle Plate Number</Text>
                <TextInput style={styles.input} value={plateNumber} onChangeText={(value) => setPlateNumber(value.toUpperCase())} placeholder="Plate number" placeholderTextColor={theme.muted} autoCapitalize="characters" />
              </>
            )}

            <TouchableOpacity style={[styles.primaryButton, saving && styles.disabled]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Account</Text>
              <ProfileLink icon="person-outline" title="Personal Information" subtitle="Name, contact number and account details" onPress={() => setPage("edit")} theme={theme} />
              <ProfileLink icon="time-outline" title="Ride History" subtitle="View previous trips" onPress={() => router.push(isDriver ? "/(tabs)/rideHistory" : "/historyPassenger")} theme={theme} />
            </View>

            {!isDriver && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Travel</Text>
                <ProfileLink icon="bookmark-outline" title="Saved Places" subtitle="Tap a saved location to pin it on the map" onPress={() => router.push("/savedplacesPassenger")} theme={theme} />
                <ProfileLink icon="card-outline" title="Payment Methods" subtitle="Manage your preferred payment option" onPress={() => router.push("/paymentPassenger")} theme={theme} />
              </View>
            )}

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Communication & Support</Text>
              <ProfileLink icon="chatbubble-ellipses-outline" title="Messages" subtitle={activeBooking ? "Open the active ride conversation" : "View notifications and messages"} onPress={openMessages} theme={theme} />
              <ProfileLink icon="help-circle-outline" title="Help & Support" subtitle="FAQs and contact details" onPress={() => router.push("/supportPassenger")} theme={theme} />
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Preferences</Text>
              <View style={styles.preferenceRow}>
                <View style={styles.preferenceIcon}>
                  <Ionicons name={isDark ? "moon-outline" : "sunny-outline"} size={21} color={theme.accent} />
                </View>
                <View style={styles.preferenceText}>
                  <Text style={styles.linkTitle}>Dark Mode</Text>
                  <Text style={styles.linkSubtitle}>Switch between light and dark appearance</Text>
                </View>
                <Switch value={isDark} onValueChange={toggleDarkMode} trackColor={{ false: theme.border, true: theme.accent }} />
              </View>
            </View>

            {isDriver && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Driver Controls</Text>
                <View style={styles.preferenceRow}>
                  <View style={styles.preferenceIcon}>
                    <Ionicons name="car-outline" size={21} color={theme.accent} />
                  </View>
                  <View style={styles.preferenceText}>
                    <Text style={styles.linkTitle}>Driver Availability</Text>
                    <Text style={styles.linkSubtitle}>{currentUser.driverProfile?.is_online ? "You are online and can receive bookings" : "You are offline"}</Text>
                  </View>
                  <Switch value={currentUser.driverProfile?.is_online === true} disabled={savingDriverSettings || !!activeBooking} onValueChange={(value) => handleDriverSettingChange({ is_online: value })} trackColor={{ false: theme.border, true: theme.accent }} />
                </View>
                <View style={styles.divider} />
                <View style={styles.preferenceRow}>
                  <View style={styles.preferenceIcon}>
                    <Ionicons name="flash-outline" size={21} color={theme.accent} />
                  </View>
                  <View style={styles.preferenceText}>
                    <Text style={styles.linkTitle}>Auto-Accept Requests</Text>
                    <Text style={styles.linkSubtitle}>Automatically accept the first available request</Text>
                  </View>
                  <Switch value={currentUser.driverProfile?.auto_accept === true} disabled={savingDriverSettings} onValueChange={(value) => handleDriverSettingChange({ auto_accept: value })} trackColor={{ false: theme.border, true: theme.accent }} />
                </View>
                <Text style={styles.hint}>Driver availability is locked while a ride is active.</Text>
              </View>
            )}

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ProfileLink({ icon, title, subtitle, onPress, theme }) {
  return (
    <TouchableOpacity style={styles.linkRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.preferenceIcon, { backgroundColor: theme.accentSoft }]}>
        <Ionicons name={icon} size={21} color={theme.accent} />
      </View>
      <View style={styles.preferenceText}>
        <Text style={[styles.linkTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.linkSubtitle, { color: theme.muted }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.muted} />
    </TouchableOpacity>
  );
}

const createStyles = (isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? "#0b1220" : "#f8fafc" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: isDark ? "#0b1220" : "#f8fafc" },
  header: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: isDark ? "#111c2e" : "#ffffff", borderBottomWidth: 1, borderBottomColor: isDark ? "#2b3a4f" : "#e2e8f0" },
  title: { color: isDark ? "#f8fafc" : "#0f172a", fontSize: 21, fontWeight: "800" },
  headerAction: { color: isDark ? "#38bdf8" : "#0284c7", fontSize: 14, fontWeight: "700" },
  content: { padding: 18, paddingBottom: 40, gap: 14 },
  profileCard: { backgroundColor: isDark ? "#111c2e" : "#ffffff", padding: 17, borderRadius: 18, borderWidth: 1, borderColor: isDark ? "#2b3a4f" : "#e2e8f0" },
  profileTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatarPlaceholder: { width: 76, height: 76, borderRadius: 38, backgroundColor: isDark ? "#12354a" : "#e0f2fe", alignItems: "center", justifyContent: "center" },
  avatarImage: { width: 76, height: 76, borderRadius: 38 },
  profileIdentity: { flex: 1 },
  userName: { color: isDark ? "#f8fafc" : "#0f172a", fontSize: 19, fontWeight: "800" },
  role: { color: isDark ? "#9caec2" : "#64748b", fontSize: 12, fontWeight: "600", marginTop: 4 },
  editProfileButton: { marginTop: 16, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: isDark ? "#2b3a4f" : "#e2e8f0", borderRadius: 12, paddingVertical: 11 },
  editProfileText: { color: isDark ? "#38bdf8" : "#0284c7", fontSize: 13, fontWeight: "700" },
  sectionCard: { backgroundColor: isDark ? "#111c2e" : "#ffffff", borderRadius: 16, borderWidth: 1, borderColor: isDark ? "#2b3a4f" : "#e2e8f0", padding: 16 },
  sectionTitle: { color: isDark ? "#f8fafc" : "#0f172a", fontSize: 14, fontWeight: "800", marginBottom: 7 },
  linkRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 11 },
  preferenceRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 11 },
  preferenceIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  preferenceText: { flex: 1 },
  linkTitle: { color: isDark ? "#f8fafc" : "#0f172a", fontSize: 14, fontWeight: "700" },
  linkSubtitle: { color: isDark ? "#9caec2" : "#64748b", fontSize: 11, marginTop: 3, lineHeight: 15 },
  divider: { height: 1, backgroundColor: isDark ? "#2b3a4f" : "#e2e8f0", marginVertical: 5 },
  label: { color: isDark ? "#cbd5e1" : "#334155", fontSize: 13, fontWeight: "700", marginTop: 14, marginBottom: 7 },
  input: { backgroundColor: isDark ? "#111c2e" : "#ffffff", borderWidth: 1, borderColor: isDark ? "#3b4d64" : "#cbd5e1", borderRadius: 11, paddingHorizontal: 13, paddingVertical: 12, color: isDark ? "#f8fafc" : "#0f172a", fontSize: 15 },
  readOnlyField: { backgroundColor: isDark ? "#1e293b" : "#e2e8f0", borderRadius: 11, paddingHorizontal: 13, paddingVertical: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  readOnlyText: { color: isDark ? "#b6c2d2" : "#475569", fontSize: 14 },
  hint: { color: isDark ? "#90a0b5" : "#94a3b8", fontSize: 11, marginTop: 5, lineHeight: 15 },
  photoButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#0284c7", paddingVertical: 11, borderRadius: 10, marginTop: 8 },
  photoButtonText: { color: "#ffffff", fontSize: 13, fontWeight: "700" },
  primaryButton: { marginTop: 24, backgroundColor: "#0284c7", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  primaryButtonText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
  disabled: { opacity: 0.55 },
  logoutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, borderRadius: 14, borderWidth: 1, borderColor: "#fecaca", backgroundColor: "#fff7f7", paddingVertical: 15 },
  logoutText: { color: "#ef4444", fontSize: 15, fontWeight: "800" },
});
