import React, { useState, useEffect, useContext } from "react";
import {
  Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { useRouter } from "expo-router";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
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
    updateBookingStatus, isDark, theme,
  } = useContext(AuthContext);
  const styles = createStyles(isDark);

  const [isOnline, setIsOnline] = useState(currentUser?.driverProfile?.is_online === true);
  const [autoAccept, setAutoAccept] = useState(currentUser?.driverProfile?.auto_accept === true);

  useEffect(() => {
    setIsOnline(currentUser?.driverProfile?.is_online === true);
    setAutoAccept(currentUser?.driverProfile?.auto_accept === true);
  }, [currentUser?.driverProfile?.is_online, currentUser?.driverProfile?.auto_accept]);

  useEffect(() => {
    if (!isOnline || !autoAccept || activeBooking || !incomingBookings?.length) return;
    handleAcceptBooking(incomingBookings[0].id);
  }, [isOnline, autoAccept, activeBooking?.id, incomingBookings?.[0]?.id]);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [region, setRegion] = useState({
    latitude: 8.4542,
    longitude: 124.6319,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [routeCoordinates, setRouteCoordinates] = useState([]);

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

      {/* Driver Bottom Panel for Accepting/Managing Booking */}
      <ScrollView style={styles.bottomPanel} contentContainerStyle={styles.bottomPanelContent} showsVerticalScrollIndicator={false}>
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
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => router.push({ pathname: "/chat", params: { bookingId: activeBooking.id } })}
              activeOpacity={0.8}
            >
              <Text style={styles.bookButtonText}>Message Passenger</Text>
            </TouchableOpacity>

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
            <Text style={styles.panelSubtitle}>Open Profile > Driver Controls to change your availability.</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? "#1e293b" : "#e2e8f0" },
  map: { ...StyleSheet.absoluteFillObject },
  bottomPanelContent: { paddingBottom: 8 },
  bottomPanel: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: isDark ? "#111c2e" : "#ffffff", borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 18, paddingTop: 15, paddingBottom: 28, elevation: 10, maxHeight: "55%" },
  requestCard: { borderTopWidth: 1, borderTopColor: isDark ? "#2b3a4f" : "#e2e8f0", paddingTop: 10, marginTop: 8 },
  bookingHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  panelTitle: { color: isDark ? "#f8fafc" : "#0f172a", fontSize: 15, fontWeight: "bold" },
  panelSubtitle: { color: isDark ? "#9caec2" : "#64748b", fontSize: 12, marginTop: 4 },
  bookingLine: { color: isDark ? "#cbd5e1" : "#334155", fontSize: 12, marginTop: 5 },
  fare: { color: isDark ? "#38bdf8" : "#0284c7", fontSize: 17, fontWeight: "bold" },
  statusBox: { backgroundColor: isDark ? "#12354a" : "#e0f2fe", borderRadius: 8, padding: 9, marginTop: 10 },
  statusText: { color: isDark ? "#7dd3fc" : "#0369a1", fontSize: 12, fontWeight: "bold" },
  bookButton: { backgroundColor: "#0284c7", padding: 13, borderRadius: 25, alignItems: "center", marginTop: 12 },
  bookButtonText: { color: "#ffffff", fontWeight: "bold" },
});