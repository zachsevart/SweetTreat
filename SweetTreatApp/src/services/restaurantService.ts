import { supabase } from './supabase'
import { Restaurant, RestaurantInsert, RestaurantUpdate } from '../types'

export const restaurantService = {
  /**
   * Get all restaurants
   */
  async getAll() {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  /**
   * Get restaurant by ID
   */
  async getById(id: string) {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Get restaurants near a location
   */
  async getNearby(latitude: number, longitude: number, radiusKm: number = 5) {
    // Using PostGIS function st_dwithin (requires PostGIS extension in Supabase)
    // For MVP, we'll use a simple bounding box approach
    const latDelta = radiusKm / 111 // roughly 1 degree = 111km
    const lonDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180))

    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .gte('latitude', latitude - latDelta)
      .lte('latitude', latitude + latDelta)
      .gte('longitude', longitude - lonDelta)
      .lte('longitude', longitude + lonDelta)

    if (error) throw error
    return data
  },

  /**
   * Search restaurants by name
   */
  async search(query: string) {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .ilike('name', `%${query}%`)

    if (error) throw error
    return data
  },

  /**
   * Filter restaurants by cuisine type
   */
  async getByCuisine(cuisineType: string) {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('cuisine_type', cuisineType)

    if (error) throw error
    return data
  },

  /**
   * Create a new restaurant
   */
  async create(restaurant: RestaurantInsert) {
    const { data, error } = await supabase
      .from('restaurants')
      .insert(restaurant)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a restaurant
   */
  async update(id: string, updates: RestaurantUpdate) {
    const { data, error } = await supabase
      .from('restaurants')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete a restaurant
   */
  async delete(id: string) {
    const { data, error } = await supabase
      .from('restaurants')
      .delete()
      .eq('id', id)

    if (error) throw error
    return data
  },
}

