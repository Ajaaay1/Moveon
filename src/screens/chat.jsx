import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "./AuthContext";
import { supabase } from "../lib/supabase";

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingId = Array.isArray(params.bookingId) ? params.bookingId[0] : params.bookingId;
  const { session, currentUser, theme } = useContext(AuthContext);

  const [booking, setBooking] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadMessages = useCallback(async () => {
    if (!bookingId || !session?.user?.id) {
      setLoading(false);
      return;
    }

    const { data: bookingRow, error: bookingError } = await supabase
      .from("bookings")
      .select("id, passenger_id, driver_id, passenger_name, driver_name, status")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError || !bookingRow) {
      setErrorMessage(bookingError?.message || "This booking is not available to your account.");
      setBooking(null);
      setLoading(false);
      return;
    }

    const isParticipant = bookingRow.passenger_id === session.user.id || bookingRow.driver_id === session.user.id;
    if (!isParticipant) {
      setErrorMessage("Only the passenger and assigned driver can open this conversation.");
      setBooking(null);
      setLoading(false);
      return;
    }

    setBooking(bookingRow);
    const { data, error } = await supabase
      .from("booking_messages")
      .select("id, booking_id, sender_id, body, created_at")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true });

    if (error) {
      setErrorMessage("Chat is not configured. Run supabase/moveon_messaging.sql in your Supabase SQL Editor.");
    } else {
      setErrorMessage("");
      setMessages(data || []);
    }
    setLoading(false);
  }, [bookingId, session?.user?.id]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!bookingId) return;

    const channel = supabase
      .channel("moveon-chat-" + bookingId)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "booking_messages",
        filter: "booking_id=eq." + bookingId,
      }, loadMessages)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, loadMessages]);

  const sendMessage = async () => {
    const body = messageText.trim();
    if (!body || sending) return;

    if (!booking || !session?.user?.id) {
      Alert.alert("Chat unavailable", "A passenger and driver must be assigned to this booking first.");
      return;
    }

    setSending(true);
    const { error } = await supabase.from("booking_messages").insert({
      booking_id: bookingId,
      sender_id: session.user.id,
      body,
    });
    setSending(false);

    if (error) {
      Alert.alert("Message Not Sent", error.message.includes("booking_messages")
        ? "Run the Moveon messaging SQL setup first."
        : error.message);
      return;
    }

    setMessageText("");
    loadMessages();
  };

  const otherName = currentUser?.role === "driver"
    ? booking?.passenger_name || "Passenger"
    : booking?.driver_name || "Driver";

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: theme.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={23} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{otherName}</Text>
          <Text style={[styles.headerSubtitle, { color: theme.muted }]}>Moveon ride chat</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : errorMessage ? (
        <View style={styles.center}>
          <Ionicons name="chatbubbles-outline" size={38} color={theme.muted} />
          <Text style={[styles.errorText, { color: theme.text }]}>{errorMessage}</Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.messageList}>
            <Text style={[styles.notice, { color: theme.muted }]}>Only the passenger and assigned driver can read this conversation.</Text>
            {messages.map((message) => {
              const mine = message.sender_id === session?.user?.id;
              return (
                <View key={message.id} style={[styles.messageRow, mine ? styles.myMessageRow : styles.theirMessageRow]}>
                  <View style={[styles.bubble, { backgroundColor: mine ? theme.accent : theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.messageBody, { color: mine ? "#ffffff" : theme.text }]}>{message.body}</Text>
                    <Text style={[styles.time, { color: mine ? "#e0f2fe" : theme.muted }]}>{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
          <View style={[styles.composer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <TextInput
              style={[styles.composerInput, { color: theme.text, backgroundColor: theme.input, borderColor: theme.border }]}
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Write a message..."
              placeholderTextColor={theme.muted}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity style={[styles.sendButton, (!messageText.trim() || sending) && styles.disabled]} onPress={sendMessage} disabled={!messageText.trim() || sending}>
              {sending ? <ActivityIndicator color="#ffffff" /> : <Ionicons name="send" size={18} color="#ffffff" />}
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 54, paddingHorizontal: 16, paddingBottom: 14, flexDirection: "row", alignItems: "center", borderBottomWidth: 1 },
  backButton: { padding: 7, marginRight: 8 },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: "800" },
  headerSubtitle: { fontSize: 11, marginTop: 3 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, gap: 12 },
  errorText: { textAlign: "center", fontSize: 13, lineHeight: 19 },
  messageList: { padding: 16, paddingBottom: 24, flexGrow: 1, justifyContent: "flex-end" },
  notice: { textAlign: "center", fontSize: 11, marginBottom: 16 },
  messageRow: { width: "100%", marginBottom: 10 },
  myMessageRow: { alignItems: "flex-end" },
  theirMessageRow: { alignItems: "flex-start" },
  bubble: { maxWidth: "82%", paddingHorizontal: 13, paddingVertical: 9, borderRadius: 15, borderWidth: 1 },
  messageBody: { fontSize: 14, lineHeight: 19 },
  time: { fontSize: 10, textAlign: "right", marginTop: 5 },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 9, padding: 12, borderTopWidth: 1 },
  composerInput: { flex: 1, minHeight: 44, maxHeight: 110, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#0284c7", alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.5 },
});
