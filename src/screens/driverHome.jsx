import React, { useState, useEffect, useContext } from "react";
import {
  Alert, Animated, Image, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useRouter } from "expo-router";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import Logo from "../components/logo";
import { AuthContext } from "./AuthContext";

const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

if (!MAPBOX_ACCESS_TOKEN) {
  console.warn("Missing EXPO_PUBLIC_MAPBOX_TOKEN. Driver road-route lines will be unavailable.");
}

const STATUS_STEPS = [
  "Proceed to Pick Up",
  "Arrived at Pick Up",
  "Passenger Picked Up",
  "Drop Off / Complete",
];

export default function DriverHomeScreen() {
  const router = useRouter();
  const {
    currentUser, activeBooking, incomingBookings, acceptBooking,
    updateBookingStatus, updateDriverSettings, logoutUser,
  } = useContext(AuthContext);

  const [isOnline, setIsOnline] = useState(currentUser?.driverProfile?.is_online === true);
  const [autoAccept, setAutoAccept] = useState(currentUser?.driverProfile?.auto_accept === true);
  const [savingDriverSettings, setSavingDriverSettings] = useState(false);

  useEffect(() => {
    setIsOnline(currentUser?.driverProfile?.is_online === true);
    setAutoAccept(currentUser?.driverProfile?.auto_accept === true);
  }, [currentUser?.driverProfile?.is_online, currentUser?.driverProfile?.auto_accept]);

  const handleDriverSettingChange = async (changes) => {
    setSavingDriverSettings(true);
    const result = await updateDriverSettings(changes);
    setSavingDriverSettings(false);
    if (!result.success) {
      Alert.alert("Settings not saved", result.message || "Please try again.");
      return;
    }
    if (typeof changes.is_online === "boolean") setIsOnline(changes.is_online);
    if (typeof changes.auto_accept === "boolean") setAutoAccept(changes.auto_accept);
  };

  useEffect(() => {
    if (!isOnline || !autoAccept || activeBooking || !incomingBookings?.length) return;
    handleAcceptBooking(incomingBookings[0].id);
  }, [isOnline, autoAccept, activeBooking?.id, incomingBookings?.[0]?.id]);
  const [targetEnabled, setTargetEnabled] = useState(false);
  const [targetDestination, setTargetDestination] = useState("SM City Cagayan de Oro");
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [region, setRegion] = useState({
    latitude: 8.4542,
    longitude: 124.6319,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const slideAnim = useState(new Animated.Value(-300))[0];

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        setHasLocationPermission(true);
        const location = await Location.getCurrentPositionAsync({});
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(coords);
      }
    })();
  }, []);

  // Before pickup, route to the passenger. After pickup, route to the destination.
  useEffect(() => {
    const fetchDriverRoute = async (start, end) => {
      if (!MAPBOX_ACCESS_TOKEN) return;
      try {
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?geometries=geojson&access_token=${MAPBOX_ACCESS_TOKEN}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(coord => ({
            latitude: coord[1],
            longitude: coord[0],
          }));
          setRouteCoordinates(coords);
        } else {
          setRouteCoordinates([]);
        }
      } catch (error) {
        console.log("Error fetching driver route:", error);
        setRouteCoordinates([]);
      }
    };

    const passengerPickedUp = activeBooking?.status === "Passenger Picked Up";
    const routeTarget = passengerPickedUp
      ? activeBooking?.destinationCoords
      : activeBooking?.pickupCoords;

    if (activeBooking && routeTarget) {
      const driverStart = { latitude: region.latitude, longitude: region.longitude };
      fetchDriverRoute(driverStart, routeTarget);
    } else {
      setRouteCoordinates([]);
    }
  }, [activeBooking, region]);

  const toggleDrawer = () => {
    if (isDrawerOpen) {
      Animated.timing(slideAnim, { toValue: -300, duration: 250, useNativeDriver: true }).start(() => setIsDrawerOpen(false));
    } else {
      setIsDrawerOpen(true);
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    }
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          const result = await logoutUser();
          if (!result.success) {
            Alert.alert("Logout Failed", result.message || "Please try again.");
            return;
          }
          router.replace("/driver/login");
        },
      },
    ]);
  };

  const handleBookingStatus = async () => {
    const currentIndex = STATUS_STEPS.indexOf(activeBooking.status);
    if (currentIndex === -1 || currentIndex >= STATUS_STEPS.length - 1) return;

    const nextStatus = STATUS_STEPS[currentIndex + 1];
    const result = await updateBookingStatus(nextStatus);
    if (!result?.success) {
      Alert.alert("Update Failed", result?.message || "Could not update this booking.");
      return;
    }
    if (nextStatus === "Drop Off / Complete") {
      Alert.alert("Ride Completed", "The passenger has been dropped off.");
    }
  };

  const handleAcceptBooking = async (bookingId) => {
    const result = await acceptBooking(bookingId);
    if (!result?.success) {
      Alert.alert("Unable to Accept", result?.message || "This booking is no longer available.");
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        showsUserLocation={hasLocationPermission}
        showsMyLocationButton={hasLocationPermission}
      >
        {/* Dynamic Passenger Pickup Marker */}
        {activeBooking && activeBooking.pickupCoords && (
          <Marker coordinate={activeBooking.pickupCoords} title={`Pickup: ${activeBooking.passenger}`} pinColor="#0284c7" />
        )}

        {/* Dynamic Passenger Destination Marker */}
        {activeBooking && activeBooking.status === "Passenger Picked Up" && activeBooking.destinationCoords && (
          <Marker coordinate={activeBooking.destinationCoords} title="Passenger Destination" pinColor="#ef4444" />
        )}

        {/* Mapbox Road-Snapping Route for Driver */}
        {routeCoordinates.length > 0 && activeBooking && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={4}
            strokeColor="#10b981"
          />
        )}
      </MapView>

      <TouchableOpacity style={styles.menuButton} onPress={toggleDrawer}>
        <Ionicons name="menu" size={24} color="#111827" />
      </TouchableOpacity>

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={toggleDrawer}
        />
      )}

      {/* Sliding Drawer */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            {currentUser?.avatar_url ? (
              <Image source={{ uri: currentUser.avatar_url }} style={styles.profileAvatarImage} />
            ) : (
              <Logo size={55} />
            )}
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/details")} activeOpacity={0.7}>
            <Text style={styles.profileName}>{currentUser?.full_name || currentUser?.email || "Driver"}</Text>
            <Text style={styles.profileCaption}>{currentUser?.email || "Driver Account"} · Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.drawerContent}>
          <View style={styles.drawerSection}>
            <Text style={styles.drawerTitle}>Account Details</Text>
            <Text style={styles.drawerSubtitle}>Contact: {currentUser?.phone || "Not provided"}</Text>
            <Text style={styles.drawerSubtitle}>Vehicle: {currentUser?.driverProfile?.vehicle_type || "Not provided"}</Text>
            <Text style={styles.drawerSubtitle}>Plate Number: {currentUser?.driverProfile?.plate_number || "Not provided"}</Text>
            <Text style={styles.drawerSubtitle}>License ID: {currentUser?.driverProfile?.license_id || (currentUser?.driverProfile?.license_image_path ? "License photo uploaded" : "Not provided")}</Text>
          </View>

          <View style={styles.drawerSection}>
            <View style={styles.drawerRow}>
              <View>
                <Text style={styles.drawerTitle}>Driver Status</Text>
                <Text style={styles.drawerSubtitle}>{isOnline ? "You are online" : "You are offline"}</Text>
              </View>
              <Switch value={isOnline} disabled={savingDriverSettings || !!activeBooking} onValueChange={(value) => handleDriverSettingChange({ is_online: value })} />
            </View>
          </View>

          <View style={styles.drawerSection}>
            <Text style={styles.drawerTitle}>Driver Settings</Text>
            <View style={styles.drawerRow}>
              <View style={styles.settingText}>
                <Text style={styles.settingName}>Auto-Accept Requests</Text>
                <Text style={styles.drawerSubtitle}>Automatically accept the first available request</Text>
              </View>
              <Switch value={autoAccept} disabled={savingDriverSettings} onValueChange={(value) => handleDriverSettingChange({ auto_accept: value })} />
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

        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Driver Bottom Panel for Accepting/Managing Booking */}
      <View style={styles.bottomPanel}>
        {activeBooking ? (
          <>
            <View style={styles.bookingHeader}>
              <View>
                <Text style={styles.panelTitle}>Active Booking</Text>
                <Text style={styles.panelSubtitle}>{activeBooking.passenger}</Text>
              </View>
              <Text style={styles.fare}>{activeBooking.fare}</Text>
            </View>
            <Text style={styles.bookingLine}>Pickup: {activeBooking.pickup}</Text>
            {activeBooking.status === "Passenger Picked Up" && (
              <Text style={styles.bookingLine}>Destination: {activeBooking.destination}</Text>
            )}
            <View style={styles.statusBox}>
              <Text style={styles.statusText}>Status: {activeBooking.status}</Text>
            </View>
            <TouchableOpacity style={styles.bookButton} onPress={handleBookingStatus}>
              <Text style={styles.bookButtonText}>
                {activeBooking.status === "Proceed to Pick Up"
                  ? "Arrived at Pick Up"
                  : activeBooking.status === "Arrived at Pick Up"
                    ? "Passenger Picked Up"
                    : "Complete Ride"}
              </Text>
            </TouchableOpacity>
          </>
        ) : isOnline ? (
          <>
            <Text style={styles.panelTitle}>Incoming Ride Requests</Text>
            {incomingBookings?.length ? incomingBookings.map((booking) => (
              <View key={booking.id} style={styles.requestCard}>
                <View style={styles.bookingHeader}>
                  <Text style={styles.panelSubtitle}>{booking.passenger}</Text>
                  <Text style={styles.fare}>{booking.fare}</Text>
                </View>
                <Text style={styles.bookingLine}>Pickup: {booking.pickup}</Text>
                <Text style={styles.bookingLine}>Destination will appear after passenger pickup.</Text>
                <TouchableOpacity style={styles.bookButton} onPress={() => handleAcceptBooking(booking.id)}>
                  <Text style={styles.bookButtonText}>Accept Booking</Text>
                </TouchableOpacity>
              </View>
            )) : (
              <Text style={styles.panelSubtitle}>Waiting for incoming passenger bookings...</Text>
            )}
          </>
        ) : (
          <>
            <Text style={styles.panelTitle}>You are offline</Text>
            <Text style={styles.panelSubtitle}>Turn on Driver Status in your drawer to receive bookings.</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e2e8f0" },
  map: { ...StyleSheet.absoluteFillObject },
  menuButton: { position: "absolute", top: 55, left: 18, backgroundColor: "#ffffff", padding: 11, borderRadius: 25, elevation: 5, zIndex: 10 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)", zIndex: 15 },
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
  profileHeader: { backgroundColor: "#e0f2fe", paddingTop: 55, paddingHorizontal: 20, paddingBottom: 20 },
  profileAvatarImage: { width: 55, height: 55, borderRadius: 28 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#ffffff", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  profileName: { color: "#0f172a", fontSize: 18, fontWeight: "bold" },
  profileCaption: { color: "#64748b", fontSize: 12, marginTop: 3 },
  drawerContent: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  drawerSection: { paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#e2e8f0", gap: 10 },
  drawerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 7 },
  drawerTitle: { color: "#0f172a", fontSize: 15, fontWeight: "bold" },
  drawerSubtitle: { color: "#64748b", fontSize: 11, marginTop: 3 },
  settingText: { flex: 1 },
  settingName: { color: "#1e293b", fontSize: 13, fontWeight: "600" },
  input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, color: "#0f172a", padding: 9, marginTop: 5 },
  walletAmount: { color: "#0284c7", fontSize: 24, fontWeight: "bold", marginTop: 5 },
  historyRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
  historyFare: { color: "#0284c7", fontWeight: "bold" },
  logoutButton: { flexDirection: "row", alignItems: "center", paddingVertical: 17, paddingHorizontal: 22, borderTopWidth: 1, borderTopColor: "#e2e8f0" },
  logoutText: { color: "#ef4444", fontWeight: "bold", marginLeft: 12 },
  bottomPanel: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#ffffff", borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 18, paddingTop: 15, paddingBottom: 28, elevation: 10, maxHeight: "55%" },
  requestCard: { borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 10, marginTop: 8 },
  bookingHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  panelTitle: { color: "#0f172a", fontSize: 15, fontWeight: "bold" },
  panelSubtitle: { color: "#64748b", fontSize: 12, marginTop: 4 },
  bookingLine: { color: "#334155", fontSize: 12, marginTop: 5 },
  fare: { color: "#0284c7", fontSize: 17, fontWeight: "bold" },
  statusBox: { backgroundColor: "#e0f2fe", borderRadius: 8, padding: 9, marginTop: 10 },
  statusText: { color: "#0369a1", fontSize: 12, fontWeight: "bold" },
  bookButton: { backgroundColor: "#0284c7", padding: 13, borderRadius: 25, alignItems: "center", marginTop: 12 },
  bookButtonText: { color: "#ffffff", fontWeight: "bold" },
});