# SerpAPI Yelp Restaurant Population Script

This script uses SerpAPI's Yelp Search API to fetch restaurant data and populate your Supabase database.

## Setup

1. **Get a SerpAPI Key**
   - Sign up at https://serpapi.com/
   - Get your API key from the dashboard
   - Add to `.env`: `SERPAPI_KEY=your_api_key_here`

2. **Configure Supabase**
   - Add to `.env`:
     ```
     SUPABASE_URL=your_supabase_url
     SUPABASE_SERVICE_KEY=your_service_role_key
     ```
   - **Important:** Use `SUPABASE_SERVICE_KEY` (service role key), not `SUPABASE_ANON_KEY`
   - The service role key bypasses Row Level Security (RLS) policies
   - Find it in: Supabase Dashboard > Settings > API > `service_role` key

3. **Fix RLS Policies (if needed)**
   
   If you get "row-level security policy" errors, you have two options:
   
   **Option A: Use Service Role Key (Recommended for scripts)**
   - Already configured above
   - Service role key bypasses all RLS policies
   
   **Option B: Update RLS Policies**
   ```sql
   -- Allow public inserts (adjust based on your security needs)
   CREATE POLICY "Allow public inserts" ON restaurants
     FOR INSERT
     WITH CHECK (true);
   ```

## Usage

```bash
# Basic usage
node scripts/populateFromSerpapiYelp.js

# With custom parameters
node scripts/populateFromSerpapiYelp.js "ice cream" "New York, NY" 30

# Using npm script
npm run populate-serpapi-yelp -- "dessert" "San Francisco, CA" 20
```

**Parameters:**
1. Search term (default: "dessert")
2. Location (default: "San Francisco, CA")
3. Limit (default: 20)

## How It Works

1. **Searches Yelp** via SerpAPI for restaurants matching your criteria
2. **Fetches business details** using place_id to get additional info
3. **Geocodes addresses** using OpenStreetMap Nominatim (free) to get coordinates
4. **Maps data** to your database schema:
   - `name` - Restaurant name
   - `address` - Full address
   - `latitude` / `longitude` - Coordinates
   - `cuisine_type` - Categories from Yelp
   - `price_range` - Price indicator ($$, etc.)
   - `rating` - Yelp rating (as text)
   - `image_url` - Restaurant thumbnail
5. **Checks for duplicates** by name and coordinates
6. **Inserts** into Supabase `restaurants` table

## Features

- ✅ Automatic geocoding for addresses without coordinates
- ✅ Duplicate detection (skips existing restaurants)
- ✅ Error handling and progress reporting
- ✅ Rate limiting to avoid API limits
- ✅ Supports all SerpAPI Yelp search parameters

## Database Schema

The script maps to this schema:
```sql
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT,
  address TEXT,
  latitude REAL,
  longitude DOUBLE PRECISION,
  cuisine_type TEXT,
  price_range TEXT,
  rating TEXT,  -- Note: TEXT, not numeric
  image_url TEXT
);
```

## Troubleshooting

**"row-level security policy" error:**
- Make sure you're using `SUPABASE_SERVICE_KEY` (service role key)
- Or update RLS policies to allow inserts

**"Missing coordinates" error:**
- The script will try to geocode addresses automatically
- If geocoding fails, the restaurant will be skipped

**Rate limiting:**
- SerpAPI has rate limits based on your plan
- The script includes delays between requests
- Free plan: 100 searches/month

**No results found:**
- Try different search terms or locations
- Check your SerpAPI key is valid
- Verify your API quota

## Next Steps

- Store `yelp_place_id` in restaurants table for fetching reviews later
- Add batch processing for large datasets
- Add update functionality for existing restaurants
- Cache geocoding results to reduce API calls

