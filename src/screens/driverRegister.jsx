import React, { useState, useContext } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import Logo from "../components/logo";
import BackgroundWrap from "../components/backgroundWrap";
import { AuthContext } from "../screens/AuthContext";

export default function DriverRegisterScreen() {
  const router = useRouter();
  const { registerUser } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [midName, setMidName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [licenseId, setLicenseId] = useState("");
  const [licenseImageUri, setLicenseImageUri] = useState(null);
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("");

  const chooseLicensePhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Needed", "Allow photo library access to attach your driver's license.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.75,
      });

      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert("Image Too Large", "Choose a license photo smaller than 5 MB.");
          return;
        }
        setLicenseImageUri(asset.uri);
      }
    } catch (error) {
      Alert.alert("Unable to Select Photo", error.message || "Please try again.");
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !lastName.trim()) {
      Alert.alert("Missing Field", "Please enter your First Name and Last Name.");
      return;
    }

    if (!contactInfo.trim()) {
      Alert.alert("Missing Field", "Please enter your contact information.");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Missing Field", "Please enter your email address.");
      return;
    }

    if (!licenseId.trim() && !licenseImageUri) {
      Alert.alert("License Required", "Enter your License ID or attach a clear photo of your driver's license.");
      return;
    }

    if (!plateNumber.trim()) {
      Alert.alert("Missing Field", "Please enter your vehicle plate number.");
      return;
    }

    if (!vehicleType.trim()) {
      Alert.alert("Missing Field", "Please enter your vehicle type or model.");
      return;
    }

    if (!password) {
      Alert.alert("Missing Field", "Please enter a password.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match!");
      return;
    }

    const result = await registerUser({
      name,
      midName,
      lastName,
      contactInfo,
      email,
      password,
      role: "driver",
      licenseId: licenseId.trim(),
      licenseImageUri,
      plateNumber: plateNumber.trim().toUpperCase(),
      vehicleType: vehicleType.trim(),
    });

    if (!result.success) {
      Alert.alert("Registration Failed", result.message);
      return;
    }

    Alert.alert(
      "Driver Account Created!",
      `Welcome Driver ${name} ${lastName}! Your registration application has been submitted successfully.`,
      [
        {
          text: "OK",
          onPress: () => router.replace("/driverHome"),
        },
      ]
    );
  };

  return (
    <BackgroundWrap>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <Logo />
            <Text style={styles.headerTitle}>Driver Registration</Text>
            <Text style={styles.headerSubtitle}>Create an account as Driver</Text>

            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Juan"
              placeholderTextColor="#ccc"
              onChangeText={setName}
              value={name}
            />

            <Text style={styles.label}>Middle Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Santos"
              placeholderTextColor="#ccc"
              onChangeText={setMidName}
              value={midName}
            />

            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Dela Cruz"
              placeholderTextColor="#ccc"
              onChangeText={setLastName}
              value={lastName}
            />

            <Text style={styles.label}>Contact Info</Text>
            <TextInput
              style={styles.input}
              placeholder="0917 123 4567"
              placeholderTextColor="#ccc"
              keyboardType="phone-pad"
              onChangeText={setContactInfo}
              value={contactInfo}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="driver@example.com"
              placeholderTextColor="#ccc"
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={setEmail}
              value={email}
            />

            <Text style={styles.label}>Driver's License ID (optional with photo)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter License ID"
              placeholderTextColor="#94a3b8"
              autoCapitalize="characters"
              onChangeText={setLicenseId}
              value={licenseId}
            />

            <Text style={styles.licenseOrText}>OR</Text>
            <TouchableOpacity
              style={styles.licenseUploadButton}
              onPress={chooseLicensePhoto}
              activeOpacity={0.8}
            >
              <Ionicons
                name={licenseImageUri ? "checkmark-circle-outline" : "camera-outline"}
                size={20}
                color="#7dd3fc"
              />
              <Text style={styles.licenseUploadText}>
                {licenseImageUri ? "Change License Photo" : "Attach License Photo"}
              </Text>
            </TouchableOpacity>

            {licenseImageUri && (
              <View style={styles.licensePreviewRow}>
                <Image source={{ uri: licenseImageUri }} style={styles.licensePreview} />
                <View style={styles.licensePreviewCopy}>
                  <Text style={styles.licensePreviewTitle}>License photo selected</Text>
                  <Text style={styles.licensePreviewHint}>Ready to upload securely</Text>
                  <TouchableOpacity onPress={() => setLicenseImageUri(null)} activeOpacity={0.7}>
                    <Text style={styles.removeLicenseText}>Remove photo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <Text style={styles.label}>Vehicle Type / Model</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Yamaha NMAX"
              placeholderTextColor="#ccc"
              onChangeText={setVehicleType}
              value={vehicleType}
            />

            <Text style={styles.label}>Vehicle Plate Number</Text>
            <TextInput
              style={styles.input}
              placeholder="ABC 1234"
              placeholderTextColor="#ccc"
              autoCapitalize="characters"
              onChangeText={(value) => setPlateNumber(value.toUpperCase())}
              value={plateNumber}
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor="#ccc"
                onChangeText={setPassword}
                value={password}
                secureTextEntry={!showPassword}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={10}
              >
                {showPassword ? (
                  <Eye color="white" size={20} />
                ) : (
                  <EyeOff color="white" size={20} />
                )}
              </Pressable>
            </View>

            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm Password"
                placeholderTextColor="#ccc"
                onChangeText={setConfirmPassword}
                value={confirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                hitSlop={10}
              >
                {showConfirmPassword ? (
                  <Eye color="white" size={20} />
                ) : (
                  <EyeOff color="white" size={20} />
                )}
              </Pressable>
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={styles.fontColor}>Submit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchBtn}
              onPress={() => router.push("/driver/login")}
            >
              <Text style={styles.switchText}>
                Already have a driver account?{" "}
                <Text style={styles.linkText}>Driver Log In</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondarySwitchBtn}
              onPress={() => router.push("/register")}
            >
              <Text style={styles.secondarySwitchText}>
                Register as Passenger instead
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </BackgroundWrap>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingVertical: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  form: {
    backgroundColor: "rgba(30, 41, 59, 0.92)",
    padding: 22,
    borderRadius: 18,
    gap: 12,
    width: 320,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#38bdf8",
    textAlign: "center",
    marginBottom: 6,
  },
  label: {
    color: "white",
    fontWeight: "bold",
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: "#64748b",
    padding: 12,
    borderRadius: 10,
    color: "white",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#64748b",
    borderRadius: 10,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  passwordInput: {
    flex: 1,
    padding: 10,
    color: "white",
  },
  eyeButton: {
    paddingHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  licenseOrText: { color: "#94a3b8", fontSize: 11, textAlign: "center", fontWeight: "700", marginVertical: 2 },
  licenseUploadButton: { minHeight: 48, borderWidth: 1, borderColor: "#64748b", borderStyle: "dashed", borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, padding: 12, backgroundColor: "rgba(15, 23, 42, 0.3)" },
  licenseUploadText: { color: "#7dd3fc", fontSize: 14, fontWeight: "700" },
  licensePreviewRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(15, 23, 42, 0.35)", borderRadius: 10, padding: 10 },
  licensePreview: { width: 76, height: 58, borderRadius: 7, backgroundColor: "#1e293b" },
  licensePreviewCopy: { flex: 1, gap: 3 },
  licensePreviewTitle: { color: "#f8fafc", fontSize: 12, fontWeight: "700" },
  licensePreviewHint: { color: "#94a3b8", fontSize: 11 },
  removeLicenseText: { color: "#fca5a5", fontSize: 11, fontWeight: "700", marginTop: 2 },
  fontColor: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: "#0284c7",
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
    minHeight: 48,
    justifyContent: "center",
  },
  switchBtn: {
    marginTop: 8,
    alignItems: "center",
  },
  switchText: {
    color: "white",
    fontSize: 13,
    textAlign: "center",
  },
  linkText: {
    color: "#38bdf8",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  secondarySwitchBtn: {
    marginTop: 4,
    alignItems: "center",
  },
  secondarySwitchText: {
    color: "#94a3b8",
    fontSize: 12,
    textDecorationLine: "underline",
  },
});
