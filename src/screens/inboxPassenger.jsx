import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function InboxScreen() {
  const router = useRouter();

  const [notifications, setNotifications] = useState([
    {
      id: "1",
      title: "Welcome to MOB-ON!",
      message: "Thank you for choosing MOB-ON.",
      read: false,
    },
    {
      id: "2",
      title: "Booking Reminder",
      message: "You can book a motorcycle ride anytime.",
      read: false,
    },
    {
      id: "3",
      title: "Safety Reminder",
      message: "Always wear a helmet during your ride.",
      read: false,
    },
  ]);

  const markAsRead = (id) => {
    setNotifications((current) =>
      current.map((item) =>
        item.id === id ? { ...item, read: true } : item
      )
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>Inbox</Text>
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              !item.read && styles.unreadCard,
            ]}
            onPress={() => markAsRead(item.id)}
          >
            <Ionicons
              name="notifications-outline"
              size={25}
              color="#0284c7"
            />

            <View style={styles.messageContainer}>
              <Text style={styles.notificationTitle}>
                {item.title}
              </Text>

              <Text style={styles.message}>
                {item.message}
              </Text>

              <Text style={styles.status}>
                {item.read ? "Read" : "Tap to mark as read"}
              </Text>
            </View>

            {!item.read && <View style={styles.dot} />}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
  },
  list: { padding: 20 },
  card: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    marginBottom: 12,
    gap: 12,
  },
  unreadCard: {
    backgroundColor: "#e0f2fe",
    borderColor: "#bae6fd",
  },
  messageContainer: { flex: 1 },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
  },
  message: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 5,
  },
  status: {
    fontSize: 12,
    color: "#0284c7",
    marginTop: 8,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#0284c7",
    marginTop: 5,
  },
});
