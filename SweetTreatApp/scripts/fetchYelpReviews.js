/**
 * Script to fetch Yelp reviews using SerpAPI and optionally store them
 * 
 * Usage:
 *   1. Get a SerpAPI key from https://serpapi.com/
 *   2. Add SERPAPI_KEY to your .env file
 *   3. Run: node scripts/fetchYelpReviews.js <place_id>
 * 
 * Examples:
 *   node scripts/fetchYelpReviews.js -4ofMtrD7pSpZIX5pnDkig
 *   node scripts/fetchYelpReviews.js -4ofMtrD7pSpZIX5pnDkig --sortby rating_desc --num 20
 *   node scripts/fetchYelpReviews.js -4ofMtrD7pSpZIX5pnDkig --not-recommended
 */

require('dotenv').config()
const { getJson } = require('serpapi')
const { createClient } = require('@supabase/supabase-js')

// Configuration
const SERPAPI_KEY = process.env.SERPAPI_KEY
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY

if (!SERPAPI_KEY) {
  console.error('❌ Error: SERPAPI_KEY not found in environment variables')
  console.log('   Please add SERPAPI_KEY to your .env file')
  console.log('   Get your API key from: https://serpapi.com/')
  process.exit(1)
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn('⚠️  Warning: Supabase credentials not found')
  console.log('   Reviews will be fetched but not stored in database')
}

// Initialize Supabase client (optional, only if storing reviews)
let supabase = null
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
}

/**
 * Fetch reviews from SerpAPI
 */
function fetchReviews(placeId, options = {}) {
  return new Promise((resolve, reject) => {
    const params = {
      engine: 'yelp_reviews',
      api_key: SERPAPI_KEY,
      place_id: placeId,
      sortby: options.sortby || 'relevance_desc',
      num: options.num || 49,
      start: options.start || 0,
    }

    // Optional parameters
    if (options.rating) params.rating = options.rating
    if (options.q) params.q = options.q
    if (options.hl) params.hl = options.hl
    if (options.yelp_domain) params.yelp_domain = options.yelp_domain
    if (options.not_recommended) {
      params.not_recommended = true
      if (options.not_recommended_start) {
        params.not_recommended_start = options.not_recommended_start
      }
    }
    if (options.no_cache) params.no_cache = true

    getJson(params, (json) => {
      if (json.error) {
        reject(new Error(json.error))
        return
      }

      if (json.search_metadata?.status === 'Error') {
        reject(new Error(json.error || 'Unknown error from SerpAPI'))
        return
      }

      resolve(json)
    })
  })
}

/**
 * Display review in a formatted way
 */
function displayReview(review, index) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`Review #${index + 1} (Position: ${review.position})`)
  console.log(`${'='.repeat(80)}`)
  console.log(`👤 User: ${review.user.name}`)
  console.log(`   Location: ${review.user.address || 'N/A'}`)
  console.log(`   Reviews: ${review.user.reviews || 0} | Photos: ${review.user.photos || 0}`)
  if (review.user.elite_year) {
    console.log(`   ⭐ Yelp Elite ${review.user.elite_year}`)
  }
  console.log(`\n⭐ Rating: ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)} (${review.rating}/5)`)
  console.log(`📅 Date: ${new Date(review.date).toLocaleDateString()}`)
  console.log(`\n💬 Review:`)
  console.log(`   ${review.comment.text}`)
  
  if (review.feedback) {
    console.log(`\n👍 Useful: ${review.feedback.useful} | 😂 Funny: ${review.feedback.funny} | 😎 Cool: ${review.feedback.cool}`)
  }

  if (review.photos && review.photos.length > 0) {
    console.log(`\n📸 Photos: ${review.photos.length}`)
    review.photos.slice(0, 3).forEach((photo, i) => {
      console.log(`   ${i + 1}. ${photo.link}`)
      if (photo.caption) console.log(`      Caption: ${photo.caption}`)
    })
  }

  if (review.owner_replies && review.owner_replies.length > 0) {
    console.log(`\n💼 Owner Reply:`)
    review.owner_replies.forEach((reply) => {
      console.log(`   ${reply.owner.name} (${reply.owner.role}):`)
      console.log(`   ${reply.comment}`)
      console.log(`   Date: ${new Date(reply.date).toLocaleDateString()}`)
    })
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.error('❌ Error: place_id is required')
    console.log('\nUsage:')
    console.log('  node scripts/fetchYelpReviews.js <place_id> [options]')
    console.log('  npm run fetch-yelp-reviews -- <place_id> [options]')
    console.log('\nOptions:')
    console.log('  --sortby <type>          Sort by: relevance_desc, date_desc, date_asc, rating_desc, rating_asc, elites_desc')
    console.log('  --num <number>           Max results (default: 49, max: 49)')
    console.log('  --start <number>        Pagination offset (default: 0)')
    console.log('  --rating <number>       Filter by rating (1-5) or comma-separated (e.g., "5,4")')
    console.log('  --q <query>             Search query within reviews')
    console.log('  --hl <lang>             Language code (e.g., en, es, fr)')
    console.log('  --not-recommended       Fetch not recommended reviews')
    console.log('  --no-cache              Force fresh results (no cache)')
    console.log('\nExample:')
    console.log('  node scripts/fetchYelpReviews.js -4ofMtrD7pSpZIX5pnDkig --sortby rating_desc --num 20')
    process.exit(1)
  }

  const placeId = args[0]
  
  // Parse options
  const options = {}
  for (let i = 1; i < args.length; i += 2) {
    const key = args[i]
    const value = args[i + 1]
    
    switch (key) {
      case '--sortby':
        options.sortby = value
        break
      case '--num':
        options.num = parseInt(value)
        break
      case '--start':
        options.start = parseInt(value)
        break
      case '--rating':
        options.rating = value
        break
      case '--q':
        options.q = value
        break
      case '--hl':
        options.hl = value
        break
      case '--not-recommended':
        options.not_recommended = true
        i-- // No value for this flag
        break
      case '--no-cache':
        options.no_cache = true
        i-- // No value for this flag
        break
      default:
        console.warn(`⚠️  Unknown option: ${key}`)
    }
  }

  console.log(`\n🔍 Fetching Yelp reviews for place_id: ${placeId}`)
  if (Object.keys(options).length > 0) {
    console.log(`📋 Options:`, options)
  }
  console.log('')

  try {
    const response = await fetchReviews(placeId, options)

    console.log(`\n✅ Success!`)
    console.log(`📊 Business: ${response.search_information.business}`)
    console.log(`📊 Total Results: ${response.search_information.total_results}`)
    console.log(`📊 Reviews Returned: ${response.reviews?.length || 0}`)
    
    if (response.review_languages && response.review_languages.length > 0) {
      console.log(`\n🌍 Review Languages:`)
      response.review_languages.forEach((lang) => {
        console.log(`   ${lang.hl}: ${lang.count} reviews`)
      })
    }

    if (response.reviews && response.reviews.length > 0) {
      console.log(`\n${'='.repeat(80)}`)
      console.log(`REVIEWS`)
      console.log(`${'='.repeat(80)}`)
      
      response.reviews.forEach((review, index) => {
        displayReview(review, index)
      })

      // Show pagination info
      if (response.serpapi_pagination?.next) {
        console.log(`\n📄 Next page available: ${response.serpapi_pagination.next}`)
      }
    } else {
      console.log('\n⚠️  No reviews found')
    }

    // Optionally save to file
    if (process.env.SAVE_TO_FILE === 'true') {
      const fs = require('fs')
      const filename = `yelp_reviews_${placeId}_${Date.now()}.json`
      fs.writeFileSync(filename, JSON.stringify(response, null, 2))
      console.log(`\n💾 Saved to: ${filename}`)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main()

