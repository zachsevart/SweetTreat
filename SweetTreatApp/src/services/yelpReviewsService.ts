import { getJson } from 'serpapi'

/**
 * SerpAPI Yelp Reviews Service
 * 
 * Fetches Yelp reviews using SerpAPI's Yelp Reviews API
 * Documentation: https://serpapi.com/yelp-reviews-api
 * 
 * Note: For React Native, use process.env.SERPAPI_KEY
 * For Node.js scripts, use process.env.SERPAPI_KEY from .env file
 */

export interface YelpReviewUser {
  name: string
  user_id: string
  link: string
  thumbnail?: string
  address?: string
  friends?: number
  photos?: number
  reviews?: number
  elite_year?: number
}

export interface YelpReviewComment {
  text: string
  language: string
}

export interface YelpReviewPhoto {
  link: string
  caption?: string
}

export interface YelpReviewOwnerReply {
  owner: {
    name: string
    thumbnail?: string
    role: string
  }
  comment: string
  date: string
}

export interface YelpReview {
  position: number
  user: YelpReviewUser
  comment: YelpReviewComment
  date: string
  rating: number
  feedback?: {
    useful: number
    funny: number
    cool: number
  }
  tags?: string[]
  photos?: YelpReviewPhoto[]
  owner_replies?: YelpReviewOwnerReply[]
}

export interface YelpReviewsResponse {
  search_metadata: {
    id: string
    status: string
    json_endpoint: string
    created_at: string
    processed_at: string
    yelp_reviews_url: string
    total_time_taken: number
  }
  search_parameters: {
    engine: string
    place_id: string
    [key: string]: any
  }
  search_information: {
    business: string
    total_results: number
  }
  review_languages?: Array<{
    hl: string
    count: number
  }>
  reviews: YelpReview[]
  serpapi_pagination?: {
    next?: string
  }
}

export interface YelpReviewsOptions {
  place_id: string
  sortby?: 'relevance_desc' | 'date_desc' | 'date_asc' | 'rating_desc' | 'rating_asc' | 'elites_desc'
  rating?: number | string // e.g., 5 or "5,4,3"
  q?: string // Search query within reviews
  hl?: string // Language code (e.g., 'en', 'es', 'fr')
  yelp_domain?: string // Default: 'yelp.com'
  start?: number // Pagination offset (default: 0)
  num?: number // Max results (default: 49, max: 49)
  not_recommended?: boolean // Fetch not recommended reviews
  not_recommended_start?: number // Pagination for not_recommended reviews
  no_cache?: boolean
}

class YelpReviewsService {
  private apiKey: string

  constructor() {
    // Try to get API key from environment
    // In React Native: use process.env.SERPAPI_KEY or Constants.expoConfig?.extra?.serpapiKey
    // In Node.js: use process.env.SERPAPI_KEY from .env file
    this.apiKey = process.env.SERPAPI_KEY || ''
    
    if (!this.apiKey && typeof window === 'undefined') {
      // Only warn in Node.js environment, not in React Native (where it might be set differently)
      console.warn(
        '⚠️ SERPAPI_KEY not found. Please set it in your .env file or environment variables.'
      )
    }
  }

  /**
   * Fetch Yelp reviews for a restaurant by place_id
   */
  async getReviews(options: YelpReviewsOptions): Promise<YelpReviewsResponse> {
    if (!this.apiKey) {
      throw new Error('SERPAPI_KEY is required. Please set it in your .env file.')
    }

    if (!options.place_id) {
      throw new Error('place_id is required')
    }

    return new Promise((resolve, reject) => {
      getJson(
        {
          engine: 'yelp_reviews',
          api_key: this.apiKey,
          place_id: options.place_id,
          sortby: options.sortby || 'relevance_desc',
          rating: options.rating,
          q: options.q,
          hl: options.hl,
          yelp_domain: options.yelp_domain,
          start: options.start,
          num: options.num || 49,
          not_recommended: options.not_recommended,
          not_recommended_start: options.not_recommended_start,
          no_cache: options.no_cache,
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

          resolve(json as YelpReviewsResponse)
        }
      )
    })
  }

  /**
   * Fetch all reviews with pagination
   */
  async getAllReviews(
    place_id: string,
    options: Omit<YelpReviewsOptions, 'place_id'> = {}
  ): Promise<YelpReview[]> {
    const allReviews: YelpReview[] = []
    let start = options.start || 0
    const num = options.num || 49
    let hasMore = true

    while (hasMore) {
      try {
        const response = await this.getReviews({
          place_id,
          ...options,
          start,
          num,
        })

        if (response.reviews && response.reviews.length > 0) {
          allReviews.push(...response.reviews)

          // Check if there's a next page
          if (response.serpapi_pagination?.next) {
            start += num
            // Small delay to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 1000))
          } else {
            hasMore = false
          }
        } else {
          hasMore = false
        }
      } catch (error) {
        console.error(`Error fetching reviews at offset ${start}:`, error)
        hasMore = false
      }
    }

    return allReviews
  }

  /**
   * Get recommended reviews (default)
   */
  async getRecommendedReviews(
    place_id: string,
    options: Omit<YelpReviewsOptions, 'place_id' | 'not_recommended'> = {}
  ): Promise<YelpReviewsResponse> {
    return this.getReviews({
      place_id,
      ...options,
      not_recommended: false,
    })
  }

  /**
   * Get not recommended reviews
   */
  async getNotRecommendedReviews(
    place_id: string,
    options: Omit<YelpReviewsOptions, 'place_id' | 'not_recommended'> = {}
  ): Promise<YelpReviewsResponse> {
    return this.getReviews({
      place_id,
      ...options,
      not_recommended: true,
    })
  }

  /**
   * Get reviews filtered by rating
   */
  async getReviewsByRating(
    place_id: string,
    rating: number | string,
    options: Omit<YelpReviewsOptions, 'place_id' | 'rating'> = {}
  ): Promise<YelpReviewsResponse> {
    return this.getReviews({
      place_id,
      ...options,
      rating,
    })
  }

  /**
   * Search reviews by query text
   */
  async searchReviews(
    place_id: string,
    query: string,
    options: Omit<YelpReviewsOptions, 'place_id' | 'q'> = {}
  ): Promise<YelpReviewsResponse> {
    return this.getReviews({
      place_id,
      ...options,
      q: query,
    })
  }
}

export const yelpReviewsService = new YelpReviewsService()
