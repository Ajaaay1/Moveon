import React, { useState, useContext } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import Logo from "../components/logo";
import BackgroundWrap from "../components/backgroundWrap";
import { AuthContext } from "../screens/AuthContext"; // 1. Import AuthContext (adjust path if needed)

export default function LoginScreen() {
  const router = useRouter();
  const { loginUser } = useContext(AuthContext); // 2. Extract loginUser from context

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSave = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing Field", "Please fill in all fields.");
      return;
    }

    // 3. Authenticate against registered users context with role "passenger"
    const result = await loginUser(email, password, "passenger");

    // 4. Block access if user is not registered or credentials fail
    if (!result || !result.success) {
      Alert.alert(
        "Access Denied",
        result?.message || "No registered passenger account found with these credentials. Please register first."
      );
      return;
    }

    // 5. Proceed only if the user is verified
    Alert.alert("Log in Successfully!", `Welcome back, ${result.user.name}!`, [
      {
        text: "OK",
        onPress: () => router.replace("/(tabs)/passengerHome"),
      },
    ]);
  };

  return (
    <BackgroundWrap>
      <View style={styles.container}>
        <View style={styles.form}>
          <Logo />
          <Text style={styles.headerTitle}>Login to MoveOn</Text>

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            placeholderTextColor="#ccc"
            onChangeText={setEmail}
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#ccc"
            onChangeText={setPassword}
            value={password}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.forgotPasswordBtn}
            onPress={() => router.push("/forgot-password")}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
            <Text style={styles.fontColor}>Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => router.push("/register")}
          >
            <Text style={styles.switchText}>
              Don't have an account? <Text style={styles.linkText}>Register</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => router.push("/driver/login")}
          >
            <Text style={styles.switchText}>
              Are you a driver? <Text style={styles.linkText}>Driver Log In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BackgroundWrap>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  form: { backgroundColor: "rgba(30, 41, 59, 0.94)", padding: 24, borderRadius: 18, gap: 12, width: 320, maxWidth: "100%", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.16)" },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#ffffff", textAlign: "center", marginBottom: 4 },
  label: { color: "#f8fafc", fontWeight: "700", fontSize: 13 },
  input: { borderWidth: 1, borderColor: "#64748b", backgroundColor: "rgba(15, 23, 42, 0.45)", paddingHorizontal: 13, paddingVertical: 12, borderRadius: 10, color: "#ffffff", fontSize: 15 },
  forgotPasswordBtn: { alignSelf: "flex-end" },
  forgotPasswordText: { color: "#7dd3fc", fontSize: 13, fontWeight: "600" },
  submitBtn: { backgroundColor: "#0284c7", paddingVertical: 14, borderRadius: 12, marginTop: 10, minHeight: 48, justifyContent: "center" },
  fontColor: { color: "white", textAlign: "center", fontWeight: "bold" },
  switchBtn: { marginTop: 8, alignItems: "center" },
  switchText: { color: "#cbd5e1", fontSize: 13, textAlign: "center" },
  linkText: { color: "#7dd3fc", fontWeight: "bold" },
});