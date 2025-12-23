import { supabase } from './supabase'
import type { Database } from '../types/database.types'

type UserLikeInsert = Database['public']['Tables']['user_likes']['Insert']

export const likesService = {
  /**
   * Toggle like on a video (like if not liked, unlike if liked)
   */
  async toggleLike(userId: string, videoId: string) {
    // Check if already liked
    const { data: existing } = await supabase
      .from('user_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .single()

    if (existing) {
      // Unlike
      const { error } = await supabase
        .from('user_likes')
        .delete()
        .eq('user_id', userId)
        .eq('video_id', videoId)

      if (error) throw error
      return { liked: false }
    } else {
      // Like
      // Type assertion needed due to TypeScript inference issue with Supabase types
      const { data, error } = await (supabase.from('user_likes') as any)
        .insert({ user_id: userId, video_id: videoId })
        .select()
        .single()

      if (error) throw error
      return { liked: true, data }
    }
  },

  /**
   * Check if user has liked a video
   */
  async isLiked(userId: string, videoId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
    return !!data
  },

  /**
   * Get all videos liked by a user
   */
  async getUserLikes(userId: string) {
    const { data, error } = await supabase
      .from('user_likes')
      .select('*, video:video_reviews(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  /**
   * Get all users who liked a video
   */
  async getVideoLikes(videoId: string) {
    const { data, error } = await supabase
      .from('user_likes')
      .select('*, user:profiles(*)')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  /**
   * Get like count for a video
   */
  async getLikeCount(videoId: string): Promise<number> {
    const { count, error } = await supabase
      .from('user_likes')
      .select('*', { count: 'exact', head: true })
      .eq('video_id', videoId)

    if (error) throw error
    return count || 0
  },
}

