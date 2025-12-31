/**
 * Script to populate Supabase database with restaurant data from SerpAPI Yelp Search
 * 
 * Usage:
 *   1. Get a SerpAPI key from https://serpapi.com/
 *   2. Add SERPAPI_KEY to your .env file
 *   3. Run: node scripts/populateFromSerpapiYelp.js
 * 
 * Options:
 *   - Search term (default: "dessert")
 *   - Location (default: "San Francisco, CA")
 *   - Limit (default: 20)
 * 
 * Example:
 *   node scripts/populateFromSerpapiYelp.js "ice cream" "New York, NY" 30
 */

require('dotenv').config()
const { getJson } = require('serpapi')
const { createClient } = require('@supabase/supabase-js')
const axios = require('axios')

// Configuration
const SERPAPI_KEY = process.env.SERPAPI_KEY
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY

// Default search parameters
const DEFAULT_SEARCH_TERM = 'dessert'
const DEFAULT_LOCATION = 'San Francisco, CA'
const DEFAULT_LIMIT = 20

if (!SERPAPI_KEY) {
  console.error('❌ Error: SERPAPI_KEY not found in environment variables')
  console.log('   Please add SERPAPI_KEY to your .env file')
  console.log('   Get your API key from: https://serpapi.com/')
  process.exit(1)
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Supabase credentials not found')
  console.log('   Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file')
  console.log('   Note: Use SUPABASE_SERVICE_KEY (service role key) to bypass RLS policies')
  console.log('   You can find it in Supabase Dashboard > Settings > API')
  process.exit(1)
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

/**
 * Get approximate coordinates for a city/neighborhood (fallback when geocoding fails)
 */
function getApproximateCoordinates(city, state, neighborhood) {
  // Known city centroids (approximate)
  const cityCentroids = {
    'Seattle': { lat: 47.6062, lon: -122.3321 },
    'San Francisco': { lat: 37.7749, lon: -122.4194 },
    'New York': { lat: 40.7128, lon: -74.0060 },
    'Los Angeles': { lat: 34.0522, lon: -118.2437 },
    'Chicago': { lat: 41.8781, lon: -87.6298 },
    'Boston': { lat: 42.3601, lon: -71.0589 },
    'Austin': { lat: 30.2672, lon: -97.7431 },
  }
  
  // Known neighborhood offsets (small adjustments from city center)
  const neighborhoodOffsets = {
    'Denny Triangle': { lat: 0.005, lon: -0.003 },
    'Capitol Hill': { lat: 0.008, lon: -0.002 },
    'Downtown': { lat: 0, lon: 0 },
    'Mission': { lat: 0.01, lon: 0.005 },
    'SoMa': { lat: -0.005, lon: 0.003 },
  }
  
  const cityKey = Object.keys(cityCentroids).find(key => 
    city.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(city.toLowerCase())
  )
  
  if (cityKey) {
    const base = cityCentroids[cityKey]
    const offset = neighborhood ? neighborhoodOffsets[neighborhood] || { lat: 0, lon: 0 } : { lat: 0, lon: 0 }
    
    return {
      latitude: base.lat + offset.lat,
      longitude: base.lon + offset.lon
    }
  }
  
  return null
}

/**
 * Geocode an address to get coordinates using OpenStreetMap Nominatim (free)
 * Note: Nominatim has strict rate limits (1 request per second)
 */
async function geocodeAddress(address) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: address,
        format: 'json',
        limit: 1,
        addressdetails: 1, // Get detailed address components
        countrycodes: 'us', // Limit to US for better results
      },
      headers: {
        'User-Agent': 'SweetTreatApp/1.0 (contact: your-email@example.com)' // Required by Nominatim
      },
      timeout: 10000 // 10 second timeout (Nominatim can be slow)
    })
    
    if (response.data && response.data.length > 0) {
      const result = response.data[0]
      // Check if the result has reasonable coordinates
      if (result.lat && result.lon) {
        const lat = parseFloat(result.lat)
        const lon = parseFloat(result.lon)
        
        // Validate coordinates are reasonable (US bounds roughly)
        if (lat >= 24 && lat <= 50 && lon >= -125 && lon <= -66) {
          return {
            latitude: lat,
            longitude: lon
          }
        }
      }
    }
    return null
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      // Timeout - Nominatim might be slow or rate-limited
      return null
    } else if (error.response?.status === 429) {
      // Rate limited - wait longer
      console.warn(`   ⚠️  Rate limited, waiting 2 seconds...`)
      await new Promise((resolve) => setTimeout(resolve, 2000))
      return null
    } else {
      // Other error - silently fail and try next address format
      return null
    }
  }
}

/**
 * Get business details from SerpAPI using place_id
 */
function getBusinessDetails(placeId) {
  return new Promise((resolve, reject) => {
    // Use Yelp Reviews API to get business details (it includes location info)
    getJson(
      {
        engine: 'yelp_reviews',
        api_key: SERPAPI_KEY,
        place_id: placeId,
        num: 1, // We just need the metadata, not reviews
      },
      (json) => {
        if (json.error) {
          reject(new Error(json.error))
          return
        }

        if (json.search_metadata?.status === 'Error') {
          reject(new Error(json.error || 'Unknown error from SerpAPI'))
          return
        }

        resolve(json)
      }
    )
  })
}

/**
 * Search for businesses on Yelp using SerpAPI (with pagination support)
 */
async function searchYelpBusinesses(term, location, limit = 20) {
  const allBusinesses = []
  let start = 0
  const resultsPerPage = 10 // SerpAPI Yelp returns 10 results per page
  let hasMore = true
  
  while (allBusinesses.length < limit && hasMore) {
    try {
      const businesses = await new Promise((resolve, reject) => {
        getJson(
          {
            engine: 'yelp',
            api_key: SERPAPI_KEY,
            find_desc: term,
            find_loc: location,
            start: start,
          },
          (json) => {
            if (json.error) {
              reject(new Error(json.error))
              return
            }

            if (json.search_metadata?.status === 'Error') {
              reject(new Error(json.error || 'Unknown error from SerpAPI'))
              return
            }

            // Extract businesses from results
            // SerpAPI Yelp can return results in different formats
            const results = json.organic_results || json.local_results || json.businesses || []
            resolve(results)
          }
        )
      })
      
      if (businesses.length === 0) {
        hasMore = false
        break
      }
      
      // Add businesses to our collection
      allBusinesses.push(...businesses)
      
      // Check if we have enough or if there are more pages
      if (allBusinesses.length >= limit) {
        // Trim to exact limit
        allBusinesses.splice(limit)
        hasMore = false
      } else if (businesses.length < resultsPerPage) {
        // Last page (fewer than 10 results)
        hasMore = false
      } else {
        // Move to next page
        start += resultsPerPage
        // Small delay between pages to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
      
      // Debug: log first business structure if in debug mode (only on first page)
      if (process.env.DEBUG && start === 0 && allBusinesses.length > 0) {
        console.log('\n🔍 Debug: First business structure:')
        console.log(JSON.stringify(allBusinesses[0], null, 2))
      }
      
    } catch (error) {
      console.warn(`⚠️  Error fetching page starting at ${start}:`, error.message)
      hasMore = false
    }
  }
  
  console.log(`   📄 Fetched ${allBusinesses.length} businesses across ${Math.ceil(start / resultsPerPage) || 1} page(s)`)
  
  return allBusinesses
}

/**
 * Map SerpAPI Yelp business data to our database schema
 * businessDetails is optional and contains coordinates from business details API
 */
function mapYelpToRestaurant(yelpBusiness, businessDetails = null) {
  // Extract cuisine types from categories
  const categories = yelpBusiness.categories || yelpBusiness.category || []
  const cuisineTypes = categories.length > 0 
    ? categories.map((cat) => typeof cat === 'string' ? cat : cat.title || cat.name || cat).join(', ')
    : null
  
  // Map price range ($ = 1, $$ = 2, etc.)
  const priceRange = yelpBusiness.price_range || yelpBusiness.price || null
  
  // Get coordinates - try from business details first, then from business object
  let latitude = null
  let longitude = null
  
  // First try from business details (from yelp_reviews API metadata)
  if (businessDetails?.gps_coordinates) {
    latitude = businessDetails.gps_coordinates.latitude
    longitude = businessDetails.gps_coordinates.longitude
  } else if (businessDetails?.coordinates) {
    latitude = businessDetails.coordinates.latitude
    longitude = businessDetails.coordinates.longitude
  }
  
  // Then try from the business object itself
  if (!latitude || !longitude) {
    if (yelpBusiness.gps_coordinates) {
      latitude = yelpBusiness.gps_coordinates.latitude
      longitude = yelpBusiness.gps_coordinates.longitude
    } else if (yelpBusiness.coordinates) {
      latitude = yelpBusiness.coordinates.latitude
      longitude = yelpBusiness.coordinates.longitude
    } else if (yelpBusiness.latitude && yelpBusiness.longitude) {
      latitude = yelpBusiness.latitude
      longitude = yelpBusiness.longitude
    } else if (yelpBusiness.gps) {
      latitude = yelpBusiness.gps.latitude
      longitude = yelpBusiness.gps.longitude
    }
  }
  
  // If still no coordinates, we need to skip or use geocoding
  // For now, we'll throw an error and the caller can handle it
  if (!latitude || !longitude) {
    throw new Error(`Missing coordinates for ${yelpBusiness.title || yelpBusiness.name || 'Unknown'}`)
  }
  
  // Format address - prefer from business details if available
  let address = null
  
  if (businessDetails?.address) {
    if (Array.isArray(businessDetails.address)) {
      address = businessDetails.address.join(', ')
    } else {
      address = businessDetails.address
    }
  } else if (yelpBusiness.address) {
    if (Array.isArray(yelpBusiness.address)) {
      address = yelpBusiness.address.join(', ')
    } else {
      address = yelpBusiness.address
    }
  } else if (yelpBusiness.location) {
    if (Array.isArray(yelpBusiness.location)) {
      address = yelpBusiness.location.join(', ')
    } else if (typeof yelpBusiness.location === 'object') {
      // Location might be an object with address components
      const loc = yelpBusiness.location
      address = [
        loc.address1,
        loc.address2,
        loc.city,
        loc.state,
        loc.zip_code
      ].filter(Boolean).join(', ')
    } else {
      address = yelpBusiness.location
    }
  } else if (yelpBusiness.neighborhoods) {
    // Use neighborhood as fallback
    address = `${yelpBusiness.neighborhoods}, ${yelpBusiness.snippet || ''}`
  } else if (yelpBusiness.snippet) {
    address = yelpBusiness.snippet
  }
  
  if (!address) {
    address = 'Address not available'
  }
  
  // Get rating - convert to string since DB column is TEXT
  const rating = yelpBusiness.rating ? String(yelpBusiness.rating) : null
  
  // Get image
  const imageUrl = yelpBusiness.thumbnail || 
                   yelpBusiness.image || 
                   yelpBusiness.thumbnail_image ||
                   yelpBusiness.photos?.[0] || 
                   null
  
  return {
    name: yelpBusiness.title || yelpBusiness.name || 'Unknown',
    address: address,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    cuisine_type: cuisineTypes,
    price_range: priceRange,
    rating: rating,
    image_url: imageUrl,
  }
}

/**
 * Check if restaurant already exists in database
 */
async function restaurantExists(name, latitude, longitude) {
  // Use a tolerance for coordinates (about 100 meters)
  const tolerance = 0.001 // roughly 100 meters
  
  const { data, error } = await supabase
    .from('restaurants')
    .select('id')
    .eq('name', name)
    .gte('latitude', latitude - tolerance)
    .lte('latitude', latitude + tolerance)
    .gte('longitude', longitude - tolerance)
    .lte('longitude', longitude + tolerance)
    .limit(1)
  
  if (error) {
    console.error('Error checking existing restaurant:', error)
    return false
  }
  
  return data && data.length > 0
}

/**
 * Insert restaurant into Supabase
 */
async function insertRestaurant(restaurantData) {
  // Check if restaurant already exists
  const exists = await restaurantExists(
    restaurantData.name,
    restaurantData.latitude,
    restaurantData.longitude
  )
  
  if (exists) {
    console.log(`⏭️  Skipping ${restaurantData.name} (already exists)`)
    return { skipped: true }
  }
  
  const { data, error } = await supabase
    .from('restaurants')
    .insert(restaurantData)
    .select()
    .single()
  
  if (error) {
    console.error(`❌ Error inserting ${restaurantData.name}:`, error.message)
    return { error }
  }
  
  console.log(`✅ Added: ${restaurantData.name}`)
  return { data }
}

/**
 * Main function to populate database
 */
async function populateDatabase(searchTerm = DEFAULT_SEARCH_TERM, location = DEFAULT_LOCATION, limit = DEFAULT_LIMIT) {
  console.log(`\n🔍 Searching Yelp via SerpAPI for: "${searchTerm}" in "${location}"`)
  console.log(`📊 Limit: ${limit} results\n`)
  
  try {
    // Search Yelp via SerpAPI
    const businesses = await searchYelpBusinesses(searchTerm, location, limit)
    console.log(`📦 Found ${businesses.length} businesses from Yelp\n`)
    
    if (businesses.length === 0) {
      console.log('⚠️  No businesses found. Try different search terms or location.')
      return
    }
    
    // Process each business
    let successCount = 0
    let skipCount = 0
    let errorCount = 0
    
    for (const business of businesses) {
      try {
        // Get place_id from business (first one if array)
        const placeId = business.place_ids?.[0] || business.place_id
        
        // Try to get business details for coordinates if not present
        let businessDetails = null
        if (placeId && (!business.coordinates && !business.gps_coordinates)) {
          try {
            console.log(`   Fetching details for ${business.title || business.name}...`)
            businessDetails = await getBusinessDetails(placeId)
            
            // Debug: log what we got from business details
            if (process.env.DEBUG && businessDetails) {
              console.log(`   Business details structure:`, JSON.stringify({
                gps_coordinates: businessDetails.gps_coordinates,
                coordinates: businessDetails.coordinates,
                address: businessDetails.address,
                location: businessDetails.location
              }, null, 2))
            }
            
            // Small delay to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 1000))
          } catch (error) {
            console.warn(`   ⚠️  Could not fetch details for ${business.title || business.name}: ${error.message}`)
          }
        }
        
        // Try to map restaurant data
        let restaurantData
        try {
          restaurantData = mapYelpToRestaurant(business, businessDetails)
        } catch (error) {
          // If coordinates are missing, try geocoding
          if (error.message.includes('Missing coordinates')) {
            // Build address strings to try (in order of specificity)
            const addressAttempts = []
            
            // Extract city and state from location
            const locationMatch = location.match(/([^,]+),\s*([A-Z]{2})/i)
            const city = locationMatch ? locationMatch[1].trim() : location.split(',')[0].trim()
            const state = locationMatch ? locationMatch[2].trim() : (location.split(',')[1] || '').trim()
            
            // Try 1: Neighborhood + City + State (most specific for Nominatim)
            if (business.neighborhoods) {
              addressAttempts.push(`${business.neighborhoods}, ${city}, ${state}`)
            }
            
            // Try 2: Restaurant name + Neighborhood + City + State
            if (business.neighborhoods) {
              addressAttempts.push(`${business.title || business.name}, ${business.neighborhoods}, ${city}, ${state}`)
            }
            
            // Try 3: Just neighborhood + city (if state not available)
            if (business.neighborhoods && !state) {
              addressAttempts.push(`${business.neighborhoods}, ${city}`)
            }
            
            // Try 4: Restaurant name + City + State
            addressAttempts.push(`${business.title || business.name}, ${city}, ${state}`)
            
            // Try 5: Just city + state (centroid)
            if (state) {
              addressAttempts.push(`${city}, ${state}`)
            }
            
            let coords = null
            let successfulAddress = null
            
            // Try each address format
            for (const addressString of addressAttempts) {
              console.log(`   🔍 Geocoding: "${addressString}"`)
              coords = await geocodeAddress(addressString)
              
              // Wait between attempts (Nominatim requires 1 second between requests)
              await new Promise((resolve) => setTimeout(resolve, 1000))
              
              if (coords) {
                successfulAddress = addressString
                console.log(`   ✅ Geocoded: ${coords.latitude}, ${coords.longitude}`)
                break
              }
            }
            
            if (coords) {
              // Retry mapping with geocoded coordinates
              business.gps_coordinates = coords
              restaurantData = mapYelpToRestaurant(business, businessDetails)
            } else {
              // Last resort: Use approximate city/neighborhood centroid
              console.warn(`   ⚠️  Geocoding failed, using approximate location for ${city}, ${state}`)
              const approximateCoords = getApproximateCoordinates(city, state, business.neighborhoods)
              if (approximateCoords) {
                business.gps_coordinates = approximateCoords
                restaurantData = mapYelpToRestaurant(business, businessDetails)
                console.log(`   ⚠️  Using approximate coordinates: ${approximateCoords.latitude}, ${approximateCoords.longitude}`)
              } else {
                throw new Error(`Could not geocode address for ${business.title || business.name}. Tried ${addressAttempts.length} address formats and approximate location.`)
              }
            }
          } else {
            throw error
          }
        }
        
        const result = await insertRestaurant(restaurantData)
        
        if (result.skipped) {
          skipCount++
        } else if (result.error) {
          errorCount++
        } else {
          successCount++
        }
        
        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`❌ Error processing ${business.title || business.name}:`, error.message)
        errorCount++
      }
    }
    
    // Summary
    console.log(`\n📊 Summary:`)
    console.log(`   ✅ Added: ${successCount}`)
    console.log(`   ⏭️  Skipped: ${skipCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log(`\n✨ Done!\n`)
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

// Run the script
const args = process.argv.slice(2)
const searchTerm = args[0] || DEFAULT_SEARCH_TERM
const location = args[1] || DEFAULT_LOCATION
const limit = parseInt(args[2]) || DEFAULT_LIMIT

populateDatabase(searchTerm, location, limit)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

