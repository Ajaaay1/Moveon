import React, { createContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export const AuthContext = createContext();

const mapBooking = (row) => ({
  ...row,
  passenger: row.passenger_name,
  pickupCoords: row.pickup_coords,
  destinationCoords: row.destination_coords,
  destination: row.destination,
  status: ({
    searching: "Waiting for driver",
    accepted: "Proceed to Pick Up",
    arrived: "Arrived at Pick Up",
    in_progress: "Passenger Picked Up",
    completed: "Drop Off / Complete",
    cancelled: "Cancelled",
  })[row.status] || row.status,
});

const getDriverDetails = async (booking) => {
  if (!booking?.driver_id) return null;

  const { data, error } = await supabase
    .from("rider_ratings")
    .select("rating")
    .eq("driver_id", booking.driver_id);

  if (error) throw error;

  const ratings = (data || [])
    .map((item) => Number(item.rating))
    .filter((value) => value >= 1 && value <= 5);
  const averageRating = ratings.length
    ? ratings.reduce((total, value) => total + value, 0) / ratings.length
    : null;

  return {
    id: booking.driver_id,
    name: booking.driver_name || "Driver",
    phone: booking.driver_phone || "",
    vehicleType: booking.driver_vehicle_type || "Vehicle not specified",
    plateNumber: booking.driver_plate_number || "Plate not provided",
    averageRating,
    ratingCount: ratings.length,
  };
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeBooking, setActiveBooking] = useState(null);
  const [incomingBookings, setIncomingBookings] = useState([]);

  const loadProfile = async (user) => {
    if (!user) {
      setCurrentUser(null);
      return null;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) throw error;

    let driverProfile = null;
    if (profile.role === "driver") {
      const { data, error: driverError } = await supabase
        .from("driver_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (driverError) throw driverError;
      driverProfile = data;
    }

    const account = {
      ...profile,
      name: profile.full_name,
      email: profile.email || user.email || "",
      driverProfile,
    };

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
        if (!nextSession) {
          setCurrentUser(null);
          setActiveBooking(null);
          setIncomingBookings([]);
        } else {
          Promise.resolve()
            .then(() => loadProfile(nextSession.user))
            .catch((error) => console.warn("Profile load error:", error.message));
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || !currentUser?.role) {
      setActiveBooking(null);
      setIncomingBookings([]);
      return;
    }

    let alive = true;

    const refreshBookings = async () => {
      if (currentUser.role === "passenger") {
        const { data, error } = await supabase
          .from("bookings")
          .select("*")
          .eq("passenger_id", userId)
          .in("status", ["searching", "accepted", "arrived", "in_progress", "completed"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.warn("Passenger booking load error:", error.message);
          return;
        }

        if (!data) {
          if (alive) setActiveBooking(null);
          return;
        }

        let driverDetails = null;
        let existingRating = null;
        if (data.driver_id) {
          try {
            driverDetails = await getDriverDetails(data);
          } catch (driverError) {
            console.warn("Driver details load error:", driverError.message);
          }
        }

        if (data.status === "completed") {
          const { data: ratingRow, error: ratingError } = await supabase
            .from("rider_ratings")
            .select("rating")
            .eq("booking_id", data.id)
            .maybeSingle();

          if (ratingError) console.warn("Ride rating lookup error:", ratingError.message);
          existingRating = ratingRow?.rating ?? null;
        }

        if (alive) {
          setActiveBooking({
            ...mapBooking(data),
            driverDetails,
            passengerRating: existingRating,
          });
        }
      } else if (currentUser.role === "driver") {
        const driverIsOnline = currentUser?.driverProfile?.is_online === true;
        if (!driverIsOnline) {
          setIncomingBookings([]);
        }
        const { data: waiting, error: waitingError } = driverIsOnline
          ? await supabase
              .from("bookings")
              .select("*")
              .eq("status", "searching")
              .order("created_at", { ascending: false })
              .limit(10)
          : { data: [], error: null };

        if (waitingError) {
          console.warn("Incoming bookings load error:", waitingError.message);
          return;
        }

        const { data: assigned, error: assignedError } = await supabase
          .from("bookings")
          .select("*")
          .eq("driver_id", userId)
          .in("status", ["accepted", "arrived", "in_progress"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (assignedError) console.warn("Assigned booking load error:", assignedError.message);
        if (alive) {
          setIncomingBookings(driverIsOnline ? (waiting || []).map(mapBooking) : []);
          setActiveBooking(assigned ? mapBooking(assigned) : null);
        }
      }
    };

    refreshBookings();

    const channel = supabase
      .channel("moveon-bookings-" + userId)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "bookings",
      }, refreshBookings)
      .subscribe((status, error) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("Booking realtime error:", error?.message || status);
        }
      });

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, currentUser?.role, currentUser?.driverProfile?.is_online]);

  const registerUser = async (newUser) => {
    const fullName = newUser.fullName ||
      [newUser.name, newUser.midName, newUser.lastName].filter(Boolean).join(" ");
    const email = newUser.email.trim().toLowerCase();

    const metadata = {
      full_name: fullName,
      phone: newUser.contactInfo || null,
      role: newUser.role,
    };

    const { data, error } = await supabase.auth.signUp({
      email,
      password: newUser.password,
      options: { data: metadata },
    });

    if (error) return { success: false, message: error.message };

    if (!data.user || !data.session) {
      return {
        success: false,
        message: "The account was created, but email confirmation is still enabled. Turn off Confirm email in Supabase Authentication settings for prototype registration.",
      };
    }

    if (newUser.role === "driver") {
      const { error: driverError } = await supabase
        .from("driver_profiles")
        .insert({
          user_id: data.user.id,
          license_id: newUser.licenseId || null,
          license_image_path: null,
          plate_number: newUser.plateNumber.trim().toUpperCase(),
          vehicle_type: newUser.vehicleType.trim(),
          verification_status: "pending",
        });

      if (driverError) {
        return { success: false, message: "Account created, but driver details could not be saved: " + driverError.message };
      }
    }

    try {
      const profile = await loadProfile(data.user);
      return { success: true, user: profile };
    } catch (profileError) {
      return {
        success: false,
        message: "Your account was created, but the profile could not be loaded: " + profileError.message,
      };
    }
  };

  const updateProfile = async (changes) => {
    if (!session?.user?.id || !currentUser) {
      return { success: false, message: "Please log in again." };
    }

    const userId = session.user.id;
    const fullName = changes.full_name?.trim();

    if (!fullName) {
      return { success: false, message: "Full name is required." };
    }

    let avatarUrl = currentUser.avatar_url || null;

    if (changes.avatarUri) {
      try {
        const fileResponse = await fetch(changes.avatarUri);
        const imageBlob = await fileResponse.blob();
        const extension = (changes.avatarUri.split(".").pop()?.split("?")[0] || "jpg").toLowerCase();
        const mimeType = extension === "png"
          ? "image/png"
          : extension === "webp"
            ? "image/webp"
            : "image/jpeg";
        const filePath = userId + "/" + Date.now() + "." + (extension === "jpeg" ? "jpg" : extension);

        const { error: uploadError } = await supabase.storage
          .from("profile-avatars")
          .upload(filePath, imageBlob, {
            contentType: mimeType,
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) return { success: false, message: uploadError.message };

        const { data: publicImage } = supabase.storage
          .from("profile-avatars")
          .getPublicUrl(filePath);
        avatarUrl = publicImage.publicUrl;
      } catch (uploadError) {
        return { success: false, message: "Could not upload profile picture: " + uploadError.message };
      }
    }

    if (currentUser.role === "driver") {
      const driverChanges = {
        license_id: changes.license_id?.trim() || null,
        vehicle_type: changes.vehicle_type?.trim() || "",
        plate_number: changes.plate_number?.trim().toUpperCase() || "",
      };

      if (!driverChanges.license_id || !driverChanges.vehicle_type || !driverChanges.plate_number) {
        return { success: false, message: "License ID, vehicle type, and plate number are required for driver accounts." };
      }

      const { error: driverError } = await supabase
        .from("driver_profiles")
        .update(driverChanges)
        .eq("user_id", userId);

      if (driverError) return { success: false, message: driverError.message };
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone: changes.phone?.trim() || null,
        avatar_url: avatarUrl,
      })
      .eq("id", userId);

    if (profileError) return { success: false, message: profileError.message };

    try {
      const updatedUser = await loadProfile(session.user);
      return { success: true, user: updatedUser };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const loginUser = async (identifier, password, role) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: identifier.trim().toLowerCase(),
      password,
    });

    if (error) return { success: false, message: error.message };

    try {
      const profile = await loadProfile(data.user);

      if (!profile || profile.role !== role) {
        await supabase.auth.signOut();
        return {
          success: false,
          message: role === "driver"
            ? "This account is not registered as a driver."
            : "This account is not registered as a passenger.",
        };
      }

      return { success: true, user: profile };
    } catch (profileError) {
      await supabase.auth.signOut();
      return { success: false, message: profileError.message };
    }
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

  const updateDriverSettings = async (changes) => {
    if (!session?.user?.id || currentUser?.role !== "driver") {
      return { success: false, message: "Only logged-in drivers can change availability." };
    }

    const update = {};
    if (typeof changes.is_online === "boolean") update.is_online = changes.is_online;
    if (typeof changes.auto_accept === "boolean") update.auto_accept = changes.auto_accept;
    if (!Object.keys(update).length) return { success: false, message: "No settings to update." };

    const { error } = await supabase
      .from("driver_profiles")
      .update(update)
      .eq("user_id", session.user.id);

    if (error) return { success: false, message: error.message };

    const { data, error: loadError } = await supabase
      .from("driver_profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (loadError) return { success: false, message: loadError.message };
    setCurrentUser((old) => old ? { ...old, driverProfile: data } : old);
    return { success: true, driverProfile: data };
  };

  const createBooking = async (booking) => {
    if (!session?.user?.id) return { success: false, message: "Please log in again." };

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        passenger_id: session.user.id,
        passenger_name: booking.passenger || currentUser?.full_name || "Passenger",
        service: booking.service || "Motorcycle",
        pickup: booking.pickup || "Current Location",
        destination: booking.destinationText || booking.destination || "Selected Destination",
        pickup_coords: booking.pickupCoords || null,
        destination_coords: booking.destinationCoords || null,
        fare: booking.fare || "₱120.00",
        distance: booking.distance || "3.5 km",
        status: "searching",
      })
      .select("*")
      .single();

    if (error) return { success: false, message: error.message };
    setActiveBooking({ ...mapBooking(data), driverDetails: null, passengerRating: null });
    return { success: true, booking: mapBooking(data) };
  };

  const acceptBooking = async (bookingId) => {
    if (!session?.user?.id) return { success: false, message: "Please log in again." };
    if (currentUser?.role !== "driver" || currentUser?.driverProfile?.is_online !== true) {
      return { success: false, message: "Go online before accepting a ride." };
    }

    const { data, error } = await supabase
      .from("bookings")
      .update({
        driver_id: session.user.id,
        driver_name: currentUser?.full_name || "Driver",
        driver_phone: currentUser?.phone || null,
        driver_vehicle_type: currentUser?.driverProfile?.vehicle_type || null,
        driver_plate_number: currentUser?.driverProfile?.plate_number || null,
        status: "accepted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)
      .eq("status", "searching")
      .select("*")
      .maybeSingle();

    if (error) return { success: false, message: error.message };
    if (!data) return { success: false, message: "This booking was already accepted by another driver." };
    setActiveBooking(mapBooking(data));
    setIncomingBookings((items) => items.filter((item) => item.id !== bookingId));
    return { success: true, booking: mapBooking(data) };
  };

  const updateBookingStatus = async (status) => {
    if (!activeBooking?.id || !session?.user?.id) {
      return { success: false, message: "No active ride was found." };
    }

    const dbStatus = ({
      "Proceed to Pick Up": "accepted",
      "Arrived at Pick Up": "arrived",
      "Passenger Picked Up": "in_progress",
      "Drop Off / Complete": "completed",
      "completed": "completed",
    })[status] || status;

    const { data, error } = await supabase
      .from("bookings")
      .update({ status: dbStatus, updated_at: new Date().toISOString() })
      .eq("id", activeBooking.id)
      .eq("driver_id", session.user.id)
      .select("*")
      .single();

    if (error) return { success: false, message: error.message };

    if (dbStatus === "completed") setActiveBooking(null);
    else setActiveBooking(mapBooking(data));

    return { success: true };
  };

  const clearBooking = async () => {
    if (!activeBooking?.id || !session?.user?.id) {
      setActiveBooking(null);
      return { success: true };
    }

    if (activeBooking.status !== "Waiting for driver") {
      setActiveBooking(null);
      return { success: true };
    }

    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", activeBooking.id)
      .eq("passenger_id", session.user.id)
      .eq("status", "searching");

    if (error) return { success: false, message: error.message };
    setActiveBooking(null);
    return { success: true };
  };

  const submitRiderRating = async (bookingId, rating) => {
    if (!session?.user?.id || !activeBooking?.driver_id) {
      return { success: false, message: "The completed ride details are missing." };
    }

    const { data: existing, error: existingError } = await supabase
      .from("rider_ratings")
      .select("rating")
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (existingError) return { success: false, message: existingError.message };

    if (!existing) {
      const { error } = await supabase
        .from("rider_ratings")
        .insert({
          booking_id: bookingId,
          passenger_id: session.user.id,
          driver_id: activeBooking.driver_id,
          rating,
        });

      if (error) return { success: false, message: error.message };
    }

    try {
      const driverDetails = await getDriverDetails(activeBooking);
      setActiveBooking((old) => old ? { ...old, driverDetails, passengerRating: rating } : old);
    } catch (error) {
      console.warn("Updated rider rating load error:", error.message);
      setActiveBooking((old) => old ? { ...old, passengerRating: rating } : old);
    }

    return { success: true };
  };

  return (
    <AuthContext.Provider value={{
      session,
      currentUser,
      authLoading,
      registerUser,
      loginUser,
      updateProfile,
      logoutUser,
      resetPassword,
      activeBooking,
      incomingBookings,
      createBooking,
      updateDriverSettings,
      acceptBooking,
      updateBookingStatus,
      clearBooking,
      submitRiderRating,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
