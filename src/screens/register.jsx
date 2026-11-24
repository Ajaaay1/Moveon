import React, { useState, useContext } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import Logo from "../components/logo";
import BackgroundWrap from "../components/backgroundWrap";
import { AuthContext } from "../screens/AuthContext"; // Ensure correct relative path

export default function RegisterScreen() {
  const router = useRouter();
  const { registerUser } = useContext(AuthContext);

  // Input states
  const [name, setName] = useState("");
  const [email, setEmail] = useState(""); // <--- Added email state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form submission handler
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Missing Field", "Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Missing Field", "Please enter your email address.");
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

    // Register passenger user using the explicit email field
    const result = await registerUser({
      name,
      fullName: name,
      email: email.trim().toLowerCase(), // <--- Uses what user actually typed
      password,
      role: "passenger",
    });

    if (!result.success) {
      Alert.alert("Registration Failed", result.message);
      return;
    }

    Alert.alert(
      "Registered!",
      "Your passenger account has been created successfully.",
      [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)/passengerHome"),
        },
      ]
    );
  };

  return (
    <BackgroundWrap>
      <View style={styles.container}>
        <View style={styles.form}>
          <Logo />

          {/* Full Name */}
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Jose Delacruz"
            placeholderTextColor="#ccc"
            onChangeText={setName}
            value={name}
          />

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            placeholderTextColor="#ccc"
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            value={email}
          />

          {/* Password */}
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

          {/* Confirm Password */}
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

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text style={styles.fontColor}>Submit</Text>
          </TouchableOpacity>

          {/* Switch to Passenger Login */}
          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => router.push("/")}
          >
            <Text style={styles.switchText}>
              Already have an account?{" "}
              <Text style={styles.linkText}>Log In</Text>
            </Text>
          </TouchableOpacity>

          {/* Switch to Driver Registration */}
          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => router.push("/driver/register")}
          >
            <Text style={styles.switchText}>
              Want to earn with us?{" "}
              <Text style={styles.linkText}>Register as Driver</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BackgroundWrap>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  form: {
    backgroundColor: "rgba(30, 41, 59, 0.94)",
    padding: 24,
    borderRadius: 18,
    gap: 12,
    width: 320,
    maxWidth: "100%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
  },
  label: {
    color: "#f8fafc",
    fontWeight: "700",
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: "#64748b",
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderRadius: 10,
    color: "white",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "white",
    borderRadius: 5,
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
  fontColor: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
  submitBtn: {
    backgroundColor: "#0284c7",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    minHeight: 48,
    justifyContent: "center",
  },
  switchBtn: {
    marginTop: 10,
    alignItems: "center",
  },
  switchText: {
    color: "#cbd5e1",
    fontSize: 13,
    textAlign: "center",
  },
  linkText: {
    color: "#7dd3fc",
    fontWeight: "bold",
  },
});