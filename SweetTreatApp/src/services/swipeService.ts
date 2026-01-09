import { supabase } from './supabase'
import { SavedRestaurant, SwipeHistory, SavedRestaurantInsert, SwipeHistoryInsert, Restaurant } from '../types'

export const swipeService = {
  /**
   * Save a restaurant (swipe right)
   * Creates entries in both saved_restaurants and swipe_history
   */
  async saveRestaurant(userId: string, restaurantId: string) {
    try {
      // Insert into saved_restaurants
      const { data: savedData, error: saveError } = await supabase
        .from('saved_restaurants')
        .insert({
          user_id: userId,
          restaurant_id: restaurantId,
        } as any)
        .select()
        .single()

      if (saveError && saveError.code !== '23505') {
        // 23505 is unique constraint violation (already saved) - that's okay
        throw saveError
      }

      // Insert into swipe_history
      const { error: historyError } = await supabase
        .from('swipe_history')
        .insert({
          user_id: userId,
          restaurant_id: restaurantId,
          action: 'right',
        } as any)

      if (historyError && historyError.code !== '23505') {
        // 23505 is unique constraint violation (already swiped) - that's okay
        throw historyError
      }

      return savedData
    } catch (error) {
      console.error('Error saving restaurant:', error)
      throw error
    }
  },

  /**
   * Skip a restaurant (swipe left)
   * Only creates entry in swipe_history
   */
  async skipRestaurant(userId: string, restaurantId: string) {
    try {
      const { data, error } = await supabase
        .from('swipe_history')
        .insert({
          user_id: userId,
          restaurant_id: restaurantId,
          action: 'left',
        } as any)
        .select()
        .single()

      if (error && error.code !== '23505') {
        // 23505 is unique constraint violation (already swiped) - that's okay
        throw error
      }

      return data
    } catch (error) {
      console.error('Error skipping restaurant:', error)
      throw error
    }
  },

  /**
   * Get restaurants the user hasn't swiped on yet
   * Optionally filters by location
   */
  async getUnswipedRestaurants(
    userId: string,
    options?: {
      latitude?: number
      longitude?: number
      limit?: number
    }
  ): Promise<Restaurant[]> {
    try {
      const { latitude, longitude, limit = 20 } = options || {}

      // Get all restaurant IDs the user has already swiped on
      const { data: swipedData, error: swipedError } = await supabase
        .from('swipe_history')
        .select('restaurant_id')
        .eq('user_id', userId)

      if (swipedError) throw swipedError

      const swipedRestaurantIds = new Set((swipedData as any)?.map((item: any) => item.restaurant_id) || [])

      // Build query for restaurants
      let query = supabase.from('restaurants').select('*')

      // Filter by location if provided (simple bounding box)
      if (latitude !== undefined && longitude !== undefined) {
        const latDelta = 0.45 // roughly 50km radius
        const lonDelta = 0.45
        query = query
          .gte('latitude', latitude - latDelta)
          .lte('latitude', latitude + latDelta)
          .gte('longitude', longitude - lonDelta)
          .lte('longitude', longitude + lonDelta)
      }

      // Order by rating (highest first), then by creation date
      query = query.order('rating', { ascending: false }).order('created_at', { ascending: false })

      // Get more results than needed to account for filtering
      query = query.limit(limit * 3) // Get 3x to account for filtering out swiped ones

      const { data, error } = await query

      if (error) throw error

      // Filter out already swiped restaurants
      const unswiped = (data || []).filter((restaurant: any) => !swipedRestaurantIds.has(restaurant.id))

      // Return only the requested limit
      return unswiped.slice(0, limit)
    } catch (error) {
      console.error('Error getting unswiped restaurants:', error)
      throw error
    }
  },

  /**
   * Get all saved restaurants for a user
   * Includes full restaurant details
   */
  async getSavedRestaurants(userId: string): Promise<(SavedRestaurant & { restaurant: Restaurant })[]> {
    try {
      const { data, error } = await supabase
        .from('saved_restaurants')
        .select(
          `
          *,
          restaurant:restaurants(*)
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as (SavedRestaurant & { restaurant: Restaurant })[]
    } catch (error) {
      console.error('Error getting saved restaurants:', error)
      throw error
    }
  },

  /**
   * Get count of saved restaurants for a user
   */
  async getSavedRestaurantsCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('saved_restaurants')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Error getting saved restaurants count:', error)
      throw error
    }
  },

  /**
   * Remove a saved restaurant (unsave)
   */
  async removeSavedRestaurant(userId: string, restaurantId: string) {
    try {
      const { error } = await supabase
        .from('saved_restaurants')
        .delete()
        .eq('user_id', userId)
        .eq('restaurant_id', restaurantId)

      if (error) throw error
    } catch (error) {
      console.error('Error removing saved restaurant:', error)
      throw error
    }
  },

  /**
   * Check if a restaurant is saved by the user
   */
  async isRestaurantSaved(userId: string, restaurantId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('saved_restaurants')
        .select('id')
        .eq('user_id', userId)
        .eq('restaurant_id', restaurantId)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned (not saved) - that's okay
        throw error
      }

      return !!data
    } catch (error) {
      console.error('Error checking if restaurant is saved:', error)
      throw error
    }
  },

  /**
   * Check if a restaurant has been swiped on (left or right)
   */
  async isRestaurantSwiped(userId: string, restaurantId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('swipe_history')
        .select('id')
        .eq('user_id', userId)
        .eq('restaurant_id', restaurantId)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned (not swiped) - that's okay
        throw error
      }

      return !!data
    } catch (error) {
      console.error('Error checking if restaurant is swiped:', error)
      throw error
    }
  },

  /**
   * Get swipe history for a user (optional, for debugging/admin)
   */
  async getSwipeHistory(userId: string, limit: number = 50): Promise<SwipeHistory[]> {
    try {
      const { data, error } = await supabase
        .from('swipe_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting swipe history:', error)
      throw error
    }
  },
}
