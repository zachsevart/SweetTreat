# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

All commands should be run from the `SweetTreatApp/` directory:

```bash
npm start              # Start Expo development server
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator
npm run web            # Run web version
npm run lint           # Run ESLint
npm run type-check     # TypeScript type checking
npm start -- --reset-cache  # Clear Metro bundler cache
```

Press `i` for iOS simulator, `a` for Android emulator, or scan QR with Expo Go app.

## Architecture Overview

**Stack**: React Native (Expo SDK 54) + TypeScript + Supabase backend

**App Purpose**: Dessert discovery app with TikTok-style swiping interface for finding dessert places.

### Key Architecture Patterns

1. **File-based Routing**: Uses Expo Router. Routes in `app/` directory map directly to URLs.
   - `(tabs)/` - Bottom tab navigation group
   - `auth/` - Authentication flow screens

2. **Services Pattern**: Business logic in `src/services/` modules that wrap Supabase client calls:
   - `authService.ts` - Auth operations, profile management
   - `restaurantService.ts` - Restaurant CRUD and queries
   - `swipeService.ts` - Swipe history, saved restaurants
   - `videoService.ts` - Video reviews

3. **Context-Based State**: `UserContext.tsx` manages global auth state, user profile, and session.

4. **Themed Components**: `ThemedText` and `ThemedView` components provide light/dark mode support.

### Data Flow

```
UserProvider (auth state) → Components → Services → Supabase Client
```

UserContext listens to Supabase auth state changes and triggers re-renders.

### Authentication Flow

1. `app/index.tsx` checks auth state
2. No auth → `/auth/login`
3. Auth but no profile → `/auth/create-profile`
4. Auth with profile → `/(tabs)/home`

## Project Structure

```
SweetTreatApp/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab screens (home, map, swipe, profile)
│   └── auth/              # Login, create-profile
├── src/
│   ├── services/          # Supabase API wrappers
│   ├── contexts/          # React Context providers
│   └── types/             # TypeScript types (database.types.ts is auto-generated)
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
├── constants/theme.ts     # Colors, fonts
└── app.json              # Expo config with Supabase credentials
```

## Supabase Configuration

Credentials are in `app.json` under `expo.extra`. Main tables:
- `restaurants` - Place data with lat/lng
- `profiles` - User profiles (linked to auth.users)
- `swipe_history` - User swipe actions
- `saved_restaurants` - User's saved places
- `video_reviews` - Video content

All tables have Row Level Security (RLS) enabled.

## Key Dependencies

- `react-native-reanimated` - Gesture animations (swipe cards)
- `react-native-maps` - Map integration (Google Maps on iOS)
- `expo-image` - Optimized image loading
- `@supabase/supabase-js` - Backend client
- Path alias: `@/*` maps to root directory

## Current Development Notes

- Map screen (`map.tsx`) has placeholder implementation
- Swipe feature uses gesture-based card animations
- Supabase RLS policies may need adjustment per recent commits
