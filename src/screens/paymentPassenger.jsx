import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState("Cash");

  const methods = [
    { name: "Cash", icon: "cash-outline" },
    { name: "GCash", icon: "wallet-outline" },
    { name: "Maya", icon: "card-outline" },
  ];

  const savePayment = () => {
    Alert.alert(
      "Payment Selected",
      `${selected} has been selected for this demo.`,
      [{ text: "OK", onPress: () => router.back() }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>Payment Methods</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>
          Choose your preferred payment method
        </Text>

        {methods.map((method) => (
          <TouchableOpacity
            key={method.name}
            style={[
              styles.card,
              selected === method.name && styles.selectedCard,
            ]}
            onPress={() => setSelected(method.name)}
          >
            <Ionicons
              name={method.icon}
              size={26}
              color="#0284c7"
            />

            <Text style={styles.methodText}>
              {method.name}
            </Text>

            <Ionicons
              name={
                selected === method.name
                  ? "radio-button-on"
                  : "radio-button-off"
              }
              size={24}
              color="#0284c7"
            />
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.button}
          onPress={savePayment}
        >
          <Text style={styles.buttonText}>
            Confirm Payment Method
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 15,
  },
  selectedCard: {
    backgroundColor: "#e0f2fe",
    borderColor: "#0284c7",
  },
  methodText: {
    flex: 1,
    fontSize: 16,
    color: "#0f172a",
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#0284c7",
    padding: 16,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
});
