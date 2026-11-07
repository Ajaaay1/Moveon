import React, { useState, useContext } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import BackgroundWrap from "../components/backgroundWrap";
import { AuthContext } from "../screens/AuthContext"; // Ensure correct relative path to AuthContext

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useContext(AuthContext); // Pull reset function from context

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChangePassword = () => {
    if (!email.trim() || !newPassword || !confirmPassword) {
      Alert.alert("Missing Fields", "Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Password Error", "New passwords do not match.");
      return;
    }

    // Call the context function to update the password in memory
    const result = resetPassword(email, newPassword);

    if (!result.success) {
      Alert.alert("Reset Failed", result.message);
      return;
    }

    Alert.alert(
      "Password Changed",
      result.message,
      [
        {
          text: "OK",
          onPress: () => router.replace("/"), // Navigates back to passenger login (root route)
        },
      ]
    );
  };

  return (
    <BackgroundWrap>
      <View style={styles.container}>
        <View style={styles.form}>
          <Text style={styles.title}>Forgot Password</Text>

          <Text style={styles.subtitle}>
            Enter your registered email and new password.
          </Text>

          {/* Email Input */}
          <Text style={styles.label}>Registered Email</Text>
          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            placeholderTextColor="#ccc"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          {/* New Password */}
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            placeholder="New Password"
            placeholderTextColor="#ccc"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />

          {/* Confirm Password */}
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#ccc"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity
            style={styles.changeBtn}
            onPress={handleChangePassword}
          >
            <Text style={styles.buttonText}>
              Change Password
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.replace("/")}
          >
            <Text style={styles.backText}>
              ← Back to Login
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
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  form: {
    backgroundColor: "rgba(30, 41, 59, 0.92)",
    padding: 22,
    borderRadius: 12,
    width: 320,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 18,
  },
  label: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 13,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ffffff",
    padding: 11,
    borderRadius: 6,
    color: "#ffffff",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  changeBtn: {
    backgroundColor: "#0284c7",
    padding: 12,
    borderRadius: 6,
    marginTop: 20,
  },
  buttonText: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 15,
  },
  backBtn: {
    marginTop: 16,
    alignItems: "center",
  },
  backText: {
    color: "#38bdf8",
    fontSize: 14,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});