import React, { useEffect, useRef } from "react";
import { Animated, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Logo from "./logo";

const MENU_ITEMS = [
  { label: "History", icon: "document-text-outline", route: "/historyPassenger" },
  { label: "Saved Places", icon: "bookmark-outline", route: "/savedplacesPassenger" },
  { label: "Inbox", icon: "mail-outline", route: "/inboxPassenger" },
  { label: "Payment Methods", icon: "card-outline", route: "/paymentPassenger" },
  { label: "Help & Support", icon: "help-circle-outline", route: "/supportPassenger" },
  { label: "Settings & Profile", icon: "settings-outline", route: "/(tabs)/details" },
];

export default function PassengerDrawer({ isOpen, onClose, currentUser, activeBooking, onNavigate, onLogout, theme }) {
  const slideAnim = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    Animated.timing(slideAnim, { toValue: isOpen ? 0 : -300, duration: 280, useNativeDriver: true }).start();
  }, [isOpen, slideAnim]);

  const navigate = (route) => {
    onClose();
    onNavigate(route);
  };

  return (
    <>
      {isOpen && <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />}
      <Animated.View style={[styles.drawer, { backgroundColor: theme.surface, transform: [{ translateX: slideAnim }] }]}>
        <View style={[styles.profileHeader, { backgroundColor: theme.surfaceMuted }]}>
          <View style={styles.avatarContainer}>
            {currentUser?.avatar_url
              ? <Image source={{ uri: currentUser.avatar_url }} style={styles.avatarImage} />
              : <Logo size={55} />}
          </View>
          <TouchableOpacity style={styles.profileNameRow} activeOpacity={0.7} onPress={() => navigate("/(tabs)/details")}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, { color: theme.text }]}>{currentUser?.full_name || currentUser?.email || "Passenger"}</Text>
              {!!currentUser?.email && <Text style={styles.profileMeta}>{currentUser.email}</Text>}
              {!!currentUser?.phone && <Text style={styles.profileMeta}>{currentUser.phone}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.text} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.drawerContent} showsVerticalScrollIndicator={false}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity key={item.route} style={styles.drawerItem} activeOpacity={0.7} onPress={() => navigate(item.route)}>
              <Ionicons name={item.icon} size={22} color={theme.text} />
              <Text style={[styles.drawerItemText, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {!activeBooking && (
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={22} color="#ef4444" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 15 },
  drawer: { position: "absolute", top: 0, bottom: 0, left: 0, width: 300, zIndex: 20, elevation: 20 },
  profileHeader: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 24 },
  avatarContainer: { width: 75, height: 75, borderRadius: 38, backgroundColor: "#ffffff", justifyContent: "center", alignItems: "center", marginBottom: 14 },
  avatarImage: { width: 55, height: 55, borderRadius: 28 },
  profileNameRow: { flexDirection: "row", alignItems: "center" },
  profileName: { fontSize: 18, fontWeight: "bold" },
  profileMeta: { fontSize: 12, color: "#64748b", marginTop: 3 },
  drawerContent: { flex: 1, paddingTop: 10, paddingHorizontal: 16 },
  drawerItem: { flexDirection: "row", alignItems: "center", paddingVertical: 16, paddingHorizontal: 8 },
  drawerItemText: { fontSize: 16, fontWeight: "500", marginLeft: 16 },
  logoutButton: { flexDirection: "row", alignItems: "center", paddingVertical: 18, paddingHorizontal: 24, borderTopWidth: 1, borderTopColor: "#e2e8f0" },
  logoutText: { fontSize: 16, fontWeight: "bold", color: "#ef4444", marginLeft: 16 },
});
