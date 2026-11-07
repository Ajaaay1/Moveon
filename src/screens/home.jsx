import React, { useState, useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Alert, Animated, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import MapView from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Logo from "../components/logo";

export default function HomeScreen() {
  const router = useRouter();
  const [initialRegion, setInitialRegion] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const slideAnim = useState(new Animated.Value(-300))[0];

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied.');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setInitialRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

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

  return (
    <View style={styles.container}>
      {/* 1. Map View */}
      <MapView 
        style={styles.map}
        showsUserLocation={true}
        showsMyLocationButton={true}
        initialRegion={initialRegion}
      />

      <TouchableOpacity style={styles.menuButton} onPress={toggleDrawer} activeOpacity={0.8}>
        <Ionicons name="menu" size={24} color="#000" />
      </TouchableOpacity>

      {/* 3. Dark Overlay when drawer or modal is open */}
      {(isDrawerOpen || isServiceModalOpen) && (
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={() => {
            if (isDrawerOpen) toggleDrawer();
            if (isServiceModalOpen) setIsServiceModalOpen(false);
          }} 
        />
      )}

      {/* 4. Sliding Side Panel */}
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

          <TouchableOpacity style={styles.drawerItem} activeOpacity={0.7}>
            <Ionicons name="card-outline" size={22} color="#0f172a" />
            <Text style={styles.drawerItemText}>Payment Methods</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.drawerItem} activeOpacity={0.7}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name="notifications-outline" size={22} color="#0f172a" />
              <Text style={styles.drawerItemText}>Inbox</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>46</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.drawerItem} activeOpacity={0.7}>
            <Ionicons name="headset-outline" size={22} color="#0f172a" />
            <Text style={styles.drawerItemText}>Support</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.drawerLogoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text style={styles.drawerLogoutText}>Log Out</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* 5. Expanded Service Modal / Bottom Sheet */}
      {isServiceModalOpen ? (
        <View style={styles.expandedContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Hi! Naka move-on kana ba?</Text>
            <TouchableOpacity onPress={() => setIsServiceModalOpen(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Select a service type</Text>

          <TouchableOpacity style={styles.serviceCard} activeOpacity={0.8}>
            <View style={styles.serviceIconContainer}>
              <Logo size={40} />
            </View>
            <Text style={styles.serviceCardText}>Motorcycle</Text>
          </TouchableOpacity>
        </View>
      ) : (
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  menuButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 15,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 300,
    backgroundColor: '#ffffff',
    zIndex: 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  profileHeader: {
    backgroundColor: '#e0f2fe',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  avatarContainer: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  drawerContent: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  drawerItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
    marginLeft: 16,
  },
  badge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  drawerLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  drawerLogoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
    marginLeft: 16,
  },
  bottomContainer: {
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 10,
    zIndex: 5,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  bookButton: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  bookText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: 'bold',
  },
  expandedContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 15,
    zIndex: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  sectionLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    fontWeight: '600',
  },
  serviceCard: {
    width: 150,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  serviceIconContainer: {
    marginBottom: 10,
  },
  serviceCardText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
});