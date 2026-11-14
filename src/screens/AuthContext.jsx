import React, { createContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeBooking, setActiveBooking] = useState(null);

  const loadProfile = async (user) => {
    if (!user) {
      setCurrentUser(null);
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) throw error;
    const account = { ...data, email: user.email };
    setCurrentUser(account);
    return account;
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data, error }) => {
      if (error) console.warn("Session error:", error.message);
      if (mounted) {
        setSession(data?.session || null);
        if (data?.session?.user) {
          try {
            await loadProfile(data.session.user);
          } catch (profileError) {
            console.warn("Profile load error:", profileError.message);
          }
        }
        setAuthLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!mounted) return;
        setSession(nextSession);
        if (!nextSession) setCurrentUser(null);
        else {
          // Defer the profile request until after the auth callback.
          Promise.resolve().then(() => loadProfile(nextSession.user)).catch(
            (error) => console.warn("Profile load error:", error.message)
          );
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const registerUser = async (newUser) => {
    const fullName = newUser.fullName ||
      [newUser.name, newUser.midName, newUser.lastName].filter(Boolean).join(" ");

    const metadata = {
      full_name: fullName,
      phone: newUser.contactInfo || null,
      role: newUser.role,
      license_id: newUser.licenseId || null,
      plate_number: newUser.plateNumber || null,
    };

    const { data, error } = await supabase.auth.signUp({
      email: newUser.email.trim().toLowerCase(),
      password: newUser.password,
      options: { data: metadata },
    });

    if (error) return { success: false, message: error.message };

    if (!data.session) {
      return {
        success: false,
        message: "Account created. Please confirm your email, then log in. For driver registration, disable email confirmation during initial testing so the license details can be uploaded immediately.",
      };
    }

    if (newUser.role === "driver") {
      let licenseImagePath = null;

      if (newUser.licenseImageUri) {
        const response = await fetch(newUser.licenseImageUri);
        const fileBlob = await response.blob();
        const extension = newUser.licenseImageUri.split(".").pop()?.split("?")[0] || "jpg";
        const filePath = `${data.user.id}/license-${Date.now()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("driver-licenses")
          .upload(filePath, fileBlob, {
            contentType: fileBlob.type || "image/jpeg",
            upsert: false,
          });

        if (uploadError) return { success: false, message: uploadError.message };
        licenseImagePath = filePath;
      }

      const { error: driverError } = await supabase
        .from("driver_profiles")
        .insert({
          user_id: data.user.id,
          license_id: newUser.licenseId || null,
          license_image_path: licenseImagePath,
          plate_number: newUser.plateNumber.trim().toUpperCase(),
          verification_status: "pending",
        });

      if (driverError) return { success: false, message: driverError.message };
    }

    await loadProfile(data.user);
    return { success: true, user: data.user };
  };

  const loginUser = async (identifier, password, role) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: identifier.trim().toLowerCase(),
      password,
    });

    if (error) return { success: false, message: error.message };

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      await supabase.auth.signOut();
      return { success: false, message: profileError.message };
    }

    if (profile.role !== role) {
      await supabase.auth.signOut();
      return {
        success: false,
        message: role === "driver"
          ? "This account is not registered as a driver."
          : "This account is not registered as a passenger.",
      };
    }

    if (role === "driver") {
      const { data: driver, error: driverError } = await supabase
        .from("driver_profiles")
        .select("verification_status")
        .eq("user_id", data.user.id)
        .single();

      if (driverError) {
        await supabase.auth.signOut();
        return { success: false, message: "Driver profile was not found." };
      }

      if (driver.verification_status !== "approved") {
        await supabase.auth.signOut();
        return {
          success: false,
          message: driver.verification_status === "rejected"
            ? "Your driver application was rejected. Please contact Moveon support."
            : "Your driver account is pending verification. You cannot access driver features yet.",
        };
      }
    }

    const user = { ...profile, email: data.user.email };
    setCurrentUser(user);
    return { success: true, user };
  };

  const logoutUser = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) return { success: false, message: error.message };
    setCurrentUser(null);
    return { success: true };
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    return error
      ? { success: false, message: error.message }
      : { success: true, message: "Password reset email sent." };
  };

  const createBooking = (booking) => {
    setActiveBooking({
      passenger: booking.passenger || currentUser?.full_name || "Passenger",
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
    if (activeBooking) setActiveBooking({ ...activeBooking, status });
  };

  const clearBooking = () => setActiveBooking(null);

  return (
    <AuthContext.Provider value={{
      session,
      currentUser,
      authLoading,
      registerUser,
      loginUser,
      logoutUser,
      resetPassword,
      activeBooking,
      createBooking,
      updateBookingStatus,
      clearBooking,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
