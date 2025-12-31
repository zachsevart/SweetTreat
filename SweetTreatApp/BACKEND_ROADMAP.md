# Backend Development Roadmap 🎯

**Focus: Backend only - Database, Services, APIs, Data**

---

## ✅ Phase 1: Database Setup & Verification (Priority: HIGH)

### 1.1 Verify Database Schema
- [ ] **Check if tables exist in Supabase**
  - Go to Supabase Dashboard > Table Editor
  - Verify these tables exist:
    - `restaurants`
    - `video_reviews`
    - `user_likes`
    - `profiles`
  
- [ ] **Fix schema mismatches**
  - Your TypeScript types show `rating` as `number`, but your actual DB has `rating` as `TEXT`
  - Update either the database OR the types to match
  - **Recommendation:** Change DB to use `REAL` or `NUMERIC` for rating (better for queries)

- [ ] **Add missing fields**
  - Consider adding `yelp_place_id` to `restaurants` table (for fetching reviews later)
  ```sql
  ALTER TABLE restaurants ADD COLUMN yelp_place_id TEXT;
  ```

### 1.2 Row Level Security (RLS) Policies
- [ ] **Set up proper RLS policies** (Supabase Dashboard > Authentication > Policies)
  
  **Restaurants:**
  ```sql
  -- Public read, authenticated write
  CREATE POLICY "Public read" ON restaurants FOR SELECT USING (true);
  CREATE POLICY "Authenticated insert" ON restaurants FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  CREATE POLICY "Authenticated update" ON restaurants FOR UPDATE USING (auth.role() = 'authenticated');
  ```

  **Video Reviews:**
  ```sql
  -- Public read, users can only insert their own
  CREATE POLICY "Public read" ON video_reviews FOR SELECT USING (true);
  CREATE POLICY "Users insert own" ON video_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users update own" ON video_reviews FOR UPDATE USING (auth.uid() = user_id);
  ```

  **User Likes:**
  ```sql
  -- Public read, users manage their own likes
  CREATE POLICY "Public read" ON user_likes FOR SELECT USING (true);
  CREATE POLICY "Users manage own likes" ON user_likes FOR ALL USING (auth.uid() = user_id);
  ```

  **Profiles:**
  ```sql
  -- Public read, users manage own profile
  CREATE POLICY "Public read" ON profiles FOR SELECT USING (true);
  CREATE POLICY "Users manage own profile" ON profiles FOR ALL USING (auth.uid() = id);
  ```

---

## ✅ Phase 2: Supabase Storage Setup (Priority: HIGH)

### 2.1 Create Storage Buckets
- [ ] **Create `videos` bucket** (Supabase Dashboard > Storage)
  - Public: Yes (or No if you want private)
  - File size limit: 100MB (adjust as needed)
  - Allowed MIME types: `video/*`

- [ ] **Create `thumbnails` bucket**
  - Public: Yes
  - File size limit: 5MB
  - Allowed MIME types: `image/*`

- [ ] **Create `avatars` bucket**
  - Public: Yes
  - File size limit: 2MB
  - Allowed MIME types: `image/*`

### 2.2 Storage Policies
```sql
-- Videos: Users can upload, public can read
CREATE POLICY "Public read videos" ON storage.objects FOR SELECT USING (bucket_id = 'videos');
CREATE POLICY "Authenticated upload videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');

-- Thumbnails: Public read/write
CREATE POLICY "Public read thumbnails" ON storage.objects FOR SELECT USING (bucket_id = 'thumbnails');
CREATE POLICY "Authenticated upload thumbnails" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'thumbnails' AND auth.role() = 'authenticated');

-- Avatars: Public read, users upload own
CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## ✅ Phase 3: Complete Service Layer (Priority: MEDIUM)

### 3.1 Create Missing Services

- [ ] **Create `likesService.ts`**
  ```typescript
  // src/services/likesService.ts
  - toggleLike(userId, videoId)
  - getUserLikes(userId)
  - getVideoLikes(videoId)
  - isLiked(userId, videoId)
  ```

- [ ] **Create `profileService.ts`**
  ```typescript
  // src/services/profileService.ts
  - getProfile(userId)
  - updateProfile(userId, updates)
  - uploadAvatar(userId, file)
  ```

- [ ] **Create `storageService.ts`**
  ```typescript
  // src/services/storageService.ts
  - uploadVideo(file, userId, restaurantId)
  - uploadThumbnail(file, videoId)
  - uploadAvatar(file, userId)
  - getPublicUrl(bucket, path)
  - deleteFile(bucket, path)
  ```

### 3.2 Enhance Existing Services

- [ ] **Add to `restaurantService.ts`:**
  - `getRestaurantsWithVideos()` - Get restaurants with video count
  - `getPopularRestaurants(limit)` - Most reviewed restaurants

- [ ] **Add to `videoService.ts`:**
  - `getVideosByUser(userId)` - Get user's videos
  - `deleteVideo(id, userId)` - Delete with ownership check
  - `incrementLikes(id)` - Increment likes count

---

## ✅ Phase 4: Database Functions & Triggers (Priority: MEDIUM)

### 4.1 Create Database Functions

- [ ] **Auto-create profile on user signup**
  ```sql
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger AS $$
  BEGIN
    INSERT INTO public.profiles (id, username)
    VALUES (new.id, new.email);
    RETURN new;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  ```

- [ ] **Increment views function**
  ```sql
  CREATE OR REPLACE FUNCTION increment_views(video_id UUID)
  RETURNS void AS $$
  BEGIN
    UPDATE video_reviews
    SET views_count = views_count + 1
    WHERE id = video_id;
  END;
  $$ LANGUAGE plpgsql;
  ```

- [ ] **Update likes count trigger**
  ```sql
  CREATE OR REPLACE FUNCTION update_video_likes_count()
  RETURNS trigger AS $$
  BEGIN
    IF TG_OP = 'INSERT' THEN
      UPDATE video_reviews
      SET likes_count = likes_count + 1
      WHERE id = NEW.video_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE video_reviews
      SET likes_count = likes_count - 1
      WHERE id = OLD.video_id;
    END IF;
    RETURN NULL;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER update_likes_count
    AFTER INSERT OR DELETE ON user_likes
    FOR EACH ROW EXECUTE FUNCTION update_video_likes_count();
  ```

---

## ✅ Phase 5: Data Population (Priority: HIGH)

### 5.1 Populate Restaurants
- [ ] **Run restaurant population scripts**
  ```bash
  # Populate from multiple cities
  node scripts/populateFromSerpapiYelp.js "dessert" "San Francisco, CA" 50
  node scripts/populateFromSerpapiYelp.js "ice cream" "New York, NY" 50
  node scripts/populateFromSerpapiYelp.js "bakery" "Los Angeles, CA" 50
  node scripts/populateFromSerpapiYelp.js "dessert" "Seattle, WA" 50
  ```

- [ ] **Store Yelp place_ids** (update script to save place_id)
- [ ] **Verify data quality** - Check a few restaurants in Supabase dashboard

### 5.2 Test Data
- [ ] **Create test users** (via Supabase Auth or script)
- [ ] **Create sample video reviews** (manually or via script)
- [ ] **Create sample likes**

---

## ✅ Phase 6: Testing & Validation (Priority: MEDIUM)

### 6.1 Test All Services
- [ ] **Create test script** (`scripts/testBackend.ts`)
  - Test auth: signup, signin, signout
  - Test restaurants: getAll, getById, search, getNearby
  - Test videos: create, getByRestaurant, incrementViews
  - Test likes: toggleLike, getUserLikes
  - Test storage: upload, getUrl

### 6.2 Test RLS Policies
- [ ] **Test as unauthenticated user** - Should only read
- [ ] **Test as authenticated user** - Should read + write own data
- [ ] **Test as different user** - Should not modify others' data

---

## ✅ Phase 7: Documentation (Priority: LOW)

### 7.1 API Documentation
- [ ] **Document all service methods**
- [ ] **Create API endpoint list** (if adding REST API later)
- [ ] **Document data models**

### 7.2 Setup Documentation
- [ ] **Update README with backend setup steps**
- [ ] **Document environment variables needed**
- [ ] **Document database migration steps**

---

## 🎯 Quick Start Checklist (Do These First!)

1. **Verify database tables exist** (5 min)
2. **Fix rating column type mismatch** (10 min)
3. **Set up RLS policies** (20 min)
4. **Create storage buckets** (10 min)
5. **Populate restaurants data** (30 min)
6. **Test services work** (30 min)

**Total: ~2 hours to get backend functional**

---

## 📝 Notes for Frontend Integration

When frontend team is ready:
- All services are in `src/services/` - they can import directly
- Services use Supabase client - no REST API needed (direct DB access)
- Storage URLs are public - can use directly in `<Image>` or `<Video>` components
- Auth state is managed via `authService.onAuthStateChange()`

---

## 🚨 Common Issues to Watch For

1. **RLS blocking queries** - Check policies are correct
2. **Storage uploads failing** - Check bucket policies and file size limits
3. **Type mismatches** - Keep TypeScript types in sync with DB schema
4. **Missing indexes** - Add indexes on frequently queried columns (restaurant_id, user_id)

---

## Next Steps After Backend Complete

1. Share service documentation with frontend team
2. Set up shared TypeScript types (already done in `src/types/`)
3. Test integration points together
4. Set up error handling patterns
5. Plan for production deployment

