# Moveon

Moveon is a React Native ride-booking app built with Expo, Expo Router, and Supabase.

## Requirements

- Node.js and npm
- Expo Go or an Android emulator
- A Supabase project
- A Mapbox public access token (used for road-route estimates)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` in the project root.
3. Replace the placeholder values with your Supabase project URL, Supabase publishable key, and Mapbox public token.
4. Start Expo with a clean cache:

   ```bash
   npx expo start -c
   ```

## Environment variables

Use these exact variable names (including underscores):

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_MAPBOX_TOKEN`

Never put a Supabase secret/service-role key in this app. The `.env` file is ignored by Git and must not be committed.

## Supabase setup

Run these SQL files in the Supabase SQL Editor, in this order:

1. `supabase/moveon_setup.sql`
2. `supabase/moveon_booking_workflow.sql`
3. `supabase/moveon_profile_avatars.sql`
4. `supabase/moveon_profile_edit.sql`
5. `supabase/moveon_driver_profile_update_policy.sql`

The driver profile migrations add the `is_online` and `auto_accept` fields used by the driver settings screen and grant the authenticated driver permission to update those fields on their own profile. Re-running the column additions is safe.

Keep the database schema and the app branch in sync. For the APK demo, confirm the Supabase project has all five migrations applied and that the project-root `.env` contains valid Supabase and Mapbox values.

## Booking updates

The app subscribes to Supabase Realtime for booking changes and also refreshes booking data every 10 seconds as a fallback if a WebSocket connection is interrupted.
