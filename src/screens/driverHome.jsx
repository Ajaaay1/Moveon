import React, { useState } from "react";
import {
  Alert,
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
import Logo from "../components/logo";
import BackgroundWrap from "../components/backgroundWrap";
import DRIVER_RIDES from "../data/driverRides";

const STATUS_STEPS = [
  "Waiting for driver",
  "Proceed to Pick Up",
  "Arrived at Pick Up",
  "Start Ride",
  "Drop Off / Complete",
];

const DEMO_HISTORY = [
  { id: "H-01", passenger: "Ana Reyes", route: "Bajada → UM", fare: "₱95" },
  { id: "H-02", passenger: "John Cruz", route: "Centrio → Airport", fare: "₱180" },
];

export default function DriverHomeScreen() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [autoAccept, setAutoAccept] = useState(false);
  const [targetEnabled, setTargetEnabled] = useState(false);
  const [targetDestination, setTargetDestination] = useState("SM City Davao");
  const [statusIndex, setStatusIndex] = useState(0);

  const ride = DRIVER_RIDES[0];

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => router.replace("/driver/login"),
      },
    ]);
  };

  const handleRideStatus = () => {
    if (statusIndex < STATUS_STEPS.length - 1) {
      setStatusIndex(statusIndex + 1);
    } else {
      Alert.alert("Ride Completed", "This is a demo ride. No real booking was made.");
    }
  };

  return (
    <BackgroundWrap>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Logo size={54} />
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={25} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.heading}>
          <Text style={styles.title}>Driver Dashboard</Text>
          <Text style={styles.subtitle}>Welcome, Demo Driver</Text>
        </View>

        <View style={styles.onlineCard}>
          <View>
            <Text style={styles.cardTitle}>Driver Status</Text>
            <Text style={styles.muted}>{isOnline ? "You are online" : "You are offline"}</Text>
          </View>
          <Switch value={isOnline} onValueChange={setIsOnline} />
        </View>

        <Text style={styles.sectionTitle}>Live Map</Text>
        <View style={styles.mapCard}>
          <Ionicons name="map-outline" size={42} color="#38bdf8" />
          <Text style={styles.mapTitle}>Demo Map</Text>
          <Text style={styles.muted}>Cagayan de Oro City</Text>
          <Text style={styles.mapNote}>Sample location only — GPS is not connected.</Text>
        </View>

        <Text style={styles.sectionTitle}>Driver Settings</Text>
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={styles.cardTitle}>Auto-Accept Requests</Text>
              <Text style={styles.muted}>Automatically accept demo requests.</Text>
            </View>
            <Switch value={autoAccept} onValueChange={setAutoAccept} />
          </View>
          <View style={styles.settingDivider} />
          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={styles.cardTitle}>Target Destination</Text>
              <Text style={styles.muted}>Show requests going toward your target.</Text>
            </View>
            <Switch value={targetEnabled} onValueChange={setTargetEnabled} />
          </View>
          {targetEnabled && (
            <TextInput
              style={styles.input}
              value={targetDestination}
              onChangeText={setTargetDestination}
              placeholder="Enter target destination"
              placeholderTextColor="#94a3b8"
            />
          )}
        </View>

        <Text style={styles.sectionTitle}>Current Booking</Text>
        <View style={styles.bookingCard}>
          <View style={styles.bookingTop}>
            <Text style={styles.cardTitle}>{ride.passenger}</Text>
            <Text style={styles.fare}>{ride.fare}</Text>
          </View>
          <Text style={styles.muted}>Pickup: {ride.pickup}</Text>
          <Text style={styles.muted}>Destination: {ride.destination}</Text>
          <Text style={styles.muted}>Distance: {ride.distance}</Text>
          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>Current Status</Text>
            <Text style={styles.statusValue}>{STATUS_STEPS[statusIndex]}</Text>
          </View>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleRideStatus}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {statusIndex === 0 ? "Accept Ride" : statusIndex === STATUS_STEPS.length - 1 ? "Finish Demo" : "Next Step"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => router.push({ pathname: "/details", params: { id: String(ride.id) } })}
          >
            <Text style={styles.detailsText}>View Booking Details</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Driver Wallet</Text>
        <View style={styles.walletCard}>
          <Text style={styles.muted}>Demo Earnings</Text>
          <Text style={styles.walletAmount}>₱1,250.00</Text>
          <Text style={styles.walletNote}>Sample balance only. No real payment is connected.</Text>
        </View>

        <Text style={styles.sectionTitle}>Recent Job History</Text>
        {DEMO_HISTORY.map((item) => (
          <View key={item.id} style={styles.historyCard}>
            <View style={styles.historyText}>
              <Text style={styles.cardTitle}>{item.passenger}</Text>
              <Text style={styles.muted}>{item.route}</Text>
            </View>
            <Text style={styles.fare}>{item.fare}</Text>
          </View>
        ))}
      </ScrollView>
    </BackgroundWrap>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingTop: 35,
    paddingBottom: 35,
    gap: 12,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoutButton: { padding: 8 },
  heading: { alignItems: "center", marginBottom: 5 },
  title: { color: "#ffffff", fontSize: 24, fontWeight: "bold" },
  subtitle: { color: "#cbd5e1", marginTop: 4 },
  sectionTitle: { color: "#ffffff", fontSize: 17, fontWeight: "bold", marginTop: 8 },
  onlineCard: {
    backgroundColor: "rgba(30, 41, 59, 0.94)",
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingCard: {
    backgroundColor: "rgba(30, 41, 59, 0.94)",
    borderRadius: 12,
    padding: 15,
  },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  settingText: { flex: 1 },
  settingDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.15)", marginVertical: 12 },
  cardTitle: { color: "#ffffff", fontSize: 15, fontWeight: "bold" },
  muted: { color: "#cbd5e1", fontSize: 12, marginTop: 4 },
  mapCard: {
    minHeight: 150,
    backgroundColor: "rgba(30, 41, 59, 0.94)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  mapTitle: { color: "#ffffff", fontSize: 18, fontWeight: "bold", marginTop: 8 },
  mapNote: { color: "#94a3b8", fontSize: 11, marginTop: 8, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#64748b",
    borderRadius: 8,
    color: "#ffffff",
    padding: 10,
    marginTop: 12,
  },
  bookingCard: {
    backgroundColor: "rgba(30, 41, 59, 0.94)",
    borderRadius: 12,
    padding: 15,
    gap: 7,
  },
  bookingTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  fare: { color: "#38bdf8", fontSize: 16, fontWeight: "bold" },
  statusBox: { backgroundColor: "rgba(56, 189, 248, 0.12)", borderRadius: 8, padding: 10, marginTop: 8 },
  statusLabel: { color: "#94a3b8", fontSize: 11 },
  statusValue: { color: "#38bdf8", fontWeight: "bold", marginTop: 4 },
  primaryButton: { backgroundColor: "#0284c7", padding: 12, borderRadius: 8, marginTop: 8 },
  buttonText: { color: "#ffffff", textAlign: "center", fontWeight: "bold" },
  detailsButton: { padding: 8, alignItems: "center" },
  detailsText: { color: "#38bdf8", fontWeight: "bold" },
  walletCard: { backgroundColor: "rgba(30, 41, 59, 0.94)", borderRadius: 12, padding: 16 },
  walletAmount: { color: "#ffffff", fontSize: 27, fontWeight: "bold", marginTop: 5 },
  walletNote: { color: "#94a3b8", fontSize: 11, marginTop: 5 },
  historyCard: {
    backgroundColor: "rgba(30, 41, 59, 0.94)",
    borderRadius: 10,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyText: { flex: 1 },
});