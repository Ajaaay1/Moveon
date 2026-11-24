import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Logo from "./logo";

const MENU_ITEMS = [
  { label: "History", icon: "document-text-outline", route: "/historyPassenger" },
  { label: "Saved Places", icon: "bookmark-outline", route: "/savedplacesPassenger" },
  { label: "Inbox", icon: "mail-outline", route: "/inboxPassenger" },
  { label: "Payment Methods", icon: "card-outline", route: "/paymentPassenger" },
  { label: "Help & Support", icon: "help-circle-outline", route: "/supportPassenger" },
];

export default function PassengerDrawer({
  isOpen,
  onClose,
  currentUser,
  activeBooking,
  onNavigate,
  onLogout,
}) {
  const slideAnim = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -300,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      )}

      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {currentUser?.avatar_url ? (
              <Image source={{ uri: currentUser.avatar_url }} style={styles.profileAvatarImage} />
            ) : (
              <Logo size={55} />
            )}
          </View>

          <TouchableOpacity
            style={styles.profileNameRow}
            activeOpacity={0.7}
            onPress={() => {
              onClose();
              onNavigate("/(tabs)/details");
            }}
          >
            <View>
              <Text style={styles.profileName}>
                {currentUser?.full_name || currentUser?.email || "Passenger"}
              </Text>
              {!!currentUser?.email && <Text style={styles.profileEmail}>{currentUser.email}</Text>}
              {!!currentUser?.phone && <Text style={styles.profileEmail}>{currentUser.phone}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#0f172a" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        <View style={styles.drawerContent}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={styles.drawerItem}
              activeOpacity={0.7}
              onPress={() => {
                onClose();
                onNavigate(item.route);
              }}
            >
              <Ionicons name={item.icon} size={22} color="#0f172a" />
              <Text style={styles.drawerItemText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {!activeBooking && (
          <TouchableOpacity style={styles.drawerLogoutBtn} onPress={onLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={22} color="#ef4444" />
            <Text style={styles.drawerLogoutText}>Log Out</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0, 0, 0, 0.4)", zIndex: 15 },
  drawer: { position: "absolute", top: 0, bottom: 0, left: 0, width: 300, backgroundColor: "#ffffff", zIndex: 20, elevation: 20 },
  profileHeader: { backgroundColor: "#e0f2fe", paddingTop: 60, paddingHorizontal: 20, paddingBottom: 24 },
  profileAvatarImage: { width: 55, height: 55, borderRadius: 28 },
  avatarContainer: { width: 75, height: 75, borderRadius: 37.5, backgroundColor: "#ffffff", justifyContent: "center", alignItems: "center", marginBottom: 14 },
  profileNameRow: { flexDirection: "row", alignItems: "center" },
  profileName: { fontSize: 18, fontWeight: "bold", color: "#0f172a" },
  profileEmail: { fontSize: 12, color: "#475569", marginTop: 3 },
  drawerContent: { flex: 1, paddingTop: 10, paddingHorizontal: 16 },
  drawerItem: { flexDirection: "row", alignItems: "center", paddingVertical: 16, paddingHorizontal: 8 },
  drawerItemText: { fontSize: 16, fontWeight: "500", color: "#0f172a", marginLeft: 16 },
  drawerLogoutBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 18, paddingHorizontal: 24, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  drawerLogoutText: { fontSize: 16, fontWeight: "bold", color: "#ef4444", marginLeft: 16 },
});