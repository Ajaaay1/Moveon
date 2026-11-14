import React, { useState, useEffect, useContext } from "react";
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Alert, 
  Animated, 
  TextInput,
  ActivityIndicator
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
  const { activeBooking, createBooking, clearBooking } = useContext(AuthContext);
  
  // Location States
  const [initialRegion, setInitialRegion] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [destinationText, setDestinationText] = useState("");

  // Distance & Route Coordinates States
  const [distance, setDistance] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  // Rider States (Populated when driver accepts)
  const [riderLocation, setRiderLocation] = useState(null);
  const [riderInfo, setRiderInfo] = useState(null);

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
    })();
  }, []);

  // Fetch Mapbox road-snapped route whenever currentLocation or destination changes
  useEffect(() => {
    const fetchMapboxRoute = async (start, end) => {
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
          
          if (data.routes[0].distance) {
            setDistance(data.routes[0].distance / 1000);
          }
        }
      } catch (error) {
        console.log("Error fetching Mapbox route:", error);
      }
    };

    if (currentLocation && destination) {
      fetchMapboxRoute(currentLocation, destination);
    } else {
      setRouteCoordinates([]);
      setDistance(0);
    }
  }, [currentLocation, destination]);

  // Listen for active booking updates from Driver side
  useEffect(() => {
    if (activeBooking && activeBooking.status !== "Waiting for driver") {
      setRiderInfo({
        name: "Demo Driver",
        plateNumber: "ABC 1234",
        vehicle: "Yamaha NMAX",
        rating: 4.9,
      });
      if (currentLocation) {
        setRiderLocation({
          latitude: currentLocation.latitude + 0.003,
          longitude: currentLocation.longitude + 0.003,
        });
      }
    }
  }, [activeBooking]);

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

  const handleLogout = () => {
    router.replace("/login");
  };

  const handleSelectService = (serviceName) => {
    setSelectedService(serviceName);
    setIsServiceModalOpen(false);
    setIsFormOpen(true);
  };

  const handleMapPress = (e) => {
    if (!activeBooking) {
      if (isDrawerOpen) {
        toggleDrawer();
        return;
      }

      const pinnedCoords = e.nativeEvent.coordinate;
      setDestination(pinnedCoords);
      setDestinationText(`${pinnedCoords.latitude.toFixed(4)}, ${pinnedCoords.longitude.toFixed(4)}`);

      if (!isFormOpen) {
        setIsServiceModalOpen(true);
      }
    }
  };

  const handleConfirmBooking = () => {
    if (!destination) {
      Alert.alert("Destination Required", "Please select a destination by tapping on the map.");
      return;
    }

    setIsFormOpen(false);

    // Calculate dynamic demo fare (Base ₱50 + ₱25 per km)
    const calculatedFare = `₱${(50 + (distance * 25)).toFixed(2)}`;

    // Pushes full booking context to AuthContext so DriverHomeScreen can pick it up
    createBooking({
      passenger: "Aj Sarsonas",
      service: selectedService || "Motorcycle",
      pickupCoords: currentLocation,
      destinationCoords: destination,
      destinationText: destinationText,
      pickup: "Current Location",
      distance: `${distance.toFixed(2)} km`,
      fare: calculatedFare,
    });
  };

  const handleCancelBooking = () => {
    clearBooking();
    setDestination(null);
    setDestinationText("");
    setDistance(0);
    setRouteCoordinates([]);
    setRiderLocation(null);
    setRiderInfo(null);
  };

  // 1. FULL-SCREEN LOADING STATE WHILE WAITING FOR DRIVER TO ACCEPT
  if (activeBooking && activeBooking.status === "Waiting for driver") {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingTitle}>Looking for nearby riders...</Text>
        <Text style={styles.loadingSubtext}>Please wait while a driver accepts your ride request.</Text>

        <TouchableOpacity style={styles.cancelButton} onPress={handleCancelBooking} activeOpacity={0.8}>
          <Text style={styles.cancelButtonText}>Cancel Request</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        {/* Pickup Marker */}
        {currentLocation && (
          <Marker coordinate={currentLocation} title="Pickup Location" pinColor="#0284c7" />
        )}

        {/* Destination Marker */}
        {destination && (
          <Marker coordinate={destination} title="Destination" pinColor="#ef4444" />
        )}

        {/* Rider Location Marker when Driver Accepts */}
        {activeBooking && activeBooking.status !== "Waiting for driver" && riderLocation && (
          <Marker coordinate={riderLocation} title={`Rider: ${riderInfo?.name}`}>
            <View style={styles.riderMarker}>
              <Ionicons name="bicycle" size={24} color="#ffffff" />
            </View>
          </Marker>
        )}

        {/* Mapbox Road-Snapping Polyline Route */}
        {routeCoordinates.length > 0 && !activeBooking && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={4}
            strokeColor="#0284c7"
          />
        )}

        {/* Polyline from Rider to Pickup when Accepted */}
        {activeBooking && activeBooking.status !== "Waiting for driver" && riderLocation && currentLocation && (
          <Polyline
            coordinates={[riderLocation, currentLocation]}
            strokeWidth={4}
            strokeColor="#10b981"
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
            <Text style={styles.profileName}>Aj Sarsonas</Text>
            <Ionicons name="chevron-forward" size={18} color="#0f172a" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        <View style={styles.drawerContent}>
          <TouchableOpacity style={styles.drawerItem} activeOpacity={0.7}>
            <Ionicons name="document-text-outline" size={22} color="#0f172a" />
            <Text style={styles.drawerItemText}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.drawerItem} activeOpacity={0.7}>
            <Ionicons name="bookmark-outline" size={22} color="#0f172a" />
            <Text style={styles.drawerItemText}>Saved Places</Text>
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
            <Text style={styles.readOnlyInput}>Current Location (Pickup)</Text>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="pin" size={20} color="#ef4444" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Tap map or enter destination"
              value={destinationText}
              onChangeText={setDestinationText}
            />
          </View>

          <Text style={styles.mapHintText}>
            {destination 
              ? `Estimated distance: ${distance.toFixed(2)} km (Tap map to adjust pin)` 
              : "💡 Tap anywhere on the map to place your destination pin."}
          </Text>

          <TouchableOpacity 
            style={styles.confirmBookButton} 
            onPress={handleConfirmBooking} 
            activeOpacity={0.8}
          >
            <Text style={styles.confirmBookText}>Confirm Ride Request</Text>
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
            onPress={handleLogout} 
            activeOpacity={0.8}
          >
            <Text style={styles.bookText}>Book / Log Out</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 3. RIDER ACCEPTED BOTTOM CARD */}
      {activeBooking && activeBooking.status !== "Waiting for driver" && riderInfo && (
        <View style={styles.riderCardContainer}>
          <Text style={styles.riderStatusHeader}>Status: {activeBooking.status}</Text>
          <View style={styles.riderInfoRow}>
            <View style={styles.riderAvatar}>
              <Ionicons name="person" size={28} color="#0284c7" />
            </View>
            <View style={styles.riderDetails}>
              <Text style={styles.riderName}>{riderInfo.name}</Text>
              <Text style={styles.riderSubtext}>{riderInfo.vehicle} • {riderInfo.plateNumber}</Text>
              <Text style={styles.riderRating}>★ {riderInfo.rating}</Text>
            </View>
            <TouchableOpacity style={styles.callButton} activeOpacity={0.8}>
              <Ionicons name="call" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.cancelRideButton} 
            onPress={handleCancelBooking} 
            activeOpacity={0.8}
          >
            <Text style={styles.cancelRideText}>Cancel Ride</Text>
          </TouchableOpacity>
        </View>
      )}
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
  riderStatusHeader: { fontSize: 18, fontWeight: 'bold', color: '#10b981', marginBottom: 16 },
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