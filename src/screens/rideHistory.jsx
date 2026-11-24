import React, { useCallback, useContext, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "./AuthContext";
import { supabase } from "../lib/supabase";

export default function RideHistoryScreen() {
  const router = useRouter();
  const { session, currentUser, isDark, theme } = useContext(AuthContext);
  const styles = createStyles(isDark);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRides = async () => {
    if (!session?.user?.id || currentUser?.role !== "driver") {
      setRides([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("bookings")
      .select("id, passenger_name, pickup, destination, fare, distance, created_at, updated_at, status")
      .eq("driver_id", session.user.id)
      .eq("status", "completed")
      .order("updated_at", { ascending: false });

    if (error) {
      console.warn("Ride history load error:", error.message);
      setRides([]);
    } else {
      setRides(data || []);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadRides();
    }, [session?.user?.id, currentUser?.role])
  );

  const formatDate = (value) => {
    if (!value) return "Date unavailable";
    return new Date(value).toLocaleString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={23} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Ride History</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#0284c7" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={rides.length ? styles.list : styles.emptyList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadRides(); }} />}
        >
          {rides.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="time-outline" size={58} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No completed rides yet</Text>
              <Text style={styles.subtitle}>Your completed passenger trips will appear here.</Text>
            </View>
          ) : rides.map((ride) => (
            <View key={ride.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.passenger}>{ride.passenger_name || "Passenger"}</Text>
                <Text style={styles.fare}>{ride.fare || "—"}</Text>
              </View>
              <View style={styles.routeRow}>
                <Ionicons name="radio-button-on" size={14} color="#0284c7" />
                <Text style={styles.routeText}>{ride.pickup || "Pickup unavailable"}</Text>
              </View>
              <View style={styles.routeRow}>
                <Ionicons name="location" size={14} color="#ef4444" />
                <Text style={styles.routeText}>{ride.destination || "Destination unavailable"}</Text>
              </View>
              <View style={styles.footer}>
                <Text style={styles.meta}>{ride.distance || "Distance unavailable"}</Text>
                <Text style={styles.meta}>{formatDate(ride.updated_at || ride.created_at)}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? "#0b1220" : "#f8fafc" },
  header: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 16, flexDirection: "row", alignItems: "center", backgroundColor: isDark ? "#111c2e" : "#ffffff", borderBottomWidth: 1, borderBottomColor: isDark ? "#2b3a4f" : "#e2e8f0" },
  backButton: { paddingRight: 16, paddingVertical: 4 },
  title: { color: isDark ? "#f8fafc" : "#0f172a", fontSize: 20, fontWeight: "bold" },
  list: { padding: 16, paddingBottom: 30 },
  emptyList: { flexGrow: 1, justifyContent: "center", padding: 24 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  emptyTitle: { color: isDark ? "#f8fafc" : "#0f172a", fontSize: 18, fontWeight: "bold", marginTop: 14 },
  subtitle: { color: isDark ? "#9caec2" : "#64748b", textAlign: "center", marginTop: 7, lineHeight: 20 },
  card: { backgroundColor: isDark ? "#111c2e" : "#ffffff", borderWidth: 1, borderColor: isDark ? "#2b3a4f" : "#e2e8f0", borderRadius: 15, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  passenger: { color: isDark ? "#f8fafc" : "#0f172a", fontSize: 16, fontWeight: "bold", flex: 1 },
  fare: { color: isDark ? "#38bdf8" : "#0284c7", fontSize: 17, fontWeight: "bold" },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 8 },
  routeText: { color: isDark ? "#cbd5e1" : "#334155", fontSize: 13, flex: 1 },
  footer: { borderTopWidth: 1, borderTopColor: isDark ? "#2b3a4f" : "#e2e8f0", marginTop: 14, paddingTop: 10, flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 6 },
  meta: { color: isDark ? "#90a0b5" : "#94a3b8", fontSize: 11 },
});
