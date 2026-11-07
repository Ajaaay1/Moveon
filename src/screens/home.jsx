import React, { useState, useEffect, useContext } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import MapView from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import Logo from "../components/logo";
import { AuthContext } from "./AuthContext";

export default function HomeScreen() {
  const router = useRouter();
  const { createBooking } = useContext(AuthContext);
  const [initialRegion, setInitialRegion] = useState({
    latitude: 8.4542,
    longitude: 124.6319,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState("");
  const slideAnim = useState(new Animated.Value(-300))[0];

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        setHasLocationPermission(true);
        const location = await Location.getCurrentPositionAsync({});
        setInitialRegion({
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

  const handleBookRide = () => {
    if (!selectedService) {
      Alert.alert("Choose a Service", "Please select Motorcycle first.");
      return;
    }

    createBooking({
      id: "DEMO-001",
      passenger: "Demo Passenger",
      service: selectedService,
      pickup: "Current Location",
      destination: "SM City Cagayan de Oro",
      fare: "₱80",
      distance: "3.5 km",
    });

    setIsServiceModalOpen(false);
    Alert.alert("Booking Sent", "Your demo booking has been sent to the driver.");
  };

  const handleLogout = () => {
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        showsUserLocation={hasLocationPermission}
        showsMyLocationButton={hasLocationPermission}
        region={initialRegion}
      />

      <TouchableOpacity style={styles.menuButton} onPress={toggleDrawer}>
        <Ionicons name="menu" size={24} color="#000" />
      </TouchableOpacity>

      {(isDrawerOpen || isServiceModalOpen) && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => {
            if (isDrawerOpen) toggleDrawer();
            setIsServiceModalOpen(false);
          }}
        />
      )}

      <Animated.View
        style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Logo size={55} />
          </View>
          <Text style={styles.profileName}>Demo Passenger</Text>
        </View>

        <View style={styles.drawerContent}>
          <TouchableOpacity style={styles.drawerItem}>
            <Ionicons name="document-text-outline" size={22} color="#0f172a" />
            <Text style={styles.drawerItemText}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.drawerItem}>
            <Ionicons name="bookmark-outline" size={22} color="#0f172a" />
            <Text style={styles.drawerItemText}>Saved Places</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.drawerItem}>
            <Ionicons name="card-outline" size={22} color="#0f172a" />
            <Text style={styles.drawerItemText}>Payment Methods</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.drawerItem}>
            <Ionicons name="notifications-outline" size={22} color="#0f172a" />
            <Text style={styles.drawerItemText}>Inbox</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.drawerItem}>
            <Ionicons name="headset-outline" size={22} color="#0f172a" />
            <Text style={styles.drawerItemText}>Support</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.drawerLogoutBtn}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text style={styles.drawerLogoutText}>Log Out</Text>
        </TouchableOpacity>
      </Animated.View>

      {isServiceModalOpen ? (
        <View style={styles.expandedContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Your Service</Text>
            <TouchableOpacity onPress={() => setIsServiceModalOpen(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Select a service type</Text>

          <TouchableOpacity
            style={[
              styles.serviceCard,
              selectedService === "Motorcycle" && styles.selectedServiceCard,
            ]}
            onPress={() => setSelectedService("Motorcycle")}
          >
            <Logo size={40} />
            <Text style={styles.serviceCardText}>Motorcycle</Text>
            {selectedService === "Motorcycle" && (
              <Text style={styles.selectedText}>Selected</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleBookRide}
          >
            <Text style={styles.confirmButtonText}>Book Ride</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.serviceRow}
            onPress={() => setIsServiceModalOpen(true)}
          >
            <Text style={styles.serviceText}>
              🛵 {selectedService || "Choose Service"} ›
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => setIsServiceModalOpen(true)}
          >
            <Text style={styles.bookText}>Book a Ride</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  avatarContainer: {
    width: 75,
    height: 75,
    borderRadius: 38,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  profileName: { fontSize: 18, fontWeight: "bold", color: "#0f172a" },
  drawerContent: { flex: 1, paddingTop: 10, paddingHorizontal: 16 },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  drawerItemText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#0f172a",
    marginLeft: 16,
  },
  drawerLogoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  drawerLogoutText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ef4444",
    marginLeft: 16,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    elevation: 10,
    zIndex: 5,
  },
  serviceRow: { marginBottom: 14 },
  serviceText: { fontSize: 15, fontWeight: "bold", color: "#0f172a" },
  bookButton: {
    backgroundColor: "#e2e8f0",
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: "center",
  },
  bookText: { color: "#475569", fontSize: 15, fontWeight: "bold" },
  expandedContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 38,
    zIndex: 20,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  modalTitle: { fontSize: 21, fontWeight: "bold", color: "#0f172a" },
  sectionLabel: { fontSize: 14, color: "#64748b", marginBottom: 14 },
  serviceCard: {
    width: 150,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 14,
    padding: 15,
    alignItems: "center",
    gap: 8,
  },
  selectedServiceCard: { borderColor: "#0284c7", backgroundColor: "#e0f2fe" },
  serviceCardText: { fontSize: 15, fontWeight: "bold", color: "#0f172a" },
  selectedText: { color: "#0284c7", fontSize: 12, fontWeight: "bold" },
  confirmButton: {
    backgroundColor: "#0284c7",
    padding: 14,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 18,
  },
  confirmButtonText: { color: "#ffffff", fontWeight: "bold", fontSize: 15 },
});
