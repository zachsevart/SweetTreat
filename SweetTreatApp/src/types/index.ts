import { Database } from './database.types'

export type Restaurant = Database['public']['Tables']['restaurants']['Row']
export type VideoReview = Database['public']['Tables']['video_reviews']['Row']
export type UserLike = Database['public']['Tables']['user_likes']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']

export type RestaurantInsert = Database['public']['Tables']['restaurants']['Insert']
export type VideoReviewInsert = Database['public']['Tables']['video_reviews']['Insert']
export type UserLikeInsert = Database['public']['Tables']['user_likes']['Insert']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']

export type RestaurantUpdate = Database['public']['Tables']['restaurants']['Update']
export type VideoReviewUpdate = Database['public']['Tables']['video_reviews']['Update']

export interface RestaurantWithVideos extends Restaurant {
  video_reviews?: VideoReview[]
}

export interface VideoReviewWithRestaurant extends VideoReview {
  restaurant?: Restaurant
}

