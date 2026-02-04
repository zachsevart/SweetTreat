require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase client with service role key (server-side only)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all restaurants
app.get('/api/restaurants', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('rating', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Get restaurant by ID with video reviews
app.get('/api/restaurants/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const [restaurantResult, videosResult] = await Promise.all([
      supabase.from('restaurants').select('*').eq('id', id).single(),
      supabase
        .from('video_reviews')
        .select('*')
        .eq('restaurant_id', id)
        .order('created_at', { ascending: false }),
    ]);

    if (restaurantResult.error) throw restaurantResult.error;

    res.json({
      ...restaurantResult.data,
      video_reviews: videosResult.data || [],
    });
  } catch (err) {
    next(err);
  }
});

// Search YouTube for restaurant review videos (keeps API key server-side)
app.get('/api/restaurants/:id/youtube-search', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { maxResults = 3 } = req.query;

    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    if (!YOUTUBE_API_KEY) {
      return res.status(500).json({ error: 'YouTube API key not configured' });
    }

    // Get restaurant name for search query
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('name')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Search YouTube
    const query = encodeURIComponent(`${restaurant.name} dessert review`);
    const youtubeUrl =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet` +
      `&q=${query}` +
      `&type=video` +
      `&maxResults=${maxResults}` +
      `&videoDuration=short` +
      `&key=${YOUTUBE_API_KEY}`;

    const ytResponse = await fetch(youtubeUrl);
    if (!ytResponse.ok) {
      const text = await ytResponse.text();
      throw new Error(`YouTube API error: ${ytResponse.status} ${text}`);
    }

    const ytData = await ytResponse.json();

    // Transform response
    const videos = (ytData.items || []).map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails?.high?.url,
      publishedAt: item.snippet.publishedAt,
      channelTitle: item.snippet.channelTitle,
      videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));

    res.json({ restaurant: restaurant.name, videos });
  } catch (err) {
    next(err);
  }
});

// Import YouTube videos into video_reviews table
app.post('/api/restaurants/:id/import-videos', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { videos } = req.body;

    if (!Array.isArray(videos) || videos.length === 0) {
      return res.status(400).json({ error: 'videos array is required' });
    }

    const inserted = [];
    const skipped = [];

    for (const video of videos) {
      // Check for duplicates
      const { data: existing } = await supabase
        .from('video_reviews')
        .select('id')
        .eq('video_url', video.videoUrl)
        .maybeSingle();

      if (existing) {
        skipped.push(video.videoUrl);
        continue;
      }

      const { data, error } = await supabase
        .from('video_reviews')
        .insert({
          restaurant_id: id,
          video_url: video.videoUrl,
          thumbnail_url: video.thumbnailUrl,
        })
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
      } else {
        inserted.push(data);
      }
    }

    res.json({
      inserted: inserted.length,
      skipped: skipped.length,
      videos: inserted,
    });
  } catch (err) {
    next(err);
  }
});

// Get video reviews for a restaurant
app.get('/api/restaurants/:id/videos', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('video_reviews')
      .select('*')
      .eq('restaurant_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

// Get user's saved restaurants (requires user_id query param)
app.get('/api/saved-restaurants', async (req, res, next) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id query parameter required' });
    }

    const { data, error } = await supabase
      .from('saved_restaurants')
      .select('*, restaurant:restaurants(*)')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

// Aggregate stats endpoint (something Supabase client can't easily do)
app.get('/api/stats', async (req, res, next) => {
  try {
    const [restaurants, videos, savedCounts] = await Promise.all([
      supabase.from('restaurants').select('id', { count: 'exact', head: true }),
      supabase.from('video_reviews').select('id', { count: 'exact', head: true }),
      supabase.from('saved_restaurants').select('restaurant_id'),
    ]);

    // Count saves per restaurant
    const savesByRestaurant = {};
    for (const save of savedCounts.data || []) {
      savesByRestaurant[save.restaurant_id] =
        (savesByRestaurant[save.restaurant_id] || 0) + 1;
    }

    // Find most saved
    let mostSavedId = null;
    let mostSavedCount = 0;
    for (const [id, count] of Object.entries(savesByRestaurant)) {
      if (count > mostSavedCount) {
        mostSavedId = id;
        mostSavedCount = count;
      }
    }

    let mostSavedRestaurant = null;
    if (mostSavedId) {
      const { data } = await supabase
        .from('restaurants')
        .select('name')
        .eq('id', mostSavedId)
        .single();
      mostSavedRestaurant = data?.name;
    }

    res.json({
      totalRestaurants: restaurants.count || 0,
      totalVideoReviews: videos.count || 0,
      totalSaves: savedCounts.data?.length || 0,
      mostSaved: mostSavedRestaurant
        ? { name: mostSavedRestaurant, saves: mostSavedCount }
        : null,
    });
  } catch (err) {
    next(err);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`SweetTreat API running on http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  GET  /health');
  console.log('  GET  /api/restaurants');
  console.log('  GET  /api/restaurants/:id');
  console.log('  GET  /api/restaurants/:id/videos');
  console.log('  GET  /api/restaurants/:id/youtube-search');
  console.log('  POST /api/restaurants/:id/import-videos');
  console.log('  GET  /api/saved-restaurants?user_id=xxx');
  console.log('  GET  /api/stats');
});
