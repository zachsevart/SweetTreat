# SweetTreat 🍰

A React Native mobile app for discovering dessert places with TikTok/Instagram-style video reviews.

## Features

- 🗺️ **Map View** - Discover dessert places near you
- 🎬 **Reels Feed** - Watch video reviews in a vertical feed
- 🔍 **Browse** - Explore restaurants with cards and filters
- 👤 **Profile** - Manage your account and reviews

## Tech Stack

- **Expo** - React Native framework
- **TypeScript** - Type safety
- **Supabase** - Backend (Database, Auth, Storage)
- **React Navigation** - Navigation
- **React Native Maps** - Map integration
- **React Native Video** - Video playback

## Prerequisites

- Node.js >= 18
- npm or yarn
- Expo Go app on your phone (for development) or iOS Simulator/Android Emulator
- Supabase account and project

## Setup

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Configure Supabase

Edit `app.json` and add your Supabase credentials in the `extra` section:

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

You can find these values in your Supabase project settings under API.

**Alternative:** You can also use environment variables by creating a `.env` file (requires `react-native-dotenv` or similar).

### 3. Set Up Supabase Database

Run these SQL commands in your Supabase SQL editor:

```sql
-- Create restaurants table
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  cuisine_type TEXT,
  price_range TEXT,
  rating FLOAT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create video_reviews table
CREATE TABLE video_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER,
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_likes table
CREATE TABLE user_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES video_reviews(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your needs)
-- For MVP, you can allow public read access:
CREATE POLICY "Public read access" ON restaurants FOR SELECT USING (true);
CREATE POLICY "Public read access" ON video_reviews FOR SELECT USING (true);
CREATE POLICY "Public read access" ON user_likes FOR SELECT USING (true);
CREATE POLICY "Public read access" ON profiles FOR SELECT USING (true);
```

### 4. Run the App

**Start Expo development server:**
```bash
npm start
# or
yarn start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

**Or run directly:**
```bash
npm run ios    # iOS simulator
npm run android # Android emulator
```

## Project Structure

```
SweetTreat/
├── src/
│   ├── components/       # Reusable UI components
│   ├── screens/          # Screen components
│   │   ├── MapScreen.tsx
│   │   ├── ReelsScreen.tsx
│   │   ├── BrowseScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── services/         # API services
│   │   ├── supabase.ts
│   │   ├── authService.ts
│   │   ├── restaurantService.ts
│   │   └── videoService.ts
│   ├── types/            # TypeScript type definitions
│   │   ├── database.types.ts
│   │   └── index.ts
│   └── utils/            # Utility functions
│       └── env.ts
├── App.tsx               # Main app component
├── app.json              # Expo configuration
└── package.json
```

## Services

### Restaurant Service
- `getAll()` - Get all restaurants
- `getById(id)` - Get restaurant by ID
- `getNearby(lat, lng, radius)` - Get restaurants near location
- `search(query)` - Search restaurants by name
- `getByCuisine(type)` - Filter by cuisine type

### Video Service
- `getAll()` - Get all video reviews
- `getByRestaurant(id)` - Get videos for a restaurant
- `getReelsFeed(limit)` - Get videos for reels feed
- `incrementViews(id)` - Increment view count

### Auth Service
- `signUp(email, password)` - Create new account
- `signIn(email, password)` - Sign in
- `signOut()` - Sign out
- `getCurrentUser()` - Get current user
- `onAuthStateChange(callback)` - Listen to auth changes

## Troubleshooting

### Common Issues

1. **Metro bundler cache issues:**
   ```bash
   npm start -- --reset-cache
   ```

2. **Module not found errors:**
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **Expo CLI not found:**
   ```bash
   npm install -g expo-cli
   # or use npx
   npx expo start
   ```

## Next Steps

1. Set up Supabase Storage for video uploads
2. Implement video upload functionality
3. Add location permissions for map
4. Implement like/unlike functionality
5. Add search and filter UI
6. Set up proper authentication flow
7. Add error handling and loading states
8. Implement offline caching

## Development

```bash
# Type checking
npm run type-check

# Start development server
npm start
```

## License

MIT
