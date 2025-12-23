# Yelp Reviews API Integration

This project uses SerpAPI to fetch Yelp reviews for restaurants.

## Setup

1. **Get a SerpAPI Key**
   - Sign up at https://serpapi.com/
   - Get your API key from the dashboard
   - Add it to your `.env` file:
     ```
     SERPAPI_KEY=your_api_key_here
     ```

2. **Get Yelp Place IDs**
   - Each restaurant on Yelp has a unique `place_id` (e.g., `-4ofMtrD7pSpZIX5pnDkig`)
   - You can get place_ids from:
     - The Yelp Search API (using SerpAPI's Yelp Search engine)
     - The Yelp website URL (extract from the business URL)
     - The `populateFromYelp.js` script (if you update it to store place_ids)

## Usage

### Command Line Script

Fetch reviews for a restaurant:

```bash
# Basic usage (use -- to pass arguments to the script)
npm run fetch-yelp-reviews -- <place_id>

# Examples
npm run fetch-yelp-reviews -- -4ofMtrD7pSpZIX5pnDkig
npm run fetch-yelp-reviews -- -4ofMtrD7pSpZIX5pnDkig --sortby rating_desc --num 20
npm run fetch-yelp-reviews -- -4ofMtrD7pSpZIX5pnDkig --not-recommended
npm run fetch-yelp-reviews -- -4ofMtrD7pSpZIX5pnDkig --rating 5 --q "dessert"

# Alternative: Run directly (no -- needed)
node scripts/fetchYelpReviews.js -4ofMtrD7pSpZIX5pnDkig
node scripts/fetchYelpReviews.js -4ofMtrD7pSpZIX5pnDkig --sortby rating_desc --num 20
```

**Options:**
- `--sortby <type>` - Sort by: `relevance_desc`, `date_desc`, `date_asc`, `rating_desc`, `rating_asc`, `elites_desc`
- `--num <number>` - Max results (default: 49, max: 49)
- `--start <number>` - Pagination offset (default: 0)
- `--rating <number>` - Filter by rating (1-5) or comma-separated (e.g., "5,4")
- `--q <query>` - Search query within reviews
- `--hl <lang>` - Language code (e.g., en, es, fr)
- `--not-recommended` - Fetch not recommended reviews
- `--no-cache` - Force fresh results (no cache)

### TypeScript Service

Use the service in your code:

```typescript
import { yelpReviewsService } from './src/services/yelpReviewsService'

// Get reviews for a restaurant
const reviews = await yelpReviewsService.getReviews({
  place_id: '-4ofMtrD7pSpZIX5pnDkig',
  sortby: 'rating_desc',
  num: 20
})

// Get all reviews with pagination
const allReviews = await yelpReviewsService.getAllReviews(
  '-4ofMtrD7pSpZIX5pnDkig',
  { sortby: 'date_desc' }
)

// Get reviews by rating
const fiveStarReviews = await yelpReviewsService.getReviewsByRating(
  '-4ofMtrD7pSpZIX5pnDkig',
  5
)

// Search reviews
const dessertReviews = await yelpReviewsService.searchReviews(
  '-4ofMtrD7pSpZIX5pnDkig',
  'dessert'
)

// Get not recommended reviews
const notRecommended = await yelpReviewsService.getNotRecommendedReviews(
  '-4ofMtrD7pSpZIX5pnDkig'
)
```

## Response Structure

The service returns a `YelpReviewsResponse` object with:

- `search_metadata` - Search metadata and status
- `search_information` - Business name and total results
- `reviews` - Array of review objects
- `review_languages` - Available languages and counts
- `serpapi_pagination` - Pagination info for next page

Each review includes:
- `user` - Reviewer information (name, location, stats)
- `comment` - Review text and language
- `date` - Review date
- `rating` - Star rating (1-5)
- `feedback` - Useful, funny, cool counts
- `photos` - Photos attached to review
- `owner_replies` - Business owner responses

## Storing Reviews

Currently, the script fetches and displays reviews. To store them in your database:

1. **Add a `yelp_reviews` table** to your Supabase database:
   ```sql
   CREATE TABLE yelp_reviews (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
     yelp_place_id TEXT NOT NULL,
     review_position INTEGER,
     user_name TEXT NOT NULL,
     user_id TEXT,
     user_location TEXT,
     rating INTEGER NOT NULL,
     comment_text TEXT NOT NULL,
     review_date TIMESTAMP WITH TIME ZONE,
     useful_count INTEGER DEFAULT 0,
     funny_count INTEGER DEFAULT 0,
     cool_count INTEGER DEFAULT 0,
     photos JSONB,
     owner_replies JSONB,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(yelp_place_id, user_id, review_date)
   );
   ```

2. **Update the script** to insert reviews into the database

3. **Add `yelp_place_id` to restaurants table** to link restaurants to their Yelp place IDs

## Rate Limits

SerpAPI has rate limits based on your plan:
- Free: 100 searches/month
- Paid plans: Higher limits

Use pagination carefully and consider caching results.

## Next Steps

- [ ] Add `yelp_place_id` field to restaurants table
- [ ] Create database table for storing Yelp reviews
- [ ] Update `populateFromYelp.js` to store place_ids
- [ ] Create a service to sync reviews periodically
- [ ] Add review display in the app UI

