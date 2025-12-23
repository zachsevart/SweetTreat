-- ============================================
-- Complete Database Schema for SweetTreat
-- ============================================
-- Run this file in Supabase SQL Editor to set up the entire database
-- ============================================

-- ============================================
-- 1. RESTAURANTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  cuisine_type TEXT,
  price_range TEXT,
  rating REAL, -- Changed from TEXT to REAL for better querying
  image_url TEXT,
  yelp_place_id TEXT -- For fetching Yelp reviews
);

-- Indexes for restaurants
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON public.restaurants(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_restaurants_name ON public.restaurants(name);
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine ON public.restaurants(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_restaurants_rating ON public.restaurants(rating DESC);

-- RLS for restaurants
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.restaurants
  FOR SELECT USING (true);

CREATE POLICY "Authenticated insert" ON public.restaurants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update" ON public.restaurants
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================
-- 2. VIDEO_REVIEWS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.video_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER, -- Duration in seconds
  likes_count INTEGER NOT NULL DEFAULT 0,
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT video_url_not_empty CHECK (video_url != ''),
  CONSTRAINT likes_count_non_negative CHECK (likes_count >= 0),
  CONSTRAINT views_count_non_negative CHECK (views_count >= 0),
  CONSTRAINT duration_positive CHECK (duration IS NULL OR duration > 0)
);

-- Indexes for video_reviews
CREATE INDEX IF NOT EXISTS idx_video_reviews_restaurant_id ON public.video_reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_video_reviews_user_id ON public.video_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_video_reviews_created_at ON public.video_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_reviews_likes_count ON public.video_reviews(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_video_reviews_views_count ON public.video_reviews(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_video_reviews_user_created ON public.video_reviews(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_reviews_restaurant_engagement ON public.video_reviews(restaurant_id, likes_count DESC, views_count DESC);

-- RLS for video_reviews
ALTER TABLE public.video_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.video_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create own videos" ON public.video_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own videos" ON public.video_reviews
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own videos" ON public.video_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 3. USER_LIKES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.video_reviews(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- Indexes for user_likes
CREATE INDEX IF NOT EXISTS idx_user_likes_user_id ON public.user_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_likes_video_id ON public.user_likes(video_id);

-- RLS for user_likes
ALTER TABLE public.user_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.user_likes
  FOR SELECT USING (true);

CREATE POLICY "Users manage own likes" ON public.user_likes
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 4. PROFILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users manage own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- ============================================
-- 5. FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'username', new.email));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update video_reviews updated_at timestamp
CREATE OR REPLACE FUNCTION update_video_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_video_reviews_updated_at
  BEFORE UPDATE ON public.video_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_video_reviews_updated_at();

-- Update profiles updated_at timestamp
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- Increment video views (optimized function)
CREATE OR REPLACE FUNCTION increment_video_views(video_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.video_reviews
  SET views_count = views_count + 1,
      updated_at = NOW()
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update video likes count when likes are added/removed
CREATE OR REPLACE FUNCTION update_video_likes_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.video_reviews
    SET likes_count = likes_count + 1,
        updated_at = NOW()
    WHERE id = NEW.video_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.video_reviews
    SET likes_count = GREATEST(likes_count - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.video_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_likes_count
  AFTER INSERT OR DELETE ON public.user_likes
  FOR EACH ROW EXECUTE FUNCTION update_video_likes_count();

