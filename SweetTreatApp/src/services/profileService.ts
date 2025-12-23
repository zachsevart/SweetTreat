import { supabase } from './supabase'
import { Profile, ProfileUpdate } from '../types'
import { storageService } from './storageService'

export const profileService = {
  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
    return data
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Upload avatar and update profile
   */
  async uploadAvatar(userId: string, file: File | Blob): Promise<string> {
    // Upload to storage
    const path = await storageService.uploadAvatar(file, userId)
    
    // Get public URL
    const avatarUrl = storageService.getPublicUrl('avatars', path)
    
    // Update profile
    await this.updateProfile(userId, { avatar_url: avatarUrl })
    
    return avatarUrl
  },

  /**
   * Get profile with stats (video count, likes count, etc.)
   */
  async getProfileWithStats(userId: string) {
    const profile = await this.getProfile(userId)
    
    if (!profile) return null

    // Get video count
    const { count: videoCount } = await supabase
      .from('video_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Get likes received count
    const { count: likesReceived } = await supabase
      .from('user_likes')
      .select('*', { count: 'exact', head: true })
      .in('video_id', 
        supabase
          .from('video_reviews')
          .select('id')
          .eq('user_id', userId)
      )

    return {
      ...profile,
      stats: {
        videos: videoCount || 0,
        likesReceived: likesReceived || 0,
      },
    }
  },
}

