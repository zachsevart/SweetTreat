import { supabase } from './supabase'
import { VideoReview, VideoReviewInsert, VideoReviewUpdate } from '../types'

export const videoService = {
  /**
   * Get all video reviews
   */
  async getAll() {
    const { data, error } = await supabase
      .from('video_reviews')
      .select('*, restaurant:restaurants(*)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  /**
   * Get videos for a specific restaurant
   */
  async getByRestaurant(restaurantId: string) {
    const { data, error } = await supabase
      .from('video_reviews')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  /**
   * Get videos for reels feed (ordered by engagement)
   */
  async getReelsFeed(limit: number = 20) {
    const { data, error } = await supabase
      .from('video_reviews')
      .select('*, restaurant:restaurants(*)')
      .order('likes_count', { ascending: false })
      .order('views_count', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  },

  /**
   * Get video by ID
   */
  async getById(id: string) {
    const { data, error } = await supabase
      .from('video_reviews')
      .select('*, restaurant:restaurants(*)')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Create a new video review
   */
  async create(video: VideoReviewInsert) {
    const { data, error } = await supabase
      .from('video_reviews')
      .insert(video)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update video view count
   */
  async incrementViews(id: string) {
    const { data, error } = await supabase.rpc('increment_views', {
      video_id: id,
    })

    // If RPC doesn't exist, manually update
    if (error) {
      const video = await this.getById(id)
      if (video) {
        return this.update(id, { views_count: video.views_count + 1 })
      }
    }

    return data
  },

  /**
   * Update a video review
   */
  async update(id: string, updates: VideoReviewUpdate) {
    const { data, error } = await supabase
      .from('video_reviews')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },
}

