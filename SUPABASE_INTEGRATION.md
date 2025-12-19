# Supabase Integration Guide

This document outlines the essential Supabase files to keep and how to integrate them with your partner's frontend.

## 📦 Essential Files to Keep

These are the **core Supabase files** that should be committed:

### Services (Backend Logic)
```
src/services/
├── supabase.ts           ✅ KEEP - Core Supabase client
├── authService.ts         ✅ KEEP - Authentication functions
├── restaurantService.ts  ✅ KEEP - Restaurant CRUD operations
└── videoService.ts       ✅ KEEP - Video review operations
```

### Types (TypeScript Definitions)
```
src/types/
├── database.types.ts     ✅ KEEP - Database schema types
└── index.ts              ✅ KEEP - Type exports
```

### Utils (Configuration)
```
src/utils/
└── env.ts                ✅ KEEP - Environment variable handling
```

## 🗑️ Files to Remove (Partner Has Their Own)

These can be deleted since your partner has their own frontend:

```
src/screens/              ❌ DELETE - Partner has their own screens
├── MapScreen.tsx
├── ReelsScreen.tsx
├── BrowseScreen.tsx
└── ProfileScreen.tsx

App.tsx                   ❌ DELETE - Partner has their own App.tsx
```

## 🔌 Integration Steps

### 1. Copy Supabase Files to Partner's Project

Copy these directories/files to your partner's project:
- `src/services/` (all 4 files)
- `src/types/` (both files)
- `src/utils/env.ts`

### 2. Update Environment Configuration

Your partner needs to configure Supabase credentials. Options:

**Option A: Using app.json (Expo)**
```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "your_supabase_project_url",
      "supabaseAnonKey": "your_supabase_anon_key"
    }
  }
}
```

**Option B: Using .env file**
If they use `react-native-dotenv`, update `src/utils/env.ts`:
```typescript
import Constants from 'expo-constants'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env'

export const ENV = {
  SUPABASE_URL: SUPABASE_URL || Constants.expoConfig?.extra?.supabaseUrl || '',
  SUPABASE_ANON_KEY: SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.supabaseAnonKey || '',
}
```

### 3. Install Required Dependencies

Make sure these are in `package.json`:
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "expo-constants": "~15.4.5"
  }
}
```

### 4. Import Services in Partner's Components

Example usage in partner's screens:

```typescript
// In their MapScreen or similar
import { restaurantService } from '../services/restaurantService'
import { Restaurant } from '../types'

// Get all restaurants
const restaurants = await restaurantService.getAll()

// Get nearby restaurants
const nearby = await restaurantService.getNearby(lat, lng, 5)

// Search
const results = await restaurantService.search('ice cream')
```

```typescript
// In their ReelsScreen or similar
import { videoService } from '../services/videoService'
import { VideoReview } from '../types'

// Get reels feed
const videos = await videoService.getReelsFeed(20)

// Get videos for a restaurant
const restaurantVideos = await videoService.getByRestaurant(restaurantId)
```

```typescript
// In their Auth/Profile screen
import { authService } from '../services/authService'

// Sign in
await authService.signIn(email, password)

// Sign up
await authService.signUp(email, password)

// Get current user
const user = await authService.getCurrentUser()

// Listen to auth changes
const { subscription } = authService.onAuthStateChange((session) => {
  // Handle auth state change
})
```

## 📋 Available Service Methods

### `restaurantService`
- `getAll()` - Get all restaurants
- `getById(id)` - Get restaurant by ID
- `getNearby(lat, lng, radiusKm)` - Get restaurants near location
- `search(query)` - Search restaurants by name
- `getByCuisine(type)` - Filter by cuisine type
- `create(restaurant)` - Create new restaurant
- `update(id, updates)` - Update restaurant
- `delete(id)` - Delete restaurant

### `videoService`
- `getAll()` - Get all video reviews
- `getByRestaurant(restaurantId)` - Get videos for restaurant
- `getReelsFeed(limit)` - Get videos for reels feed (ordered by engagement)
- `getById(id)` - Get video by ID
- `create(video)` - Create new video review
- `update(id, updates)` - Update video review
- `incrementViews(id)` - Increment view count

### `authService`
- `getSession()` - Get current session
- `getCurrentUser()` - Get current user
- `signUp(email, password)` - Sign up
- `signIn(email, password)` - Sign in
- `signOut()` - Sign out
- `resetPassword(email)` - Reset password
- `onAuthStateChange(callback)` - Listen to auth state changes

## 🗄️ Database Schema

Make sure your partner has set up the Supabase database with these tables:
- `restaurants`
- `video_reviews`
- `user_likes`
- `profiles`

See `README.md` for the SQL schema.

## ✅ Verification Checklist

- [ ] Supabase credentials configured in `app.json` or `.env`
- [ ] `@supabase/supabase-js` installed
- [ ] `expo-constants` installed (if using Expo)
- [ ] All service files copied to partner's project
- [ ] Type definitions copied
- [ ] Environment utility copied
- [ ] Partner can import and use services
- [ ] Database tables created in Supabase

## 🐛 Troubleshooting

**"Cannot find module '@supabase/supabase-js'"**
- Run `npm install @supabase/supabase-js`

**"Missing Supabase environment variables"**
- Check `app.json` has `extra.supabaseUrl` and `extra.supabaseAnonKey`
- Or set up `.env` file with `SUPABASE_URL` and `SUPABASE_ANON_KEY`

**Type errors**
- Make sure `src/types/` files are copied
- Check TypeScript can resolve the types

