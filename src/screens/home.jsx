
import React, { useState, useEffect, useContext, useRef } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Animated,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import MapView from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import Logo from "../components/logo";
import { AuthContext } from "../screens/AuthContext";

const DRAWER_WIDTH = 300;


const drawerItems = [
  {
    label: "History",
    icon: "document-text-outline",
    route: "/history",
  },
  {
    label: "Saved Places",
    icon: "bookmark-outline",
    route: "/saved-places",
  },
  {
    label: "Payment Methods",
    icon: "card-outline",
    route: "/payment-method",
  },
  {
    label: "Inbox",
    icon: "notifications-outline",
    route: "/inbox",
  },
  {
    label: "Support",
    icon: "headset-outline",
    route: "/support",
  },
];


export default function HomeScreen() {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const createBooking = auth?.createBooking;

  const [initialRegion, setInitialRegion] = useState({
    latitude: 8.4542,
    longitude: 124.6319,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [hasLocationPermission, setHasLocationPermission] =
    useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] =
    useState(false);
  const [selectedService, setSelectedService] = useState("");

  const slideAnim = useRef(
    new Animated.Value(-DRAWER_WIDTH)
  ).current;

  // GET CURRENT LOCATION
  useEffect(() => {
    let active = true;

    const getLocation = async () => {
      try {
        const { status } =
          await Location.requestForegroundPermissionsAsync();

        if (status !== "granted" || !active) return;

        setHasLocationPermission(true);

        const location =
          await Location.getCurrentPositionAsync({});

        if (active) {
          setInitialRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      } catch (error) {
        console.log("Location Error:", error);
      }
    };

    getLocation();

    return () => {
      active = false;
    };
  }, []);

  // OPEN DRAWER
  const openDrawer = () => {
    setIsDrawerOpen(true);

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  // CLOSE DRAWER
  const closeDrawer = () => {
    Animated.timing(slideAnim, {
      toValue: -DRAWER_WIDTH,
      duration: 200,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsDrawerOpen(false);
      }
    });
  };

  // FUNCTIONAL DRAWER NAVIGATION
  const navigateToScreen = (route) => {
    slideAnim.stopAnimation();
    slideAnim.setValue(-DRAWER_WIDTH);
    setIsDrawerOpen(false);
    setIsServiceModalOpen(false);

    router.push(route);
  };

  // MOTORCYCLE BOOKING
  const handleBookRide = () => {
    if (!selectedService) {
      Alert.alert(
        "Choose a Service",
        "Please select Motorcycle first."
      );
      return;
    }

    if (typeof createBooking !== "function") {
      Alert.alert(
        "Booking Error",
        "Booking service is unavailable."
      );
      return;
    }

    const newBooking = {
      id: `DEMO-${Date.now()}`,
      passenger: "Demo Passenger",
      service: selectedService,
      pickup: "Current Location",
      destination: "SM City Cagayan de Oro",
      fare: "₱80",
      distance: "3.5 km",
    };

    createBooking(newBooking);
    setIsServiceModalOpen(false);

    Alert.alert(
      "Booking Sent",
      "Your demo booking has been sent to the driver."
    );
  };

  // LOG OUT
  const handleLogout = () => {
    slideAnim.stopAnimation();
    slideAnim.setValue(-DRAWER_WIDTH);
    setIsDrawerOpen(false);
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* MAP */}
      <MapView
        style={styles.map}
        showsUserLocation={hasLocationPermission}
        showsMyLocationButton={hasLocationPermission}
        region={initialRegion}
      />

      {/* HAMBURGER BUTTON */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={openDrawer}
      >
        <Ionicons name="menu" size={26} color="#0f172a" />
      </TouchableOpacity>

      {/* DARK OVERLAY */}
      {(isDrawerOpen || isServiceModalOpen) && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => {
            if (isDrawerOpen) {
              closeDrawer();
            } else {
              setIsServiceModalOpen(false);
            }
          }}
        />
      )}

      {/* DRAWER */}
      {isDrawerOpen && (
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* PROFILE */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Logo size={55} />
            </View>

            <Text style={styles.profileName}>
              Demo Passenger
            </Text>

            <Text style={styles.profileSubtitle}>
              Passenger Account
            </Text>
          </View>

          {/* DRAWER BUTTONS */}
          <View style={styles.drawerContent}>
            {drawerItems.map((item) => (
              <TouchableOpacity
                key={item.route}
                style={styles.drawerItem}
                activeOpacity={0.7}
                onPress={() =>
                  navigateToScreen(item.route)
                }
              >
                <Ionicons
                  name={item.icon}
                  size={22}
                  color="#0f172a"
                />

                <Text style={styles.drawerItemText}>
                  {item.label}
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* LOG OUT */}
          <TouchableOpacity
            style={styles.drawerLogoutBtn}
            onPress={handleLogout}
          >
            <Ionicons
              name="log-out-outline"
              size={22}
              color="#ef4444"
            />

            <Text style={styles.drawerLogoutText}>
              Log Out
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* SERVICE SELECTION */}
      {isServiceModalOpen ? (
        <View style={styles.expandedContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Choose Your Service
            </Text>

            <TouchableOpacity
              onPress={() =>
                setIsServiceModalOpen(false)
              }
            >
              <Ionicons
                name="close"
                size={24}
                color="#000"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>
            Select a service type
          </Text>

          {/* MOTORCYCLE */}
          <TouchableOpacity
            style={[
              styles.serviceCard,
              selectedService === "Motorcycle" &&
                styles.selectedServiceCard,
            ]}
            onPress={() =>
              setSelectedService("Motorcycle")
            }
          >
            <Logo size={40} />

            <Text style={styles.serviceCardText}>
              Motorcycle
            </Text>

            {selectedService === "Motorcycle" && (
              <Text style={styles.selectedText}>
                Selected
              </Text>
            )}
          </TouchableOpacity>

          {/* CONFIRM BOOKING */}
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleBookRide}
          >
            <Text style={styles.confirmButtonText}>
              Book Ride
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* BOTTOM BOOKING PANEL */
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.serviceRow}
            onPress={() =>
              setIsServiceModalOpen(true)
            }
          >
            <Text style={styles.serviceText}>
              🛵 {selectedService || "Choose Service"} ›
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bookButton}
            onPress={() =>
              setIsServiceModalOpen(true)
            }
          >
            <Text style={styles.bookText}>
              Book a Ride
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  map: {
    ...StyleSheet.absoluteFillObject,
  },

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
    width: DRAWER_WIDTH,
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

  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },

  profileSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 5,
  },

  drawerContent: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 16,
  },

  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },

  drawerItemText: {
    flex: 1,
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

  serviceRow: {
    marginBottom: 14,
  },

  serviceText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0f172a",
  },

  bookButton: {
    backgroundColor: "#e2e8f0",
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: "center",
  },

  bookText: {
    color: "#475569",
    fontSize: 15,
    fontWeight: "bold",
  },

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

  modalTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#0f172a",
  },

  sectionLabel: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 14,
  },

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

  selectedServiceCard: {
    borderColor: "#0284c7",
    backgroundColor: "#e0f2fe",
  },

  serviceCardText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0f172a",
  },

  selectedText: {
    color: "#0284c7",
    fontSize: 12,
    fontWeight: "bold",
  },

  confirmButton: {
    backgroundColor: "#0284c7",
    padding: 14,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 18,
  },

  confirmButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 15,
  },
});
