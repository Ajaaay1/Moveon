import React, { useState, useEffect, useContext } from "react";
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Alert, 
  Animated, 
  TextInput,
  Modal
} from "react-native";
import { useRouter } from "expo-router";
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Logo from "../components/logo";
import { AuthContext } from "./AuthContext";

const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

export default function HomeScreen() {
  const router = useRouter();
  
  // Connect AuthContext
  const { currentUser, activeBooking, createBooking, clearBooking, logoutUser, submitRiderRating } = useContext(AuthContext);
  
  // Location States
  const [initialRegion, setInitialRegion] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [destinationText, setDestinationText] = useState("");
  const [pickupText, setPickupText] = useState("Getting current location...");
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Distance & Route Coordinates States
  const [distance, setDistance] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  // UI States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const slideAnim = useState(new Animated.Value(-300))[0];

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied.');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setCurrentLocation(coords);
      setInitialRegion({
        ...coords,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      try {
        const [address] = await Location.reverseGeocodeAsync(coords);
        const pickupAddress = address
          ? [address.name, address.street, address.district, address.city]
              .filter((part, index, items) => part && items.indexOf(part) === index)
              .join(", ")
          : "";
        setPickupText(pickupAddress || "Current Location");
      } catch (error) {
        setPickupText("Current Location");
      }
    })();
  }, []);

  // Request the road distance and route so the fare uses the calculated route.
  useEffect(() => {
    let active = true;

    const fetchMapboxRoute = async (start, end) => {
      if (!MAPBOX_ACCESS_TOKEN) {
        setRouteError("Map route service is not configured. Add your Mapbox token to the .env file.");
        setDistance(0);
        setRouteCoordinates([]);
        return;
      }

      setIsCalculatingRoute(true);
      setRouteError("");

      try {
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?geometries=geojson&access_token=${MAPBOX_ACCESS_TOKEN}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok || !data.routes?.length) {
          throw new Error(data.message || "A driving route could not be calculated.");
        }

        const route = data.routes[0];
        if (active) {
          setRouteCoordinates(route.geometry.coordinates.map((coord) => ({
            latitude: coord[1],
            longitude: coord[0],
          })));
          setDistance(route.distance / 1000);
        }
      } catch (error) {
        if (active) {
          setRouteCoordinates([]);
          setDistance(0);
          setRouteError(error.message || "Unable to calculate the route.");
        }
      } finally {
        if (active) setIsCalculatingRoute(false);
      }
    };

    if (currentLocation && destination) {
      fetchMapboxRoute(currentLocation, destination);
    } else {
      setRouteCoordinates([]);
      setDistance(0);
      setRouteError("");
      setIsCalculatingRoute(false);
    }

    return () => {
      active = false;
    };
  }, [currentLocation, destination]);

  // Restore the saved pickup and destination pins when a passenger reopens the app.
  useEffect(() => {
    if (!activeBooking) return;

    if (activeBooking.pickupCoords) {
      setCurrentLocation(activeBooking.pickupCoords);
      setPickupText(activeBooking.pickup || "Current Location");
    }
    if (activeBooking.destinationCoords) {
      setDestination(activeBooking.destinationCoords);
      setDestinationText(activeBooking.destination || "Selected Destination");
    }
  }, [activeBooking?.id]);

  const toggleDrawer = () => {
    if (isDrawerOpen) {
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsDrawerOpen(false));
    } else {
      setIsDrawerOpen(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleLogout = async () => {
    const result = await logoutUser();
    if (!result.success) {
      Alert.alert("Logout Failed", result.message || "Please try again.");
      return;
    }
    router.replace("/login");
  };

  const handleSelectService = (serviceName) => {
    setSelectedService(serviceName);
    setIsServiceModalOpen(false);
    setIsFormOpen(true);
  };

  const handleMapPress = async (e) => {
    if (activeBooking) return;

    if (isDrawerOpen) {
      toggleDrawer();
      return;
    }

    const pinnedCoords = e.nativeEvent.coordinate;
    setDestination(pinnedCoords);
    setDestinationText(`${pinnedCoords.latitude.toFixed(4)}, ${pinnedCoords.longitude.toFixed(4)}`);

    try {
      const [address] = await Location.reverseGeocodeAsync(pinnedCoords);
      const readableAddress = address
        ? [address.name, address.street, address.district, address.city]
            .filter((part, index, items) => part && items.indexOf(part) === index)
            .join(", ")
        : "";
      if (readableAddress) setDestinationText(readableAddress);
    } catch (error) {
      console.log("Destination reverse geocoding error:", error);
    }

    if (!isFormOpen) setIsServiceModalOpen(true);
  };

  const estimatedFare = distance > 0 ? 50 + (distance * 25) : 0;

  const handleSubmitBooking = async () => {
    if (isSubmittingBooking) return;
    setIsSubmittingBooking(true);

    const result = await createBooking({
      passenger: currentUser?.full_name || "Passenger",
      service: selectedService || "Motorcycle",
      pickupCoords: currentLocation,
      destinationCoords: destination,
      destinationText,
      pickup: pickupText || "Current Location",
      distance: `${distance.toFixed(2)} km`,
      fare: `₱${estimatedFare.toFixed(2)}`,
    });

    setIsSubmittingBooking(false);
    if (!result?.success) {
      Alert.alert("Booking Failed", result?.message || "Your ride request could not be sent. Please try again.");
      return;
    }

    setIsFormOpen(false);
  };

  const handleConfirmBooking = () => {
    if (!currentLocation) {
      Alert.alert("Pickup Required", "Allow location access so Moveon can set your pickup point.");
      return;
    }
    if (!destination) {
      Alert.alert("Destination Required", "Tap the map to set your destination.");
      return;
    }
    if (isCalculatingRoute) {
      Alert.alert("Calculating Fare", "Please wait while the route and fare are being calculated.");
      return;
    }
    if (routeError || distance <= 0) {
      Alert.alert("Route Not Available", routeError || "A valid route is required before booking.");
      return;
    }

    Alert.alert(
      "Confirm Your Ride",
      `Pickup: ${pickupText}\nDestination: ${destinationText}\nDistance: ${distance.toFixed(2)} km\nEstimated fare: ₱${estimatedFare.toFixed(2)}`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Book Ride", onPress: handleSubmitBooking },
      ]
    );
  };

  const handleCancelBooking = async () => {
    const result = await clearBooking();
    if (!result?.success) {
      Alert.alert("Unable to Cancel", result?.message || "Please try again.");
      return;
    }
    setDestination(null);
    setDestinationText("");
    setDistance(0);
    setRouteCoordinates([]);
  };

  const handleSubmitRating = async () => {
    if (!activeBooking?.id || selectedRating < 1) return;
    setIsSubmittingRating(true);
    const result = await submitRiderRating(activeBooking.id, selectedRating);
    setIsSubmittingRating(false);

    if (!result?.success) {
      Alert.alert("Rating Failed", result?.message || "Your rating could not be saved.");
      return;
    }

    setIsRatingModalOpen(false);
  };

  useEffect(() => {
    if (
      activeBooking?.status === "Drop Off / Complete" &&
      !activeBooking.passengerRating
    ) {
      setSelectedRating(0);
      setIsRatingModalOpen(true);
    } else {
      setIsRatingModalOpen(false);
    }
  }, [activeBooking?.id, activeBooking?.status, activeBooking?.passengerRating]);

  return (
    <View style={styles.container}>
      {/* 2. MAP VIEW */}
      <MapView 
        style={styles.map}
        showsUserLocation={true}
        showsMyLocationButton={true}
        initialRegion={initialRegion}
        onPress={handleMapPress}
      >
        {/* Passenger Pickup Marker */}
        {(activeBooking?.pickupCoords || currentLocation) && (
          <Marker
            coordinate={activeBooking?.pickupCoords || currentLocation}
            title="Pickup Location"
            pinColor="#0284c7"
          />
        )}

        {/* Destination Marker */}
        {destination && (
          <Marker coordinate={destination} title="Destination" pinColor="#ef4444" />
        )}

        {/* Calculated road route to the passenger destination */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={4}
            strokeColor="#0284c7"
          />
        )}

      </MapView>

      {/* Menu Button */}
      {!activeBooking && (
        <TouchableOpacity style={styles.menuButton} onPress={toggleDrawer} activeOpacity={0.8}>
          <Ionicons name="menu" size={24} color="#000" />
        </TouchableOpacity>
      )}

      {/* Dark Overlay */}
      {isDrawerOpen && (
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={toggleDrawer} 
        />
      )}

      {/* Side Drawer */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Logo size={55} />
          </View>
          <TouchableOpacity style={styles.profileNameRow} activeOpacity={0.7}>
            <View>
              <Text style={styles.profileName}>{currentUser?.full_name || currentUser?.email || "Passenger"}</Text>
              {!!currentUser?.email && <Text style={styles.profileEmail}>{currentUser.email}</Text>}
              {!!currentUser?.phone && <Text style={styles.profileEmail}>{currentUser.phone}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#0f172a" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        <View style={styles.drawerContent}>
          <TouchableOpacity
            style={styles.drawerItem}
            activeOpacity={0.7}
            onPress={() => router.push("/historyPassenger")}
          >
            <Ionicons name="document-text-outline" size={22} color="#0f172a" />
            <Text style={styles.drawerItemText}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.drawerItem}
            activeOpacity={0.7}
            onPress={() => router.push("/savedplacesPassenger")}
          >
            <Ionicons name="bookmark-outline" size={22} color="#0f172a" />
            <Text style={styles.drawerItemText}>Saved Places</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.drawerItem}
            activeOpacity={0.7}
            onPress={() => router.push("/inboxPassenger")}
          >
            <Ionicons name="mail-outline" size={22} color="#0f172a" />
            <Text style={styles.drawerItemText}>Inbox</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.drawerItem}
            activeOpacity={0.7}
            onPress={() => router.push("/paymentPassenger")}
          >
            <Ionicons name="card-outline" size={22} color="#0f172a" />
            <Text style={styles.drawerItemText}>Payment Methods</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.drawerItem}
            activeOpacity={0.7}
            onPress={() => router.push("/supportPassenger")}
          >
            <Ionicons name="help-circle-outline" size={22} color="#0f172a" />
            <Text style={styles.drawerItemText}>Help & Support</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.drawerLogoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text style={styles.drawerLogoutText}>Log Out</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Service Selection Sheet */}
      {isServiceModalOpen && (
        <View style={styles.expandedContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Hi! Naka move-on kana ba?</Text>
            <TouchableOpacity onPress={() => setIsServiceModalOpen(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Select a service type</Text>

          <TouchableOpacity 
            style={styles.serviceCard} 
            activeOpacity={0.8}
            onPress={() => handleSelectService('Motorcycle')}
          >
            <View style={styles.serviceIconContainer}>
              <Logo size={40} />
            </View>
            <Text style={styles.serviceCardText}>Motorcycle</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Form Sheet */}
      {isFormOpen && (
        <View style={styles.expandedContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Book {selectedService}</Text>
            <TouchableOpacity onPress={() => setIsFormOpen(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="location" size={20} color="#0284c7" style={styles.inputIcon} />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>Pickup Location</Text>
              <Text style={styles.readOnlyInput}>{pickupText}</Text>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="pin" size={20} color="#ef4444" style={styles.inputIcon} />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>Destination</Text>
              <Text style={styles.readOnlyInput}>{destinationText || "Tap the map to choose a destination"}</Text>
            </View>
          </View>

          <Text style={styles.mapHintText}>
            {isCalculatingRoute
              ? "Calculating route and fare..."
              : routeError
                ? routeError
                : destination
                  ? `Route distance: ${distance.toFixed(2)} km`
                  : "Tap anywhere on the map to set your destination."}
          </Text>

          <View style={styles.farePreview}>
            <Text style={styles.farePreviewLabel}>Estimated Fare</Text>
            <Text style={styles.farePreviewAmount}>
              {distance > 0 && !routeError ? `₱${estimatedFare.toFixed(2)}` : "—"}
            </Text>
            <Text style={styles.farePreviewNote}>₱50 base fare + ₱25 per calculated kilometer</Text>
          </View>

          <TouchableOpacity
            style={styles.confirmBookButton}
            onPress={handleConfirmBooking}
            activeOpacity={0.8}
            disabled={isCalculatingRoute || !!routeError || distance <= 0 || isSubmittingBooking}
          >
            <Text style={styles.confirmBookText}>Review and Confirm Booking</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Default Bottom Bar */}
      {!activeBooking && !isServiceModalOpen && !isFormOpen && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity 
            style={styles.serviceRow} 
            activeOpacity={0.7}
            onPress={() => setIsServiceModalOpen(true)}
          >
            <Text style={styles.serviceText}>🛵 Choose Service ›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => setIsServiceModalOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.bookText}>Book a Ride</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Live booking status and registered driver information */}
      {activeBooking && activeBooking.status !== "Drop Off / Complete" && (
        <View style={styles.riderCardContainer}>
          <Text style={styles.riderStatusHeader}>
            {activeBooking.status === "Waiting for driver"
              ? "Finding your rider..."
              : activeBooking.status === "Proceed to Pick Up"
                ? "Your rider is on the way"
                : activeBooking.status === "Arrived at Pick Up"
                  ? "Your rider has arrived"
                  : "Passenger picked up"}
          </Text>

          <View style={styles.fareRow}>
            <View>
              <Text style={styles.smallLabel}>Pickup</Text>
              <Text style={styles.bookingValue}>{activeBooking.pickup}</Text>
            </View>
            <Text style={styles.bookingFare}>{activeBooking.fare}</Text>
          </View>
          <View style={styles.bookingDestination}>
            <Text style={styles.smallLabel}>Destination</Text>
            <Text style={styles.bookingValue}>{activeBooking.destination}</Text>
            <Text style={styles.distanceText}>{activeBooking.distance}</Text>
          </View>

          {activeBooking.status !== "Waiting for driver" && (
            <View style={styles.riderInfoRow}>
              <View style={styles.riderAvatar}>
                <Ionicons name="person" size={28} color="#0284c7" />
              </View>
              <View style={styles.riderDetails}>
                <Text style={styles.riderName}>
                  {activeBooking.driverDetails?.name || "Loading driver details..."}
                </Text>
                <Text style={styles.riderSubtext}>
                  {activeBooking.driverDetails?.vehicleType || "Vehicle details loading"}
                  {" • "}
                  {activeBooking.driverDetails?.plateNumber || "Plate not provided"}
                </Text>
                <View style={styles.ratingRow}>
                  {Array.from({ length: 5 }, (_, index) => (
                    <Ionicons
                      key={index}
                      name={activeBooking.driverDetails?.averageRating >= index + 1 ? "star" : "star-outline"}
                      size={14}
                      color="#f59e0b"
                    />
                  ))}
                  <Text style={styles.riderRating}>
                    {activeBooking.driverDetails?.ratingCount
                      ? `${activeBooking.driverDetails.averageRating.toFixed(1)} (${activeBooking.driverDetails.ratingCount})`
                      : "No ratings yet"}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {activeBooking.status === "Waiting for driver" && (
            <TouchableOpacity
              style={styles.cancelRideButton}
              onPress={handleCancelBooking}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelRideText}>Cancel Request</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {activeBooking?.status === "Drop Off / Complete" && activeBooking.passengerRating && (
        <View style={styles.riderCardContainer}>
          <Text style={styles.riderStatusHeader}>Ride completed</Text>
          <Text style={styles.bookingValue}>You rated your rider {activeBooking.passengerRating} out of 5.</Text>
          <TouchableOpacity style={styles.cancelRideButton} onPress={handleCancelBooking}>
            <Text style={styles.cancelRideText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={isRatingModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.ratingModalOverlay}>
          <View style={styles.ratingModalCard}>
            <Ionicons name="checkmark-circle" size={42} color="#10b981" />
            <Text style={styles.ratingModalTitle}>Ride Completed!</Text>
            <Text style={styles.ratingModalText}>How was your rider?</Text>
            <View style={styles.ratingStars}>
              {Array.from({ length: 5 }, (_, index) => (
                <TouchableOpacity key={index} onPress={() => setSelectedRating(index + 1)}>
                  <Ionicons
                    name={selectedRating >= index + 1 ? "star" : "star-outline"}
                    size={34}
                    color="#f59e0b"
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingModalText}>
              {selectedRating ? `${selectedRating} out of 5 stars` : "Tap a star to rate your rider"}
            </Text>
            <TouchableOpacity
              style={[styles.confirmBookButton, selectedRating === 0 && styles.disabledButton]}
              onPress={handleSubmitRating}
              disabled={selectedRating === 0 || isSubmittingRating}
            >
              <Text style={styles.confirmBookText}>
                {isSubmittingRating ? "Saving..." : "Submit Rating"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginTop: 20 },
  loadingSubtext: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8, marginBottom: 30 },
  cancelButton: { backgroundColor: '#fee2e2', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 25 },
  cancelButtonText: { color: '#ef4444', fontSize: 15, fontWeight: 'bold' },
  riderMarker: { backgroundColor: '#10b981', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#ffffff' },
  riderCardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    elevation: 15,
  },
  riderStatusHeader: { fontSize: 18, fontWeight: 'bold', color: '#10b981', marginBottom: 12 },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  smallLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  bookingValue: { color: '#0f172a', fontSize: 13, fontWeight: '600', marginTop: 3 },
  bookingFare: { color: '#0284c7', fontSize: 20, fontWeight: 'bold' },
  bookingDestination: { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, marginBottom: 10 },
  distanceText: { fontSize: 11, color: '#64748b', marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
  locationTextContainer: { flex: 1 },
  locationLabel: { fontSize: 11, color: '#64748b', marginBottom: 2 },
  farePreview: { backgroundColor: '#f0f9ff', borderRadius: 12, padding: 14, marginBottom: 14 },
  farePreviewLabel: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  farePreviewAmount: { color: '#0284c7', fontSize: 24, fontWeight: 'bold', marginTop: 3 },
  farePreviewNote: { color: '#64748b', fontSize: 10, marginTop: 3 },
  ratingModalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  ratingModalCard: { width: '100%', maxWidth: 340, backgroundColor: '#ffffff', borderRadius: 20, padding: 24, alignItems: 'center', gap: 12 },
  ratingModalTitle: { color: '#0f172a', fontSize: 21, fontWeight: 'bold' },
  ratingModalText: { color: '#64748b', fontSize: 13, textAlign: 'center' },
  ratingStars: { flexDirection: 'row', gap: 10, marginVertical: 8 },
  disabledButton: { opacity: 0.45 },
  riderInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  riderAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#e0f2fe', justifyContent: 'center', alignItems: 'center' },
  riderDetails: { flex: 1, marginLeft: 14 },
  riderName: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  riderSubtext: { fontSize: 13, color: '#64748b', marginTop: 2 },
  riderRating: { fontSize: 12, fontWeight: 'bold', color: '#f59e0b', marginTop: 2 },
  callButton: { backgroundColor: '#10b981', padding: 12, borderRadius: 25 },
  cancelRideButton: { backgroundColor: '#f1f5f9', paddingVertical: 14, borderRadius: 25, alignItems: 'center' },
  cancelRideText: { color: '#ef4444', fontSize: 15, fontWeight: 'bold' },
  menuButton: { position: 'absolute', top: 60, left: 20, backgroundColor: '#ffffff', padding: 10, borderRadius: 25, elevation: 5, zIndex: 10 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.4)', zIndex: 15 },
  drawer: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 300, backgroundColor: '#ffffff', zIndex: 20, elevation: 20 },
  profileHeader: { backgroundColor: '#e0f2fe', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 24 },
  avatarContainer: { width: 75, height: 75, borderRadius: 37.5, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  profileNameRow: { flexDirection: 'row', alignItems: 'center' },
  profileName: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  profileEmail: { fontSize: 12, color: '#475569', marginTop: 3 },
  drawerContent: { flex: 1, paddingTop: 10, paddingHorizontal: 16 },
  drawerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8 },
  drawerItemText: { fontSize: 16, fontWeight: '500', color: '#0f172a', marginLeft: 16 },
  drawerLogoutBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 24, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  drawerLogoutText: { fontSize: 16, fontWeight: 'bold', color: '#ef4444', marginLeft: 16 },
  bottomContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40, elevation: 10 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  serviceText: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  bookButton: { backgroundColor: '#e2e8f0', paddingVertical: 16, borderRadius: 30, alignItems: 'center' },
  bookText: { color: '#64748b', fontSize: 16, fontWeight: 'bold' },
  expandedContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40, elevation: 15, zIndex: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  sectionLabel: { fontSize: 14, color: '#64748b', marginBottom: 16, fontWeight: '600' },
  serviceCard: { width: 140, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 16, padding: 16, alignItems: 'center' },
  serviceIconContainer: { marginBottom: 10 },
  serviceCardText: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12 },
  inputIcon: { marginRight: 10 },
  readOnlyInput: { fontSize: 15, color: '#334155', fontWeight: '500' },
  textInput: { flex: 1, fontSize: 15, color: '#0f172a' },
  mapHintText: { fontSize: 12, color: '#64748b', marginBottom: 16, fontStyle: 'italic' },
  confirmBookButton: { backgroundColor: '#0284c7', paddingVertical: 16, borderRadius: 30, alignItems: 'center' },
  confirmBookText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});