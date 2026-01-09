import { Database } from './database.types'

export type Restaurant = Database['public']['Tables']['restaurants']['Row']
export type VideoReview = Database['public']['Tables']['video_reviews']['Row']
export type UserLike = Database['public']['Tables']['user_likes']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type SavedRestaurant = Database['public']['Tables']['saved_restaurants']['Row']
export type SwipeHistory = Database['public']['Tables']['swipe_history']['Row']

export type RestaurantInsert = Database['public']['Tables']['restaurants']['Insert']
export type VideoReviewInsert = Database['public']['Tables']['video_reviews']['Insert']
export type UserLikeInsert = Database['public']['Tables']['user_likes']['Insert']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type SavedRestaurantInsert = Database['public']['Tables']['saved_restaurants']['Insert']
export type SwipeHistoryInsert = Database['public']['Tables']['swipe_history']['Insert']

export type RestaurantUpdate = Database['public']['Tables']['restaurants']['Update']
export type VideoReviewUpdate = Database['public']['Tables']['video_reviews']['Update']
export type SavedRestaurantUpdate = Database['public']['Tables']['saved_restaurants']['Update']
export type SwipeHistoryUpdate = Database['public']['Tables']['swipe_history']['Update']

export interface RestaurantWithVideos extends Restaurant {
  video_reviews?: VideoReview[]
}

export interface VideoReviewWithRestaurant extends VideoReview {
  restaurant?: Restaurant
}

