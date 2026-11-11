import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "./AuthContext";

export default function HistoryPassenger() {
  const router = useRouter();
  const auth = useContext(AuthContext);

  const bookings = auth?.bookings ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={26}
            color="#0f172a"
          />
        </TouchableOpacity>
        <Text style={styles.title}>Ride History</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {bookings.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="time-outline"
              size={65}
              color="#94a3b8"
            />
            <Text style={styles.emptyTitle}>
              No rides yet
            </Text>
            <Text style={styles.subtitle}>
              Your ride bookings will appear here.
            </Text>
          </View>
        ) : (
          bookings.map((ride, index) => (
            <View key={ride.id ?? index} style={styles.card}>
              <Text style={styles.cardTitle}>
                {ride.service ?? "Motorcycle Ride"}
              </Text>
              <Text>From: {ride.pickup ?? "Unknown"}</Text>
              <Text>
                To: {ride.destination ?? "Unknown"}
              </Text>
              <Text>Fare: {ride.fare ?? "Not set"}</Text>
              <Text>
                Status: {ride.status ?? "Booked"}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    gap: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
  },
  content: { flexGrow: 1, padding: 20 },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 15,
    color: "#0f172a",
  },
  subtitle: {
    color: "#64748b",
    marginTop: 8,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#f8fafc",
    borderRadius: 15,
    padding: 18,
    marginBottom: 12,
    gap: 7,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0284c7",
  },
});
