import React, { useState, useEffect, useContext } from "react";
import {
  Alert,
  Animated,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import MapView from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import Logo from "../components/logo";
import { AuthContext } from "./AuthContext";

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
  const {
    activeBooking,
    updateBookingStatus,
    clearBooking,
  } = useContext(AuthContext);

  const [isOnline, setIsOnline] = useState(false);
  const [autoAccept, setAutoAccept] = useState(false);
  const [targetEnabled, setTargetEnabled] = useState(false);
  const [targetDestination, setTargetDestination] = useState("SM City Cagayan de Oro");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [region, setRegion] = useState({
    latitude: 8.4542,
    longitude: 124.6319,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const slideAnim = useState(new Animated.Value(-300))[0];

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        setHasLocationPermission(true);
        const location = await Location.getCurrentPositionAsync({});
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    })();
  }, []);

  const toggleDrawer = () => {
    if (isDrawerOpen) {
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setIsDrawerOpen(false));
    } else {
      setIsDrawerOpen(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  };

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

  const handleBookingStatus = () => {
    const currentIndex = STATUS_STEPS.indexOf(activeBooking.status);

    if (currentIndex < STATUS_STEPS.length - 1) {
      updateBookingStatus(STATUS_STEPS[currentIndex + 1]);
    } else {
      Alert.alert("Ride Completed", "The demo booking has been completed.");
      clearBooking();
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region}
        showsUserLocation={hasLocationPermission}
        showsMyLocationButton={hasLocationPermission}
      />

      <TouchableOpacity style={styles.menuButton} onPress={toggleDrawer}>
        <Ionicons name="menu" size={24} color="#111827" />
      </TouchableOpacity>

      {(isDrawerOpen || activeBooking) && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => {
            if (isDrawerOpen) toggleDrawer();
          }}
        />
      )}

      <Animated.View
        style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Logo size={55} />
          </View>
          <Text style={styles.profileName}>Demo Driver</Text>
          <Text style={styles.profileCaption}>Driver Account</Text>
        </View>

        <View style={styles.drawerContent}>
          <View style={styles.drawerSection}>
            <View style={styles.drawerRow}>
              <View>
                <Text style={styles.drawerTitle}>Driver Status</Text>
                <Text style={styles.drawerSubtitle}>
                  {isOnline ? "You are online" : "You are offline"}
                </Text>
              </View>
              <Switch value={isOnline} onValueChange={setIsOnline} />
            </View>
          </View>

          <View style={styles.drawerSection}>
            <Text style={styles.drawerTitle}>Driver Settings</Text>
            <View style={styles.drawerRow}>
              <View style={styles.settingText}>
                <Text style={styles.settingName}>Auto-Accept Requests</Text>
                <Text style={styles.drawerSubtitle}>Accept new demo bookings automatically</Text>
              </View>
              <Switch value={autoAccept} onValueChange={setAutoAccept} />
            </View>
            <View style={styles.drawerRow}>
              <View style={styles.settingText}>
                <Text style={styles.settingName}>Target Destination</Text>
                <Text style={styles.drawerSubtitle}>Set your preferred direction</Text>
              </View>
              <Switch value={targetEnabled} onValueChange={setTargetEnabled} />
            </View>
            {targetEnabled && (
              <TextInput
                style={styles.input}
                value={targetDestination}
                onChangeText={setTargetDestination}
                placeholder="Enter destination"
                placeholderTextColor="#94a3b8"
              />
            )}
          </View>

          <View style={styles.drawerSection}>
            <Text style={styles.drawerTitle}>Driver Wallet</Text>
            <Text style={styles.walletAmount}>₱1,250.00</Text>
            <Text style={styles.drawerSubtitle}>Demo balance only</Text>
          </View>

          <View style={styles.drawerSection}>
            <Text style={styles.drawerTitle}>Recent Job History</Text>
            {DEMO_HISTORY.map((item) => (
              <View key={item.id} style={styles.historyRow}>
                <View style={styles.settingText}>
                  <Text style={styles.settingName}>{item.passenger}</Text>
                  <Text style={styles.drawerSubtitle}>{item.route}</Text>
                </View>
                <Text style={styles.historyFare}>{item.fare}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.bottomPanel}>
        {activeBooking ? (
          <>
            <View style={styles.bookingHeader}>
              <View>
                <Text style={styles.panelTitle}>New Booking Request</Text>
                <Text style={styles.panelSubtitle}>{activeBooking.passenger}</Text>
              </View>
              <Text style={styles.fare}>{activeBooking.fare}</Text>
            </View>
            <Text style={styles.bookingLine}>Pickup: {activeBooking.pickup}</Text>
            <Text style={styles.bookingLine}>Destination: {activeBooking.destination}</Text>
            <Text style={styles.bookingLine}>Distance: {activeBooking.distance}</Text>
            <View style={styles.statusBox}>
              <Text style={styles.statusText}>Status: {activeBooking.status}</Text>
            </View>
            <TouchableOpacity style={styles.bookButton} onPress={handleBookingStatus}>
              <Text style={styles.bookButtonText}>
                {activeBooking.status === "Waiting for driver"
                  ? "Accept Booking"
                  : activeBooking.status === "Drop Off / Complete"
                  ? "Complete Ride"
                  : "Next Step"}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.panelTitle}>You are ready to receive bookings</Text>
            <Text style={styles.panelSubtitle}>
              No booking requests yet. A request will appear here after a passenger taps Book Ride.
            </Text>
            <View style={styles.waitingRow}>
              <Ionicons name="bicycle-outline" size={20} color="#64748b" />
              <Text style={styles.waitingText}>Waiting for passenger booking...</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e2e8f0" },
  map: { ...StyleSheet.absoluteFillObject },
  menuButton: {
    position: "absolute",
    top: 55,
    left: 18,
    backgroundColor: "#ffffff",
    padding: 11,
    borderRadius: 25,
    elevation: 5,
    zIndex: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    zIndex: 15,
  },
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 300,
    backgroundColor: "#ffffff",
    zIndex: 20,
    elevation: 20,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  profileHeader: {
    backgroundColor: "#e0f2fe",
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  profileName: { color: "#0f172a", fontSize: 18, fontWeight: "bold" },
  profileCaption: { color: "#64748b", fontSize: 12, marginTop: 3 },
  drawerContent: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  drawerSection: {
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    gap: 10,
  },
  drawerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginTop: 7,
  },
  drawerTitle: { color: "#0f172a", fontSize: 15, fontWeight: "bold" },
  drawerSubtitle: { color: "#64748b", fontSize: 11, marginTop: 3 },
  settingText: { flex: 1 },
  settingName: { color: "#1e293b", fontSize: 13, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    color: "#0f172a",
    padding: 9,
    marginTop: 5,
  },
  walletAmount: { color: "#0284c7", fontSize: 24, fontWeight: "bold", marginTop: 5 },
  historyRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
  historyFare: { color: "#0284c7", fontWeight: "bold" },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 17,
    paddingHorizontal: 22,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  logoutText: { color: "#ef4444", fontWeight: "bold", marginLeft: 12 },
  bottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 15,
    paddingBottom: 28,
    elevation: 10,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  panelTitle: { color: "#0f172a", fontSize: 15, fontWeight: "bold" },
  panelSubtitle: { color: "#64748b", fontSize: 12, marginTop: 4 },
  bookingLine: { color: "#334155", fontSize: 12, marginTop: 5 },
  fare: { color: "#0284c7", fontSize: 17, fontWeight: "bold" },
  statusBox: {
    backgroundColor: "#e0f2fe",
    borderRadius: 8,
    padding: 9,
    marginTop: 10,
  },
  statusText: { color: "#0369a1", fontSize: 12, fontWeight: "bold" },
  bookButton: {
    backgroundColor: "#0284c7",
    padding: 13,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 12,
  },
  bookButtonText: { color: "#ffffff", fontWeight: "bold" },
  waitingRow: { flexDirection: "row", alignItems: "center", marginTop: 12, gap: 8 },
  waitingText: { color: "#64748b", fontSize: 12 },
});
