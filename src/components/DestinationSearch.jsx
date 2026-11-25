import React from "react";
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function DestinationSearch({ value, onChangeText, onSearch, loading, disabled, theme }) {
  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Ionicons name="search-outline" size={20} color={theme.muted} />
      <TextInput
        style={[styles.input, { color: theme.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder="Search destination or address"
        placeholderTextColor={theme.muted}
        returnKeyType="search"
        onSubmitEditing={onSearch}
        editable={!disabled && !loading}
      />
      <TouchableOpacity onPress={onSearch} disabled={disabled || loading || !value.trim()} style={styles.searchButton}>
        {loading ? <ActivityIndicator color={theme.accent} /> : <Ionicons name="arrow-forward-circle" size={27} color={theme.accent} />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "absolute", top: 52, left: 16, right: 16, zIndex: 12, elevation: 8, flexDirection: "row", alignItems: "center", gap: 9, paddingLeft: 14, paddingRight: 8, paddingVertical: 5, borderRadius: 15, borderWidth: 1 },
  input: { flex: 1, fontSize: 14, paddingVertical: 9 },
  searchButton: { padding: 3 },
});
