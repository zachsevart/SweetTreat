# Next Steps - Backend Development 🎯

Based on current state analysis:
- ✅ **10 restaurants** in database
- ✅ **0 videos** (expected - need storage first)
- ✅ **0 storage buckets** (needs setup)
- ✅ **All services created** and working
- ✅ **Test script passing**

---

## 🚨 Priority 1: Storage Setup (CRITICAL - Do This First!)

**Why:** You can't upload videos without storage buckets. This blocks the core feature.

### Steps:
1. **Go to Supabase Dashboard > Storage**
2. **Create 3 buckets:**

   **`videos` bucket:**
   - Public: ✅ Yes
   - File size limit: 100MB
   - Allowed MIME types: `video/*`

   **`thumbnails` bucket:**
   - Public: ✅ Yes  
   - File size limit: 5MB
   - Allowed MIME types: `image/*`

   **`avatars` bucket:**
   - Public: ✅ Yes
   - File size limit: 2MB
   - Allowed MIME types: `image/*`

3. **Set Storage Policies** (Supabase Dashboard > Storage > Policies):

```sql
-- Videos: Public read, authenticated upload
CREATE POLICY "Public read videos" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'videos');

CREATE POLICY "Authenticated upload videos" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');

-- Thumbnails: Public read, authenticated upload
CREATE POLICY "Public read thumbnails" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'thumbnails');

CREATE POLICY "Authenticated upload thumbnails" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'thumbnails' AND auth.role() = 'authenticated');

-- Avatars: Public read, users upload own
CREATE POLICY "Public read avatars" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'avatars');

CREATE POLICY "Users upload own avatar" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

**Time:** ~15 minutes

---

## 📊 Priority 2: Populate More Restaurant Data

**Why:** 10 restaurants is minimal. You need more data for testing and demos.

### Recommended Actions:

1. **Populate from multiple cities:**
```bash
# Major cities with good dessert scenes
node scripts/populateFromSerpapiYelp.js "dessert" "San Francisco, CA" 50
node scripts/populateFromSerpapiYelp.js "ice cream" "New York, NY" 50
node scripts/populateFromSerpapiYelp.js "bakery" "Los Angeles, CA" 50
node scripts/populateFromSerpapiYelp.js "dessert" "Seattle, WA" 50
node scripts/populateFromSerpapiYelp.js "pastry" "Chicago, IL" 50
node scripts/populateFromSerpapiYelp.js "gelato" "Miami, FL" 30
```

2. **Add `yelp_place_id` to restaurants table:**
```sql
-- Add column for storing Yelp place IDs (for fetching reviews later)
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS yelp_place_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_restaurants_yelp_place_id 
  ON restaurants(yelp_place_id);
```

3. **Update populate script to save place_id:**
   - Modify `populateFromSerpapiYelp.js` to store `place_ids[0]` in `yelp_place_id` column
   - This enables fetching Yelp reviews later

**Target:** 200-300 restaurants across multiple cities

**Time:** ~30-60 minutes (depending on API rate limits)

---

## 🔒 Priority 3: Verify & Fix RLS Policies

**Why:** Security and proper access control. Your test shows 0 buckets, which might indicate RLS blocking.

### Steps:
1. **Check current policies** (Supabase Dashboard > Authentication > Policies)
2. **Run the complete schema SQL** if you haven't:
   ```bash
   # Copy contents of sql/complete_schema.sql to Supabase SQL Editor
   ```
3. **Verify policies exist for:**
   - `restaurants` - Public read ✅
   - `video_reviews` - Public read, users manage own ✅
   - `user_likes` - Public read, users manage own ✅
   - `profiles` - Public read, users manage own ✅

**Time:** ~10 minutes

---

## 🗄️ Priority 4: Database Functions & Triggers

**Why:** Auto-update likes count, create profiles on signup, etc.

### Run this SQL in Supabase SQL Editor:

```sql
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

-- Auto-update video likes count
CREATE OR REPLACE FUNCTION update_video_likes_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.video_reviews
    SET likes_count = likes_count + 1
    WHERE id = NEW.video_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.video_reviews
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.video_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_likes_count
  AFTER INSERT OR DELETE ON public.user_likes
  FOR EACH ROW EXECUTE FUNCTION update_video_likes_count();
```

**Time:** ~5 minutes

---

## 🧪 Priority 5: Create Sample Test Data

**Why:** Frontend team needs data to work with. Create some test videos, users, likes.

### Create a script: `scripts/createSampleData.ts`

This would:
1. Create a test user
2. Create sample video reviews (with placeholder URLs)
3. Create some likes
4. Update profiles

**Time:** ~30 minutes to create script

---

## 📈 Recommended Order of Execution

### This Week (Backend Focus):

**Day 1 (Today):**
1. ✅ Set up storage buckets (15 min)
2. ✅ Populate 200+ restaurants (30-60 min)
3. ✅ Add yelp_place_id column (5 min)

**Day 2:**
1. ✅ Verify/fix RLS policies (10 min)
2. ✅ Add database functions/triggers (5 min)
3. ✅ Test storage uploads work (15 min)

**Day 3:**
1. ✅ Create sample data script (30 min)
2. ✅ Populate sample videos/likes (15 min)
3. ✅ Document API for frontend team (30 min)

---

## 🎯 Quick Wins (Do These Now)

1. **Storage buckets** - 15 minutes, unlocks video uploads
2. **More restaurants** - 30 minutes, better data for testing
3. **yelp_place_id column** - 5 minutes, enables review fetching later

---

## 📝 Notes for Frontend Integration

Once storage is set up:
- Frontend can use `storageService.uploadVideo()` 
- Videos will be stored in `videos` bucket
- Thumbnails in `thumbnails` bucket
- Public URLs available immediately

Once you have 200+ restaurants:
- Frontend can test map view with real data
- Search/filter functionality can be tested
- Reels feed will have content to display

---

## 🚀 After These Steps

You'll have:
- ✅ Storage ready for video uploads
- ✅ 200+ restaurants across multiple cities
- ✅ Proper security (RLS policies)
- ✅ Auto-updating likes/views
- ✅ Sample data for frontend testing

**Then you can:**
- Help frontend team integrate services
- Test video upload flow end-to-end
- Work on Yelp reviews integration
- Add more advanced features

