import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const missingSupabaseEnv = [];
if (!supabaseUrl) missingSupabaseEnv.push("EXPO_PUBLIC_SUPABASE_URL");
if (!supabaseKey) missingSupabaseEnv.push("EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

if (missingSupabaseEnv.length) {
  console.error(
    "Missing Expo environment variables: " + missingSupabaseEnv.join(", ") +
    ". Check the exact spelling in the project-root .env file, then restart Expo with npx expo start -c."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseKey || "placeholder-key",
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
