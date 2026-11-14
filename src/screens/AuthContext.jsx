import React, { createContext, useState } from "react";

export const AuthContext = createContext();

const DEMO_DRIVER = {
  name: "Demo",
  midName: "",
  lastName: "Driver",
  contactInfo: "09170000000",
  email: "12",
  password: "12",
  role: "driver",
};

const DEMO_PASSENGER = {
  name: "Demo",
  midName: "",
  lastName: "Passenger",
  contactInfo: "09171111111",
  email: "123",
  password: "123",
  role: "passenger",
};

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState([DEMO_DRIVER, DEMO_PASSENGER]);
  const [activeBooking, setActiveBooking] = useState(null);

  const registerUser = (newUser) => {
    const exists = users.some(
      (u) =>
        u.email.toLowerCase() === newUser.email.toLowerCase() ||
        (newUser.contactInfo && u.contactInfo === newUser.contactInfo)
    );

    if (exists) {
      return {
        success: false,
        message: "An account with this email or phone already exists!",
      };
    }

    setUsers((prevUsers) => [...prevUsers, newUser]);
    return { success: true };
  };

  const loginUser = (identifier, password, role) => {
    const normalizedIdentifier = identifier.trim().toLowerCase();

    const foundUser = users.find(
      (u) =>
        (u.email.toLowerCase() === normalizedIdentifier ||
          u.contactInfo === identifier.trim()) &&
        u.password === password &&
        u.role === role
    );

    if (foundUser) {
      return { success: true, user: foundUser };
    }

    return {
      success: false,
      message:
        "Access Denied: No registered account found with these credentials. Please register first.",
    };
  };

  // UPDATED: Standardizes pickupCoords, destinationCoords, and fallback defaults
  const createBooking = (booking) => {
    setActiveBooking({
      passenger: booking.passenger || "Aj Sarsonas",
      pickup: booking.pickup || "Current Location",
      destination: booking.destinationText || booking.destination || "Selected Destination",
      pickupCoords: booking.pickupCoords || null,
      destinationCoords: booking.destinationCoords || null,
      fare: booking.fare || "₱120.00",
      distance: booking.distance || "3.5 km",
      status: "Waiting for driver",
    });
  };

  const updateBookingStatus = (status) => {
    if (activeBooking) {
      setActiveBooking({ ...activeBooking, status });
    }
  };

  const clearBooking = () => {
    setActiveBooking(null);
  };

  const resetPassword = (email, newPassword) => {
    const userIndex = users.findIndex(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (userIndex === -1) {
      return {
        success: false,
        message: "No registered account found with this email address.",
      };
    }

    const updatedUsers = [...users];
    updatedUsers[userIndex] = {
      ...updatedUsers[userIndex],
      password: newPassword,
    };
    setUsers(updatedUsers);

    return { success: true, message: "Password updated successfully!" };
  };

  return (
    <AuthContext.Provider
      value={{
        users,
        registerUser,
        loginUser,
        resetPassword,
        activeBooking,
        createBooking,
        updateBookingStatus,
        clearBooking,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};