import React, { createContext, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // MAG START SA SYA AS AN EMPTY ARRAY so no accounts exist by default
  const [users, setUsers] = useState([]);

  // CHECK kung email or contact info is already taken
  const registerUser = (newUser) => {
    const exists = users.some(
      (u) => 
        u.email.toLowerCase() === newUser.email.toLowerCase() || 
        (newUser.contactInfo && u.contactInfo === newUser.contactInfo)
    );

    if (exists) {
      return { success: false, message: "An account with this email or phone already exists!" };
    }

    // Save the new user to the global array
    setUsers((prevUsers) => [...prevUsers, newUser]);
    return { success: true };
  };

  const loginUser = (identifier, password, role) => {
    console.log("Current registered users in memory:", users); 
    console.log("Attempting login with:", { identifier, role }); 

    const foundUser = users.find(
      (u) =>
        (u.email.toLowerCase() === identifier.toLowerCase() || u.contactInfo === identifier) &&
        u.password === password &&
        u.role === role
    );

    if (foundUser) {
      console.log("User matched! Logging in...", foundUser);
      return { success: true, user: foundUser };
    }

    console.log("No matching user found. Blocking login.");
    return { 
      success: false, 
      message: "Access Denied: No registered account found with these credentials. Please register first." 
    };
  };

  // --- RESET PASSWORD FUNCTION WITH CONSOLE LOGS ---
  const resetPassword = (email, newPassword) => {
    console.log("Attempting password reset for email:", email);
    console.log("Current registered users before reset:", users);

    const userIndex = users.findIndex(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (userIndex === -1) {
      console.log("Password reset failed: No account found with email:", email);
      return { success: false, message: "No registered account found with this email address." };
    }

    // Update the password for that specific user in the array
    const updatedUsers = [...users];
    updatedUsers[userIndex].password = newPassword;
    setUsers(updatedUsers);

    console.log("Password successfully updated for user:", updatedUsers[userIndex]);
    console.log("Updated users list in memory:", updatedUsers);

    return { success: true, message: "Password updated successfully!" };
  };

  return (
    <AuthContext.Provider value={{ users, registerUser, loginUser, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};