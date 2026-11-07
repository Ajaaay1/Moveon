import React, { createContext, useState } from "react";

export const AuthContext = createContext();

// Demo account for DRIVER testing only.
// Do not use this account or password for a real production system.
const DEMO_DRIVER = {
  name: "Demo",
  midName: "",
  lastName: "Driver",
  contactInfo: "09170000000",
  email: "driver.demo@moveon.test",
  password: "MoveOnDriver123",
  role: "driver",
};

export const AuthProvider = ({ children }) => {
  // The demo driver is available whenever the app starts.
  // Passenger accounts are still created through passenger registration.
  const [users, setUsers] = useState([DEMO_DRIVER]);

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
      value={{ users, registerUser, loginUser, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
};
