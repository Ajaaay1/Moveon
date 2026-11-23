import React, { useContext } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../screens/AuthContext";

export default function TabLayout() {
  const { currentUser } = useContext(AuthContext);
  const isDriver = currentUser?.role === "driver";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0284c7",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: { backgroundColor: "#ffffff", borderTopColor: "#e2e8f0" },
      }}
    >
      {isDriver ? (
        <>
          <Tabs.Screen
            name="driverHome"
            options={{
              title: "Home",
              tabBarIcon: ({ color, size }) => <Ionicons name="car-sport-outline" size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="rideHistory"
            options={{
              title: "Ride History",
              tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} />,
            }}
          />
        </>
      ) : (
        <Tabs.Screen
          name="passengerHome"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />,
          }}
        />
      )}
      <Tabs.Screen name="driverHome" options={{ href: isDriver ? undefined : null }} />
      <Tabs.Screen name="rideHistory" options={{ href: isDriver ? undefined : null }} />
      <Tabs.Screen name="passengerHome" options={{ href: isDriver ? null : undefined }} />

      <Tabs.Screen
        name="details"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
