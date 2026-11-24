import React, { useState, useEffect, useContext } from "react";
import { 
  StyleSheet, 
  Text,
  TouchableOpacity, 
  View, 
  Alert, 
  BackHandler,
  Modal
} from "react-native";
import { useRouter } from "expo-router";
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { AuthContext } from "./AuthContext";
import PassengerDrawer from "../components/PassengerDrawer";
import RatingModal from "../components/ratingModal";
import BookingBottomSheet from "../components/BookingBottomSheet";

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
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Distance & Route Coordinates States
  const [distance, setDistance] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  // UI States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  

  useEffect(() => {
    const backAction = () => {
    if (isFormOpen) {
      setIsFormOpen(false);
      return true;
    }
    if (isServiceModalOpen) {
      setIsServiceModalOpen(false);
      return true;
    }
    if (isDrawerOpen) {
      setIsDrawerOpen(false);
      return true;
    }
    if (activeBooking) {
      return true;
    }

    Alert.alert("Exit Moveon", "Are you sure you want to exit?", [
      { text: "Cancel", style: "cancel" },
      { text: "Exit", onPress: () => BackHandler.exitApp() },
    ]);
    return true;
  };

  const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [isDrawerOpen, isServiceModalOpen, isFormOpen, activeBooking]);

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

    useEffect(() => {
    setIsRatingModalOpen(
      Boolean(activeBooking?.status === "Drop Off / Complete" && !activeBooking.passengerRating)
    );
  }, [activeBooking?.id, activeBooking?.status, activeBooking?.passengerRating]);

  
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
      setIsDrawerOpen(false);
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

 const resetRouteState = () => {
    setDestination(null);
    setDestinationText("");
    setDistance(0);
    setRouteCoordinates([]);
  };

  const handleCancelBooking = async () => {
    const result = await clearBooking();
    if (!result?.success) {
      Alert.alert("Unable to Cancel", result?.message || "Please try again.");
      return;
    }
    resetRouteState();
  };


  const handleSubmitRating = async (rating) => {
  if (!activeBooking?.id || rating < 1) return { success: false };
  setIsSubmittingRating(true);
  const result = await submitRiderRating(activeBooking.id, rating);
  setIsSubmittingRating(false);

  if (!result?.success) {
    return { success: false, message: result?.message };
  }

  setIsRatingModalOpen(false);
  // Clear the completed booking and reset map pins immediately after rating
  await clearBooking();
  resetRouteState();
  return { success: true };
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

      {/* Keep passenger drawer available during an active booking. */}
      {!isRatingModalOpen && (
        <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setIsDrawerOpen(true)}
        activeOpacity={0.8}
        accessibilityLabel="Open passenger menu"
      >
        <Ionicons name="menu" size={24} color="#000" />
      </TouchableOpacity>
      )}


      
      <PassengerDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentUser={currentUser}
        activeBooking={activeBooking}
        onNavigate={(route) => router.push(route)}
        onLogout={handleLogout}
      />

      {/* Service Selection Sheet */}
      {!activeBooking && (
        <BookingBottomSheet
          isServiceOpen={isServiceModalOpen}
          isFormOpen={isFormOpen}
          selectedService={selectedService}
          pickupText={pickupText}
          destinationText={destinationText}
          distance={distance}
          estimatedFare={estimatedFare}
          isCalculatingRoute={isCalculatingRoute}
          routeError={routeError}
          isSubmitting={isSubmittingBooking}
          onOpenService={() => setIsServiceModalOpen(true)}
          onCloseService={() => setIsServiceModalOpen(false)}
          onSelectService={handleSelectService}
          onCloseForm={() => setIsFormOpen(false)}
          onConfirmBooking={handleConfirmBooking}
        />
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
          {activeBooking.status === "Arrived at Pick Up" && (
            <Text style={styles.bookingHelpText}>
              Your driver is waiting at the pickup point. Meet your driver; the destination route will appear after the driver confirms pickup.
            </Text>
          )}

          <View style={styles.fareRow}>
            <View style={styles.pickupInfo}>
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
                {!!activeBooking.driverDetails?.phone && (
                  <Text style={styles.riderSubtext}>Contact: {activeBooking.driverDetails.phone}</Text>
                )}
                <View style={styles.ratingRow}>
                  {Array.from({ length: 5 }, (_, index) => (
                    <Ionicons
                      key={index}
                      name={Math.round(activeBooking.driverDetails?.averageRating || 0) >= index + 1 ? "star" : "star-outline"}
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

      <RatingModal
        visible={isRatingModalOpen}
        isSubmitting={isSubmittingRating}
        onSubmit={handleSubmitRating}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
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
  bookingHelpText: { color: '#64748b', fontSize: 12, lineHeight: 17, marginBottom: 10 },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  pickupInfo: { flex: 1, paddingRight: 12 },
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
  riderInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  riderAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#e0f2fe', justifyContent: 'center', alignItems: 'center' },
  riderDetails: { flex: 1, marginLeft: 14 },
  riderName: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  riderSubtext: { fontSize: 13, color: '#64748b', marginTop: 2 },
  riderRating: { fontSize: 12, fontWeight: 'bold', color: '#f59e0b', marginTop: 2 },
  cancelRideButton: { backgroundColor: '#f1f5f9', paddingVertical: 14, borderRadius: 25, alignItems: 'center' },
  cancelRideText: { color: '#ef4444', fontSize: 15, fontWeight: 'bold' },
  menuButton: { position: 'absolute', top: 60, left: 20, backgroundColor: '#ffffff', padding: 10, borderRadius: 25, elevation: 5, zIndex: 10 },
});