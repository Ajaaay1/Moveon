import React, { useState, useContext } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import BackgroundWrap from "../components/backgroundWrap";
import { AuthContext } from "./AuthContext";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Email Required", "Enter the email address linked to your account.");
      return;
    }

    setIsSending(true);
    const result = await resetPassword(email);
    setIsSending(false);

    if (!result.success) {
      Alert.alert("Reset Email Not Sent", result.message || "Please try again.");
      return;
    }

    Alert.alert(
      "Check Your Email",
      "We sent a password reset link if an account exists for this email address. Open the email to continue resetting your password.",
      [{ text: "OK", onPress: () => router.replace("/") }]
    );
  };

  return (
    <BackgroundWrap>
      <View style={styles.container}>
        <View style={styles.form}>
          <Text style={styles.title}>Reset Your Password</Text>
          <Text style={styles.subtitle}>
            Enter your registered email address and we will send you a reset link.
          </Text>

          <Text style={styles.label}>Registered Email</Text>
          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            editable={!isSending}
          />

          <TouchableOpacity
            style={[styles.changeBtn, isSending && styles.disabledButton]}
            onPress={handleResetPassword}
            disabled={isSending}
            activeOpacity={0.8}
          >
            {isSending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.replace("/")}
            disabled={isSending}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BackgroundWrap>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: "100%", justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  form: { backgroundColor: "rgba(30, 41, 59, 0.94)", padding: 24, borderRadius: 18, width: "100%", maxWidth: 360, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.16)" },
  title: { color: "#ffffff", fontSize: 23, fontWeight: "bold", textAlign: "center", marginBottom: 8 },
  subtitle: { color: "#cbd5e1", fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  label: { color: "#ffffff", fontWeight: "700", fontSize: 13, marginBottom: 7 },
  input: { borderWidth: 1, borderColor: "#64748b", backgroundColor: "rgba(15, 23, 42, 0.7)", padding: 13, borderRadius: 10, color: "#ffffff", fontSize: 15 },
  changeBtn: { backgroundColor: "#0284c7", padding: 14, borderRadius: 12, marginTop: 20, minHeight: 48, justifyContent: "center" },
  buttonText: { color: "#ffffff", textAlign: "center", fontWeight: "bold", fontSize: 15 },
  disabledButton: { opacity: 0.6 },
  backBtn: { marginTop: 18, alignItems: "center", padding: 8 },
  backText: { color: "#7dd3fc", fontSize: 14, fontWeight: "bold" },
});
